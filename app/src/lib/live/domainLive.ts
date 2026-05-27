/**
 * Supabase reads/writes for Phase 1.
 * Maps DB rows ↔ domain types for the UI.
 */
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";
import type {
  BusinessSettings,
  CapitalEntry,
  Customer,
  DailyCashBreakdown,
  ExpenseListItem,
  OutstandingBill,
  Payment,
  PnlTotals,
  Product,
  ProductScheme,
  PurchaseDetail,
  PurchaseListItem,
  Sale,
  SaleLine,
  Supplier,
  BillStatus,
} from "@/domain/types";
import { DEFAULT_BUSINESS_SETTINGS } from "@/domain/defaults";
import { roundMoney } from "@/lib/money";
import { normalizeInvoiceNoSpoken } from "@/lib/voiceInvoiceNo";
import type { DashboardPeriodTotals } from "@/domain/defaults";
import { isFocSaleLine } from "@/lib/billFoc";
import { billLineAmount } from "@/lib/saleLineMath";
import { linePricingForProduct, productFromSalesEmbed } from "@/lib/uom";
import { saleLineToRpcItem } from "@/lib/uom";
import { parseUomConversion, parseUomPrices, toDbUomConversion, toDbUomPrices } from "@/lib/uom";

export const DOMAIN_QUERY_KEY = ["domain", "v1"] as const;
export const CAPITAL_QUERY_KEY = ["capital", "v1"] as const;

export type DomainBundle = {
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  sales: Sale[];
  payments: Payment[];
  schemes: ProductScheme[];
  business: BusinessSettings;
  pnl: PnlTotals;
  latestCashClosing: number;
  expenses: ExpenseListItem[];
  purchases: PurchaseListItem[];
};

function mapUiPaymentModeToDb(mode: string): "Cash" | "UPI" | "Cheque" | "Bank" | "Other" {
  if (mode === "Cash") return "Cash";
  if (mode === "Cheque") return "Cheque";
  if (["eSewa", "Khalti", "FonePay", "Mobile banking"].includes(mode)) return "UPI";
  return "Other";
}

async function tenantIdForCurrentUser(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data: tu, error: te } = await supabase
    .from("tenant_users")
    .select("tenant_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (te) throw te;
  const tenantId = tu?.tenant_id as string | undefined;
  if (!tenantId) throw new Error("No tenant for user");
  return tenantId;
}

function billStatus(total: number, paid: number): BillStatus {
  const bal = Math.max(0, total - paid);
  if (bal <= 0) return "paid";
  if (paid > 0) return "partial";
  return "current";
}

const PRODUCT_SELECT_FULL =
  "id, code, name, category, unit, purchase_price, sale_price, opening_stock, mrp, discount_pct, vat_applicable, min_qty, min_qty_pack, is_active, uom_prices, uom_conversion";
const PRODUCT_SELECT_LEGACY =
  "id, code, name, category, unit, purchase_price, sale_price, opening_stock, mrp, discount_pct, vat_applicable, min_qty, is_active";

function isMissingColumnError(err: { message?: string } | null, col: string): boolean {
  const m = err?.message ?? "";
  return m.includes(col) && (m.includes("does not exist") || m.includes("Could not find"));
}

function purchaseRpcError(err: { message?: string } | null, opts?: { settingInvoice?: boolean }): Error {
  const m = err?.message ?? "Purchase failed";
  if (
    opts?.settingInvoice &&
    (m.includes("Could not find the function") || m.includes("p_supplier_invoice_no"))
  ) {
    return new Error(
      "Cannot save invoice number yet. Run migration 0016_purchase_invoice_backfill.sql in Supabase (README step 17), then try again.",
    );
  }
  return new Error(m);
}

export async function fetchProductsLive(): Promise<Product[]> {
  let rows: Record<string, unknown>[] | null = null;
  let error: { message?: string } | null = null;

  const full = await supabase
    .from("products")
    .select(PRODUCT_SELECT_FULL)
    .eq("is_active", true)
    .order("name");
  rows = full.data;
  error = full.error;

  if (
    error &&
    (isMissingColumnError(error, "uom_prices") ||
      isMissingColumnError(error, "uom_conversion") ||
      isMissingColumnError(error, "min_qty_pack"))
  ) {
    const legacy = await supabase
      .from("products")
      .select(PRODUCT_SELECT_LEGACY)
      .eq("is_active", true)
      .order("name");
    rows = legacy.data;
    error = legacy.error;
  }

  if (error) throw error;

  const { data: stockRows, error: se } = await supabase.from("v_stock").select("product_id, closing_stock");
  if (se) throw se;
  const stockMap = new Map<string, number>();
  for (const s of stockRows ?? []) stockMap.set(s.product_id as string, Number(s.closing_stock));

  return (rows ?? []).map((r) => {
    const uom = (r.unit as string) ?? "PCS";
    const mrp = Number(r.mrp ?? 0);
    const sellingPrice = Number(r.sale_price);
    return {
      id: r.id as string,
      name: r.name as string,
      category: (r.category as string) ?? "",
      uom,
      mrp,
      costPrice: Number(r.purchase_price),
      sellingPrice,
      uomPrices: parseUomPrices(
        "uom_prices" in r ? r.uom_prices : null,
        uom,
        mrp,
        sellingPrice,
      ),
      uomConversion: parseUomConversion(
        "uom_conversion" in r ? r.uom_conversion : null,
        uom,
      ),
      discountPct: Number(r.discount_pct ?? 0),
      vatApplicable: Boolean(r.vat_applicable),
      onHand: stockMap.get(r.id as string) ?? Number(r.opening_stock),
      minQty: Number(r.min_qty ?? 20),
      minQtyPack: "min_qty_pack" in r && r.min_qty_pack != null ? Number(r.min_qty_pack) : undefined,
      description: undefined,
    };
  });
}

export async function fetchCustomersLive(): Promise<Customer[]> {
  const { data: cust, error } = await supabase
    .from("customers")
    .select("id, name, phone, area, address, credit_limit, opening_balance")
    .eq("is_active", true)
    .order("name");
  if (error) throw error;

  const { data: balRows, error: be } = await supabase
    .from("v_customer_balance")
    .select("customer_id, balance, last_payment_date");
  if (be) throw be;
  const balMap = new Map<string, { balance: number; last?: string | null }>();
  for (const b of balRows ?? []) {
    balMap.set(b.customer_id as string, { balance: Number(b.balance), last: b.last_payment_date as string | null });
  }

  const { data: salesForAge, error: se } = await supabase.from("sales_bills").select("customer_id, bill_date, total, paid");
  if (se) throw se;
  const oldestOpen = new Map<string, number>();
  const today = new Date();
  for (const s of salesForAge ?? []) {
    const open = Number(s.total) - Number(s.paid);
    if (open <= 0.01) continue;
    const cid = s.customer_id as string;
    const bd = new Date(s.bill_date as string);
    const days = Math.floor((today.getTime() - bd.getTime()) / (86400 * 1000));
    oldestOpen.set(cid, Math.max(oldestOpen.get(cid) ?? 0, days));
  }

  return (cust ?? []).map((c) => {
    const b = balMap.get(c.id as string);
    const outstanding = b?.balance ?? Number(c.opening_balance);
    return {
      id: c.id as string,
      name: c.name as string,
      phone: (c.phone as string) ?? "",
      area: (c.area as string) ?? "",
      address: (c.address as string) ?? "",
      panNumber: "",
      outstanding,
      creditLimit: Number(c.credit_limit),
      oldestBillDays: outstanding > 0 ? oldestOpen.get(c.id as string) ?? 0 : 0,
    };
  });
}

export async function fetchSuppliersLive(): Promise<Supplier[]> {
  const { data: sup, error } = await supabase.from("suppliers").select("*").eq("is_active", true).order("name");
  if (error) throw error;
  const { data: balRows, error: be } = await supabase.from("v_supplier_balance").select("supplier_id, balance");
  if (be) throw be;
  const balMap = new Map<string, number>();
  for (const b of balRows ?? []) balMap.set(b.supplier_id as string, Number(b.balance));

  return (sup ?? []).map((s) => ({
    id: s.id as string,
    name: s.name as string,
    legalName: s.name as string,
    contactPerson: "",
    phone: (s.phone as string) ?? "",
    email: "",
    addressLine1: (s.address as string) ?? "",
    addressLine2: "",
    district: "",
    country: "Nepal",
    panNumber: "",
    vatNumber: "",
    paymentTermsDays: 30,
    outstanding: balMap.get(s.id as string) ?? Number(s.payable_opening),
    notes: "",
  }));
}

/** PostgREST may return a single embedded row or a one-element array. */
function embedOne<T>(v: T | T[] | null | undefined): T | undefined {
  if (v == null) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

type BillRow = {
  id: string;
  bill_no: string;
  bill_date: string;
  customer_id: string;
  payment_mode: string;
  subtotal: number;
  discount: number;
  total: number;
  paid: number;
  notes: string | null;
  vat_amount: number | null;
  extra_charges: number | null;
  customers?: { name: string } | { name: string }[] | null;
};

type ItemRow = {
  bill_id: string;
  product_id: string;
  qty: number;
  rate: number;
  unit?: string | null;
  products?:
    | {
        name: string;
        unit: string;
        mrp?: number;
        sale_price?: number;
        discount_pct?: number;
        uom_prices?: unknown;
        uom_conversion?: unknown;
      }
    | {
        name: string;
        unit: string;
        mrp?: number;
        sale_price?: number;
        discount_pct?: number;
        uom_prices?: unknown;
        uom_conversion?: unknown;
      }[]
    | null;
};

export async function fetchSalesLive(): Promise<Sale[]> {
  const { data: bills, error } = await supabase
    .from("sales_bills")
    .select("id, bill_no, bill_date, customer_id, payment_mode, subtotal, discount, total, paid, notes, vat_amount, extra_charges, customers(name)")
    .order("bill_date", { ascending: false });
  if (error) throw error;

  const billIds = (bills ?? []).map((b) => (b as unknown as BillRow).id);
  const itemsByBill = new Map<string, ItemRow[]>();
  if (billIds.length) {
    let items: unknown[] | null = null;
    let ie: { message?: string } | null = null;
    const productEmbed =
      "name, unit, mrp, sale_price, discount_pct, uom_prices, uom_conversion";
    const withUom = await supabase
      .from("sales_items")
      .select(`bill_id, product_id, qty, rate, unit, products(${productEmbed})`)
      .in("bill_id", billIds);
    items = withUom.data;
    ie = withUom.error;
    if (ie && (isMissingColumnError(ie, "unit") || isMissingColumnError(ie, "uom_prices"))) {
      const withUnit = await supabase
        .from("sales_items")
        .select("bill_id, product_id, qty, rate, unit, products(name, unit, mrp, sale_price, discount_pct)")
        .in("bill_id", billIds);
      items = withUnit.data;
      ie = withUnit.error;
    }
    if (ie && isMissingColumnError(ie, "unit")) {
      const legacy = await supabase
        .from("sales_items")
        .select("bill_id, product_id, qty, rate, products(name, unit, mrp, discount_pct)")
        .in("bill_id", billIds);
      items = legacy.data;
      ie = legacy.error;
    }
    if (ie) throw ie;
    for (const it of items ?? []) {
      const row = it as unknown as ItemRow;
      const bid = row.bill_id;
      const arr = itemsByBill.get(bid) ?? [];
      arr.push(row);
      itemsByBill.set(bid, arr);
    }
  }

  return (bills ?? []).map((raw) => {
    const b = raw as unknown as BillRow;
    const cust = embedOne(b.customers as { name: string } | { name: string }[] | null | undefined);
    const items = itemsByBill.get(b.id) ?? [];
    const vatAmt = Number(b.vat_amount ?? 0);
    const extra = Number(b.extra_charges ?? 0);
    const sub = Number(b.subtotal);
    const disc = Number(b.discount);
    const afterDisc = sub - disc;
    let discountType: Sale["discountType"] = "none";
    let discountValue = 0;
    if (disc > 0 && sub > 0) {
      const pct = Math.round((disc / sub) * 100);
      if (pct >= 1 && pct <= 100 && Math.abs(roundMoney((sub * pct) / 100) - disc) <= 0.01) {
        discountType = "percent";
        discountValue = pct;
      } else {
        discountType = "flat";
        discountValue = disc;
      }
    } else if (disc > 0) {
      discountType = "flat";
      discountValue = disc;
    }
    const vatRate = vatAmt > 0 ? 13 : 0;
    const lines: SaleLine[] = items.map((it) => {
      const prod = embedOne(it.products);
      const discountPct = Number(prod?.discount_pct ?? 0);
      const qty = Number(it.qty);
      const rate = Number(it.rate);
      const uom = ((it.unit as string)?.trim() || prod?.unit) ?? "PCS";
      const amount = billLineAmount({ qty, rate, discountPct });
      const displayMrp = prod
        ? linePricingForProduct(productFromSalesEmbed(prod), uom).mrp
        : rate;
      const foc = isFocSaleLine({ rate, qty, amount });
      return {
        productId: it.product_id,
        productName: prod?.name ?? "",
        uom,
        qty,
        mrp: displayMrp > 0 ? displayMrp : rate,
        rate,
        discountPct,
        amount,
        isFoc: foc,
        focNote: foc ? "FOC" : undefined,
      };
    });

    const total = Number(b.total);
    const paidNow = Number(b.paid);
    const grandTotal = total;
    const balance = Math.max(0, grandTotal - paidNow);

    const sale: Sale = {
      id: b.id,
      billNo: b.bill_no,
      date: b.bill_date,
      customerId: b.customer_id,
      customerName: cust?.name ?? "",
      lines,
      subtotal: sub,
      discountType,
      discountValue,
      discountAmount: disc,
      afterDiscount: afterDisc,
      billTerms: extra > 0 ? "Charges" : "",
      billTermsAmount: extra,
      vatRate,
      vatAmount: vatAmt,
      grandTotal,
      paidNow,
      paymentMode: b.payment_mode ?? "",
      balance,
      dueDate: b.bill_date,
      notes: b.notes ?? "",
      total: grandTotal,
    };
    return sale;
  });
}

export function deriveOutstandingBills(sales: Sale[]): OutstandingBill[] {
  return sales
    .filter((s) => s.balance > 0.01)
    .map((s) => ({
      id: `ob-${s.id}`,
      saleId: s.id,
      customerId: s.customerId,
      billNo: s.billNo,
      billDate: s.date,
      dueDate: s.dueDate,
      billTotal: s.grandTotal,
      paidAmount: s.paidNow,
      balance: s.balance,
      status: billStatus(s.grandTotal, s.paidNow),
    }));
}

export async function fetchPaymentsLive(): Promise<Payment[]> {
  const { data: rows, error } = await supabase
    .from("payments")
    .select("id, payment_date, customer_id, amount, mode, notes, sales_bills(bill_no), customers(name)")
    .order("payment_date", { ascending: false })
    .limit(200);
  if (error) throw error;
  type PayRow = {
    id: string;
    payment_date: string;
    customer_id: string;
    amount: number;
    mode: string;
    notes: string | null;
    sales_bills?: { bill_no: string } | { bill_no: string }[] | null;
    customers?: { name: string } | { name: string }[] | null;
  };
  return (rows ?? []).map((raw) => {
    const r = raw as unknown as PayRow;
    const billRel = embedOne(r.sales_bills);
    const custRel = embedOne(r.customers);
    const billNo = billRel?.bill_no ?? "";
    return {
      id: r.id as string,
      date: r.payment_date as string,
      customerId: r.customer_id as string,
      customerName: custRel?.name ?? "",
      amount: Number(r.amount),
      mode: r.mode as string,
      reference: (r.notes as string) ?? "",
      billNo,
    };
  });
}

export async function peekNextBillNoLive(): Promise<string> {
  const { data: ts } = await supabase.from("tenant_settings").select("invoice_prefix").maybeSingle();
  const prefix = (ts?.invoice_prefix as string)?.trim() || "INV";
  const { data: bills } = await supabase.from("sales_bills").select("bill_no").like("bill_no", `${prefix}-%`);
  let maxN = 0;
  for (const b of bills ?? []) {
    const m = (b.bill_no as string).match(/-(\d+)$/);
    if (m) maxN = Math.max(maxN, parseInt(m[1], 10));
  }
  return `${prefix}-${maxN + 1}`;
}

export async function commitSaleLive(sale: Sale): Promise<{ billNo: string; id: string }> {
  const items = sale.lines
    .filter((l) => l.productId)
    .map((l) =>
      saleLineToRpcItem({
        productId: l.productId,
        qty: l.qty,
        mrp: l.mrp,
        rate: l.rate,
        discountPct: l.discountPct,
        uom: l.uom,
      }),
    );

  const payMode =
    sale.balance <= 0 && sale.paidNow >= sale.grandTotal
      ? sale.paymentMode || "Cash"
      : sale.paidNow > 0
        ? sale.paymentMode || "Cash"
        : "Credit";

  const billNoKey = (sale.billNo ?? "").trim();

  /** Prefer UUID (edit flow) so we never miss the row if bill_no in UI drifted from DB. */
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  let existingId: string | undefined;

  if (uuidRe.test(sale.id)) {
    const { data: byId, error: idErr } = await supabase
      .from("sales_bills")
      .select("id")
      .eq("id", sale.id)
      .maybeSingle();
    if (idErr) throw idErr;
    existingId = byId?.id as string | undefined;
  }

  if (!existingId && billNoKey) {
    const { data: byNo, error: noErr } = await supabase
      .from("sales_bills")
      .select("id")
      .eq("bill_no", billNoKey)
      .maybeSingle();
    if (noErr) throw noErr;
    existingId = byNo?.id as string | undefined;
  }

  if (existingId) {
    const { data, error } = await supabase.rpc("update_sales_bill", {
      p_bill_id: existingId,
      p_customer_id: sale.customerId,
      p_bill_date: sale.date,
      p_payment_mode: payMode,
      p_discount: sale.discountAmount,
      p_items: items,
      p_notes: sale.notes || null,
      p_vat_amount: sale.vatAmount,
      p_extra_charges: sale.billTermsAmount,
    });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    const billId = (row as { bill_id?: string; bill_no?: string })?.bill_id ?? existingId;
    const outNo = (row as { bill_no?: string })?.bill_no ?? billNoKey;
    // Defer invalidation so React Router can apply navigate() from the save handler first.
    globalThis.setTimeout(() => {
      void queryClient.invalidateQueries({ queryKey: DOMAIN_QUERY_KEY });
    }, 0);
    return { billNo: outNo, id: billId };
  }

  const { data, error } = await supabase.rpc("create_sales_bill", {
    p_customer_id: sale.customerId,
    p_bill_date: sale.date,
    p_payment_mode: payMode,
    p_discount: sale.discountAmount,
    p_items: items,
    p_paid: sale.paidNow,
    p_notes: sale.notes || null,
    p_vat_amount: sale.vatAmount,
    p_extra_charges: sale.billTermsAmount,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  const billId = (row as { bill_id?: string; bill_no?: string })?.bill_id ?? "";
  const billNo = (row as { bill_no?: string })?.bill_no ?? sale.billNo;
  globalThis.setTimeout(() => {
    void queryClient.invalidateQueries({ queryKey: DOMAIN_QUERY_KEY });
  }, 0);
  return { billNo, id: billId };
}

export async function commitPaymentLive(opts: {
  customerId: string;
  amount: number;
  mode: string;
  reference: string;
  date: string;
  allocations: { saleId: string; amount: number; billNo: string }[];
}): Promise<void> {
  const allocs = opts.allocations
    .filter((a) => a.amount > 0)
    .map((a) => ({ bill_id: a.saleId, amount: a.amount }));

  const { error } = await supabase.rpc("apply_customer_payment", {
    p_payment_date: opts.date,
    p_customer_id: opts.customerId,
    p_amount: opts.amount,
    p_mode: opts.mode,
    p_notes: opts.reference || null,
    p_allocations: allocs,
  });
  if (error) throw error;
  await queryClient.invalidateQueries({ queryKey: DOMAIN_QUERY_KEY });
  await queryClient.refetchQueries({ queryKey: DOMAIN_QUERY_KEY });
}

export async function commitReturnLive(opts: {
  customerId: string;
  saleId: string;
  billNo: string;
  creditAmount: number;
  lines: { productId: string; returnQty: number }[];
}): Promise<void> {
  const lines = opts.lines
    .filter((l) => l.returnQty > 0)
    .map((l) => ({
      product_id: l.productId,
      return_qty: l.returnQty,
      reason: "return",
      credit_note_amount: 0,
    }));

  const { error } = await supabase.rpc("apply_goods_return", {
    p_return_date: new Date().toISOString().slice(0, 10),
    p_customer_id: opts.customerId,
    p_bill_id: opts.saleId,
    p_credit_amount: opts.creditAmount,
    p_lines: lines,
    p_notes: null,
  });
  if (error) throw error;
  void queryClient.invalidateQueries({ queryKey: DOMAIN_QUERY_KEY });
}

function purchaseLinesToRpc(
  lines: { productId: string; receivedQty: number; rateExcl: number }[],
): { product_id: string; qty: number; rate_excl: number }[] {
  return lines
    .filter((l) => l.receivedQty > 0)
    .map((l) => ({
      product_id: l.productId,
      qty: l.receivedQty,
      rate_excl: l.rateExcl,
    }));
}

export async function commitPurchaseLive(opts: {
  supplierId: string;
  purchaseDate: string;
  supplierInvoiceNo?: string | null;
  lines: { productId: string; receivedQty: number; rateExcl: number }[];
  totalReceived: number;
}): Promise<{ purchaseNo: string; purchaseId: string }> {
  const { data, error } = await supabase.rpc("record_purchase", {
    p_purchase_date: opts.purchaseDate,
    p_supplier_id: opts.supplierId,
    p_lines: purchaseLinesToRpc(opts.lines),
    p_notes: null,
    p_supplier_invoice_no: opts.supplierInvoiceNo
      ? normalizeInvoiceNoSpoken(opts.supplierInvoiceNo) || null
      : null,
  });
  if (error) throw purchaseRpcError(error, { settingInvoice: Boolean(opts.supplierInvoiceNo?.trim()) });
  const row = Array.isArray(data) ? data[0] : data;
  void queryClient.invalidateQueries({ queryKey: DOMAIN_QUERY_KEY });
  return {
    purchaseId: (row as { purchase_id?: string })?.purchase_id ?? "",
    purchaseNo: (row as { purchase_no?: string })?.purchase_no ?? "",
  };
}

export async function commitPurchaseUpdateLive(opts: {
  purchaseId: string;
  supplierId: string;
  purchaseDate: string;
  supplierInvoiceNo?: string | null;
  notes?: string | null;
  lines: { productId: string; receivedQty: number; rateExcl: number }[];
}): Promise<{ purchaseNo: string }> {
  const inv =
    opts.supplierInvoiceNo !== undefined && opts.supplierInvoiceNo !== null
      ? normalizeInvoiceNoSpoken(opts.supplierInvoiceNo) || null
      : null;
  const { data, error } = await supabase.rpc("update_purchase", {
    p_purchase_id: opts.purchaseId,
    p_supplier_id: opts.supplierId,
    p_purchase_date: opts.purchaseDate,
    p_lines: purchaseLinesToRpc(opts.lines),
    p_notes: opts.notes ?? null,
    ...(inv !== null ? { p_supplier_invoice_no: inv } : {}),
  });
  if (error) throw purchaseRpcError(error, { settingInvoice: inv !== null });
  const row = Array.isArray(data) ? data[0] : data;
  const purchaseNo = (row as { purchase_no?: string })?.purchase_no ?? "";
  void queryClient.invalidateQueries({ queryKey: DOMAIN_QUERY_KEY });
  return { purchaseNo };
}

export async function commitSupplierPaymentLive(opts: {
  supplierId: string;
  amount: number;
  paymentDate: string;
  mode: string;
  notes?: string | null;
}): Promise<void> {
  if (opts.amount <= 0) return;
  const { error } = await supabase.rpc("apply_supplier_payment", {
    p_payment_date: opts.paymentDate,
    p_supplier_id: opts.supplierId,
    p_amount: opts.amount,
    p_notes: opts.notes ?? null,
  });
  if (error) throw error;

  const tenantId = await tenantIdForCurrentUser();
  const { error: le } = await supabase.from("supplier_payments").insert({
    tenant_id: tenantId,
    payment_date: opts.paymentDate,
    supplier_id: opts.supplierId,
    amount: opts.amount,
    mode: mapUiPaymentModeToDb(opts.mode),
    notes: opts.notes ?? null,
  });
  if (le) throw le;

  void queryClient.invalidateQueries({ queryKey: DOMAIN_QUERY_KEY });
  void queryClient.invalidateQueries({ queryKey: ["daily-cash-breakdown"] });
}

export async function insertSupplierLive(p: {
  name: string;
  phone?: string;
  address?: string;
  payable_opening?: number;
}): Promise<string> {
  const tenantId = await tenantIdForCurrentUser();
  const { data, error } = await supabase
    .from("suppliers")
    .insert({
      tenant_id: tenantId,
      name: p.name.trim(),
      phone: p.phone?.trim() || null,
      address: p.address?.trim() || null,
      payable_opening: p.payable_opening ?? 0,
      is_active: true,
    })
    .select("id")
    .single();
  if (error) throw error;
  void queryClient.invalidateQueries({ queryKey: DOMAIN_QUERY_KEY });
  return data.id as string;
}

export async function upsertCustomerLive(p: {
  id?: string;
  name: string;
  phone?: string;
  area?: string;
  address?: string;
  route?: string;
  credit_limit: number;
  opening_balance?: number;
}): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data: tu, error: te } = await supabase
    .from("tenant_users")
    .select("tenant_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (te) throw te;
  const tenantId = tu?.tenant_id as string | undefined;
  if (!tenantId) throw new Error("No tenant for user");

  const row = {
    tenant_id: tenantId,
    name: p.name.trim(),
    phone: p.phone?.trim() || null,
    area: p.area?.trim() || null,
    address: p.address?.trim() || null,
    route: p.route?.trim() || null,
    credit_limit: p.credit_limit,
    opening_balance: p.opening_balance ?? 0,
    is_active: true,
  };

  if (p.id) {
    const { tenant_id: _t, ...updateRow } = row;
    const { error } = await supabase.from("customers").update(updateRow).eq("id", p.id);
    if (error) throw error;
    void queryClient.invalidateQueries({ queryKey: DOMAIN_QUERY_KEY });
    return p.id;
  }

  const { data, error } = await supabase.from("customers").insert(row).select("id").single();
  if (error) throw error;
  void queryClient.invalidateQueries({ queryKey: DOMAIN_QUERY_KEY });
  return data.id as string;
}

export async function upsertProductLive(p: {
  id?: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  purchase_price: number;
  sale_price: number;
  mrp: number;
  uom_prices?: Record<string, { mrp: number; sale_price: number }>;
  uom_conversion?: { pack_uom: string; factor: number } | null;
  discount_pct: number;
  vat_applicable: boolean;
  min_qty: number;
  min_qty_pack?: number | null;
}): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data: tu, error: te } = await supabase
    .from("tenant_users")
    .select("tenant_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (te) throw te;
  const tenantId = tu?.tenant_id as string | undefined;
  if (!tenantId) throw new Error("No tenant for user");

  const row = {
    tenant_id: tenantId,
    code: p.code,
    name: p.name,
    category: p.category,
    unit: p.unit,
    purchase_price: p.purchase_price,
    sale_price: p.sale_price,
    mrp: p.mrp,
    uom_prices: p.uom_prices ?? {},
    uom_conversion: p.uom_conversion ?? null,
    discount_pct: p.discount_pct,
    vat_applicable: p.vat_applicable,
    min_qty: p.min_qty,
    min_qty_pack: p.min_qty_pack ?? null,
    is_active: true,
  };
  if (p.id) {
    const { tenant_id: _t, ...updateRow } = row;
    const { error } = await supabase.from("products").update(updateRow).eq("id", p.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("products").insert(row);
    if (error) throw error;
  }
  void queryClient.invalidateQueries({ queryKey: DOMAIN_QUERY_KEY });
}

export async function recordExpenseLive(input: {
  category: string;
  amount: number;
  expenseDate?: string;
  paidBy?: string;
  notes?: string;
}): Promise<void> {
  const expenseDate = input.expenseDate ?? new Date().toISOString().slice(0, 10);
  const { error } = await supabase.rpc("record_expense", {
    p_expense_date: expenseDate,
    p_category: input.category,
    p_amount: input.amount,
    p_paid_by: input.paidBy ?? "Cash",
    p_notes: input.notes ?? null,
  });
  if (error) throw error;
  void queryClient.invalidateQueries({ queryKey: DOMAIN_QUERY_KEY });
  void queryClient.invalidateQueries({ queryKey: ["daily-cash-breakdown"] });
}

export async function recordDamageLive(input: {
  productId: string;
  qty: number;
  reason: string;
  cost?: number;
  notes?: string;
}): Promise<void> {
  const { error } = await supabase.rpc("record_damage", {
    p_damage_date: new Date().toISOString().slice(0, 10),
    p_product_id: input.productId,
    p_qty: input.qty,
    p_reason: input.reason,
    p_cost: input.cost ?? 0,
    p_notes: input.notes ?? null,
  });
  if (error) throw error;
  void queryClient.invalidateQueries({ queryKey: DOMAIN_QUERY_KEY });
}

const SCHEME_SELECT_FULL =
  "id, scheme_name, product_id, buy_qty, free_qty, buy_uom, free_uom, start_date, end_date, is_active";
const SCHEME_SELECT_LEGACY =
  "id, scheme_name, product_id, buy_qty, free_qty, start_date, end_date, is_active";

function mapSchemeRow(row: Record<string, unknown>): ProductScheme {
  return {
    id: row.id as string,
    schemeName: row.scheme_name as string,
    productId: (row.product_id as string) ?? "",
    buyQty: Number(row.buy_qty),
    freeQty: Number(row.free_qty),
    buyUom: (row.buy_uom as string | null) ?? null,
    freeUom: (row.free_uom as string | null) ?? null,
    startDate: String(row.start_date).slice(0, 10),
    endDate: String(row.end_date).slice(0, 10),
    isActive: Boolean(row.is_active),
  };
}

export async function fetchSchemesLive(): Promise<ProductScheme[]> {
  let data: Record<string, unknown>[] | null = null;
  let error: { message?: string } | null = null;
  const full = await supabase
    .from("scheme_tracker")
    .select(SCHEME_SELECT_FULL)
    .eq("is_active", true)
    .order("end_date", { ascending: false });
  data = full.data as Record<string, unknown>[] | null;
  error = full.error;
  if (error && isMissingColumnError(error, "buy_uom")) {
    const legacy = await supabase
      .from("scheme_tracker")
      .select(SCHEME_SELECT_LEGACY)
      .eq("is_active", true)
      .order("end_date", { ascending: false });
    data = legacy.data as Record<string, unknown>[] | null;
    error = legacy.error;
  }
  if (error) throw error;
  return (data ?? []).map(mapSchemeRow);
}

export async function insertSchemeLive(input: {
  schemeName: string;
  productId: string;
  buyQty: number;
  freeQty: number;
  buyUom?: string | null;
  freeUom?: string | null;
  startDate: string;
  endDate: string;
}): Promise<string> {
  const tenantId = await tenantIdForCurrentUser();
  const payload: Record<string, unknown> = {
    tenant_id: tenantId,
    scheme_name: input.schemeName.trim(),
    product_id: input.productId,
    buy_qty: input.buyQty,
    free_qty: input.freeQty,
    start_date: input.startDate,
    end_date: input.endDate,
    is_active: true,
  };
  if (input.buyUom?.trim()) payload.buy_uom = input.buyUom.trim();
  if (input.freeUom?.trim()) payload.free_uom = input.freeUom.trim();

  const { data, error } = await supabase
    .from("scheme_tracker")
    .insert(payload)
    .select("id")
    .single();
  if (error) throw error;
  void queryClient.invalidateQueries({ queryKey: DOMAIN_QUERY_KEY });
  return data.id as string;
}

type TenantSettingsRow = {
  name: string;
  legal_name: string | null;
  region: string | null;
  phone: string | null;
  mobile: string | null;
  email: string | null;
  address_line1: string | null;
  address_line2: string | null;
  district: string | null;
  province: string | null;
  country: string | null;
  pan_number: string | null;
  vat_registered: boolean | null;
  vat_number: string | null;
  default_vat_pct?: number | null;
  invoice_prefix: string | null;
  bill_footer: string | null;
  overdue_days: number | null;
  due_soon_days: number | null;
  default_markup_pct: number | null;
  default_min_qty: number | null;
  default_min_pack_qty: number | null;
};

export function mapTenantSettingsRow(row: TenantSettingsRow): BusinessSettings {
  const D = DEFAULT_BUSINESS_SETTINGS;
  return {
    name: row.name || D.name,
    legalName: row.legal_name ?? D.legalName,
    region: row.region ?? D.region,
    currency: D.currency,
    invoicePrefix: row.invoice_prefix?.trim() || D.invoicePrefix,
    phone: row.phone ?? D.phone,
    mobile: row.mobile ?? D.mobile,
    email: row.email ?? D.email,
    addressLine1: row.address_line1 ?? D.addressLine1,
    addressLine2: row.address_line2 ?? D.addressLine2,
    district: row.district ?? D.district,
    province: row.province ?? D.province,
    country: row.country ?? D.country,
    panNumber: row.pan_number ?? D.panNumber,
    vatRegistered: row.vat_registered ?? D.vatRegistered,
    vatNumber: row.vat_number ?? D.vatNumber,
    defaultVatPct: Number(row.default_vat_pct ?? D.defaultVatPct),
    billFooter: row.bill_footer ?? D.billFooter,
    overdueDays: row.overdue_days ?? D.overdueDays,
    dueSoonDays: row.due_soon_days ?? D.dueSoonDays,
    defaultMarkupPct: row.default_markup_pct ?? D.defaultMarkupPct,
    defaultMinQty: row.default_min_qty ?? D.defaultMinQty,
    defaultMinPackQty: row.default_min_pack_qty ?? D.defaultMinPackQty,
  };
}

export async function fetchTenantSettingsLive(): Promise<BusinessSettings> {
  const { data, error } = await supabase.from("tenant_settings").select("*").maybeSingle();
  if (error) throw error;
  if (!data) return { ...DEFAULT_BUSINESS_SETTINGS };
  return mapTenantSettingsRow(data as TenantSettingsRow);
}

export async function fetchPnlTotalsLive(): Promise<PnlTotals> {
  const [pu, ex, ret] = await Promise.all([
    supabase.from("purchases").select("total"),
    supabase.from("expenses").select("amount"),
    supabase.from("returns").select("credit_note_amount"),
  ]);
  if (pu.error) throw pu.error;
  if (ex.error) throw ex.error;
  if (ret.error) throw ret.error;
  return {
    lifetimePurchases: (pu.data ?? []).reduce((s, r) => s + Number((r as { total: number }).total), 0),
    lifetimeExpenses: (ex.data ?? []).reduce((s, r) => s + Number((r as { amount: number }).amount), 0),
    lifetimeReturnsCredit: (ret.data ?? []).reduce(
      (s, r) => s + Number((r as { credit_note_amount: number }).credit_note_amount),
      0,
    ),
  };
}

export async function fetchLatestDailyCashClosingLive(): Promise<number> {
  const { data, error } = await supabase
    .from("daily_cash")
    .select("closing_balance")
    .order("cash_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? Number((data as { closing_balance: number }).closing_balance) : 0;
}

/** Cash worksheet lines for a single day (opening from last locked close before that date). */
export async function fetchDailyCashBreakdownLive(cashDate: string): Promise<DailyCashBreakdown> {
  const { data: openRow, error: oe } = await supabase
    .from("daily_cash")
    .select("closing_balance")
    .lt("cash_date", cashDate)
    .order("cash_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (oe) throw oe;
  const openingBalance = openRow ? Number((openRow as { closing_balance: number }).closing_balance) : 0;

  const { data: billRows, error: be } = await supabase.from("sales_bills").select("id").eq("bill_date", cashDate);
  if (be) throw be;
  const billIdsToday = new Set((billRows ?? []).map((b) => (b as { id: string }).id));

  const { data: payRows, error: pe } = await supabase
    .from("payments")
    .select("amount, bill_id")
    .eq("payment_date", cashDate)
    .eq("mode", "Cash");
  if (pe) throw pe;

  let cashSalesToday = 0;
  let cashReceiptsToday = 0;
  for (const raw of payRows ?? []) {
    const p = raw as { amount: number; bill_id: string | null };
    const amt = Number(p.amount);
    if (!p.bill_id) {
      cashReceiptsToday += amt;
      continue;
    }
    if (billIdsToday.has(p.bill_id)) cashSalesToday += amt;
    else cashReceiptsToday += amt;
  }

  const { data: exRows, error: ee } = await supabase.from("expenses").select("amount, paid_by").eq("expense_date", cashDate);
  if (ee) throw ee;
  const expensesCash = (exRows ?? []).reduce((s, r) => {
    const paidBy = String((r as { paid_by: string | null }).paid_by ?? "").toLowerCase();
    if (!paidBy || paidBy === "cash") return s + Number((r as { amount: number }).amount);
    return s;
  }, 0);

  const { data: supRows, error: se } = await supabase
    .from("supplier_payments")
    .select("amount")
    .eq("payment_date", cashDate)
    .eq("mode", "Cash");
  if (se) throw se;
  const supplierPaymentsCash = (supRows ?? []).reduce((s, r) => s + Number((r as { amount: number }).amount), 0);

  return {
    openingBalance,
    cashSalesToday,
    cashReceiptsToday,
    expensesCash,
    supplierPaymentsCash,
  };
}

export async function upsertDailyCashLive(p: {
  cashDate: string;
  openingBalance: number;
  closingBalance: number;
  notes?: string | null;
}): Promise<void> {
  const tenantId = await tenantIdForCurrentUser();
  const { error } = await supabase.from("daily_cash").upsert(
    {
      tenant_id: tenantId,
      cash_date: p.cashDate,
      opening_balance: p.openingBalance,
      closing_balance: p.closingBalance,
      notes: p.notes ?? null,
    },
    { onConflict: "tenant_id,cash_date" },
  );
  if (error) throw error;
  void queryClient.invalidateQueries({ queryKey: DOMAIN_QUERY_KEY });
  void queryClient.invalidateQueries({ queryKey: ["daily-cash-breakdown"] });
}

export async function fetchExpensesListLive(): Promise<ExpenseListItem[]> {
  const { data, error } = await supabase
    .from("expenses")
    .select("id, expense_date, category, amount, notes")
    .order("expense_date", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: (r as { id: string }).id,
    date: (r as { expense_date: string }).expense_date,
    category: (r as { category: string }).category,
    amount: Number((r as { amount: number }).amount),
    notes: ((r as { notes: string | null }).notes as string) ?? "",
  }));
}

function mapPurchaseListRow(raw: unknown): PurchaseListItem {
  const r = raw as {
    id: string;
    purchase_no: string;
    supplier_invoice_no: string | null;
    purchase_date: string;
    total: number;
    supplier_id: string;
    paid: number;
    payment_status: string;
    suppliers?: { name: string } | { name: string }[] | null;
  };
  const sup = Array.isArray(r.suppliers) ? r.suppliers[0] : r.suppliers;
  const status = r.payment_status;
  const paymentStatus: PurchaseListItem["paymentStatus"] =
    status === "paid" || status === "partial" ? status : "unpaid";
  return {
    id: r.id,
    purchaseNo: r.purchase_no,
    supplierInvoiceNo: r.supplier_invoice_no?.trim() ?? "",
    date: r.purchase_date,
    total: Number(r.total),
    supplierId: r.supplier_id,
    supplierName: sup?.name ?? "",
    paid: Number(r.paid) || 0,
    paymentStatus,
  };
}

const PURCHASE_LIST_SELECT =
  "id, purchase_no, supplier_invoice_no, purchase_date, total, supplier_id, paid, payment_status, suppliers(name)";
const PURCHASE_LIST_SELECT_LEGACY =
  "id, purchase_no, purchase_date, total, supplier_id, paid, payment_status, suppliers(name)";

function purchaseSelectWithoutInvoiceCol(select: string): string {
  return select
    .replace("supplier_invoice_no, ", "")
    .replace(", supplier_invoice_no", "");
}

export async function fetchPurchasesListLive(): Promise<PurchaseListItem[]> {
  let data: unknown[] | null = null;
  let error: { message?: string } | null = null;
  const full = await supabase
    .from("purchases")
    .select(PURCHASE_LIST_SELECT)
    .order("purchase_date", { ascending: false })
    .limit(200);
  data = full.data;
  error = full.error;
  if (error && isMissingColumnError(error, "supplier_invoice_no")) {
    const legacy = await supabase
      .from("purchases")
      .select(PURCHASE_LIST_SELECT_LEGACY)
      .order("purchase_date", { ascending: false })
      .limit(200);
    data = legacy.data;
    error = legacy.error;
  }
  if (error) throw error;
  return (data ?? []).map(mapPurchaseListRow);
}

export async function fetchPurchaseDetailLive(purchaseId: string): Promise<PurchaseDetail | null> {
  const detailSelect =
    `${PURCHASE_LIST_SELECT}, subtotal, subtotal_excl, vat_amount, notes`;
  let header: unknown = null;
  let error: { message?: string } | null = null;
  const full = await supabase
    .from("purchases")
    .select(detailSelect)
    .eq("id", purchaseId)
    .maybeSingle();
  header = full.data;
  error = full.error;
  if (
    error &&
    (isMissingColumnError(error, "supplier_invoice_no") ||
      isMissingColumnError(error, "subtotal_excl") ||
      isMissingColumnError(error, "vat_amount"))
  ) {
    let legacySel = purchaseSelectWithoutInvoiceCol(detailSelect);
    legacySel = legacySel.replace(", subtotal_excl, vat_amount", "").replace("subtotal_excl, vat_amount, ", "");
    const legacy = await supabase
      .from("purchases")
      .select(legacySel)
      .eq("id", purchaseId)
      .maybeSingle();
    header = legacy.data;
    error = legacy.error;
  }
  if (error) throw error;
  if (!header) return null;

  let itemRows: unknown[] | null = null;
  let itemErr: { message?: string } | null = null;
  const itemsFull = await supabase
    .from("purchase_items")
    .select("product_id, qty, rate, rate_excl, total, products(name, unit)")
    .eq("purchase_id", purchaseId);
  itemRows = itemsFull.data;
  itemErr = itemsFull.error;
  if (itemErr && isMissingColumnError(itemErr, "rate_excl")) {
    const itemsLegacy = await supabase
      .from("purchase_items")
      .select("product_id, qty, rate, total, products(name, unit)")
      .eq("purchase_id", purchaseId);
    itemRows = itemsLegacy.data;
    itemErr = itemsLegacy.error;
  }
  if (itemErr) throw itemErr;

  const base = mapPurchaseListRow(header);
  const h = header as {
    subtotal: number;
    subtotal_excl?: number | null;
    vat_amount?: number | null;
    notes: string | null;
  };

  const lines = (itemRows ?? []).map((raw) => {
    const row = raw as {
      product_id: string;
      qty: number;
      rate: number;
      rate_excl?: number | null;
      total: number;
      products?: { name: string; unit?: string } | { name: string; unit?: string }[] | null;
    };
    const prod = Array.isArray(row.products) ? row.products[0] : row.products;
    const qty = Number(row.qty);
    const rateIncl = Number(row.rate);
    const rateExcl =
      row.rate_excl != null ? Number(row.rate_excl) : rateIncl;
    const amount = Number(row.total);
    const vatAmount = Math.max(0, roundMoney(amount - qty * rateExcl));
    return {
      productId: row.product_id,
      productName: prod?.name ?? "Product",
      qty,
      uom: prod?.unit?.trim() || "PCS",
      rateExcl,
      rateIncl,
      vatAmount,
      amount,
    };
  });

  const subtotalExcl =
    h.subtotal_excl != null
      ? Number(h.subtotal_excl)
      : lines.reduce((s, l) => s + l.qty * l.rateExcl, 0);
  const vatAmount =
    h.vat_amount != null
      ? Number(h.vat_amount)
      : lines.reduce((s, l) => s + l.vatAmount, 0);

  return {
    ...base,
    subtotalExcl,
    vatAmount,
    subtotal: Number(h.subtotal) || subtotalExcl + vatAmount,
    notes: h.notes?.trim() ?? "",
    lines,
  };
}

/** KPIs for dashboard selected period (exclusive end semantics: use inclusive dates in SQL). */
export async function fetchDashboardPeriodTotalsLive(from: string, to: string): Promise<DashboardPeriodTotals> {
  const [pex, eex, rex, dmx] = await Promise.all([
    supabase.from("purchases").select("total").gte("purchase_date", from).lte("purchase_date", to),
    supabase.from("expenses").select("amount").gte("expense_date", from).lte("expense_date", to),
    supabase.from("returns").select("credit_note_amount").gte("return_date", from).lte("return_date", to),
    supabase.from("damages").select("qty").gte("damage_date", from).lte("damage_date", to),
  ]);
  if (pex.error) throw pex.error;
  if (eex.error) throw eex.error;
  if (rex.error) throw rex.error;
  if (dmx.error) throw dmx.error;
  return {
    totalPurchase: (pex.data ?? []).reduce((s, r) => s + Number((r as { total: number }).total), 0),
    totalExpenses: (eex.data ?? []).reduce((s, r) => s + Number((r as { amount: number }).amount), 0),
    returnsCredit: (rex.data ?? []).reduce(
      (s, r) => s + Number((r as { credit_note_amount: number }).credit_note_amount),
      0,
    ),
    damageQty: (dmx.data ?? []).reduce((s, r) => s + Number((r as { qty: number }).qty), 0),
  };
}

export async function fetchDomainBundle(): Promise<DomainBundle> {
  const [
    products,
    customers,
    suppliers,
    sales,
    payments,
    schemes,
    business,
    pnl,
    latestCashClosing,
    expenses,
    purchases,
  ] = await Promise.all([
    fetchProductsLive(),
    fetchCustomersLive(),
    fetchSuppliersLive(),
    fetchSalesLive(),
    fetchPaymentsLive(),
    fetchSchemesLive(),
    fetchTenantSettingsLive(),
    fetchPnlTotalsLive(),
    fetchLatestDailyCashClosingLive(),
    fetchExpensesListLive(),
    fetchPurchasesListLive(),
  ]);
  return {
    products,
    customers,
    suppliers,
    sales,
    payments,
    schemes,
    business,
    pnl,
    latestCashClosing,
    expenses,
    purchases,
  };
}

export async function fetchCapitalEntriesLive(): Promise<CapitalEntry[]> {
  const { data: rows, error } = await supabase
    .from("capital_entries")
    .select("id, name, category, entry_date, amount, current_value, notes")
    .is("deleted_at", null)
    .order("entry_date", { ascending: false });
  if (error) throw error;

  return (rows ?? []).map((r) => ({
    id: r.id as string,
    date: r.entry_date as string,
    category: r.category as CapitalEntry["category"],
    name: r.name as string,
    amount: Number(r.amount),
    currentValue: Number(r.current_value),
    notes: (r.notes as string) ?? "",
  }));
}

export async function insertCapitalEntryLive(p: {
  name: string;
  category: CapitalEntry["category"];
  entry_date: string;
  amount: number;
  current_value: number;
  notes?: string;
}): Promise<string> {
  const tenantId = await tenantIdForCurrentUser();
  const { data, error } = await supabase
    .from("capital_entries")
    .insert({
      tenant_id: tenantId,
      name: p.name.trim(),
      category: p.category,
      entry_date: p.entry_date,
      amount: p.amount,
      current_value: p.current_value,
      notes: p.notes?.trim() ?? "",
    })
    .select("id")
    .single();
  if (error) throw error;
  void queryClient.invalidateQueries({ queryKey: CAPITAL_QUERY_KEY });
  return data.id as string;
}
