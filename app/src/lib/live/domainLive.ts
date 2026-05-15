/**
 * Supabase reads/writes for Phase 1 (when VITE_SUPABASE_* is set).
 * Maps DB rows ↔ dummy.ts shapes so UI components stay unchanged.
 */
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";
import {
  BUSINESS,
  type BusinessSettings,
  type CapitalEntry,
  type Customer,
  OutstandingBill,
  Payment,
  Product,
  Sale,
  SaleLine,
  Supplier,
  BillStatus,
} from "@/data/dummy";

export const DOMAIN_QUERY_KEY = ["domain", "v1"] as const;
export const CAPITAL_QUERY_KEY = ["capital", "v1"] as const;

function billStatus(total: number, paid: number): BillStatus {
  const bal = Math.max(0, total - paid);
  if (bal <= 0) return "paid";
  if (paid > 0) return "partial";
  return "current";
}

export async function fetchProductsLive(): Promise<Product[]> {
  const { data: rows, error } = await supabase
    .from("products")
    .select(
      "id, code, name, category, unit, purchase_price, sale_price, opening_stock, mrp, discount_pct, vat_applicable, min_qty, is_active",
    )
    .eq("is_active", true)
    .order("name");
  if (error) throw error;

  const { data: stockRows, error: se } = await supabase.from("v_stock").select("product_id, closing_stock");
  if (se) throw se;
  const stockMap = new Map<string, number>();
  for (const s of stockRows ?? []) stockMap.set(s.product_id as string, Number(s.closing_stock));

  return (rows ?? []).map((r) => ({
    id: r.id as string,
    name: r.name as string,
    category: (r.category as string) ?? "",
    uom: (r.unit as string) ?? "PCS",
    mrp: Number(r.mrp ?? 0),
    costPrice: Number(r.purchase_price),
    sellingPrice: Number(r.sale_price),
    discountPct: Number(r.discount_pct ?? 0),
    vatApplicable: Boolean(r.vat_applicable),
    onHand: stockMap.get(r.id as string) ?? Number(r.opening_stock),
    minQty: Number(r.min_qty ?? 20),
    description: undefined,
  }));
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
  products?: { name: string; unit: string } | { name: string; unit: string }[] | null;
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
    const { data: items, error: ie } = await supabase
      .from("sales_items")
      .select("bill_id, product_id, qty, rate, products(name, unit)")
      .in("bill_id", billIds);
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
    const vatRate = vatAmt > 0 ? 13 : 0;
    const lines: SaleLine[] = items.map((it) => {
      const prod = embedOne(it.products as { name: string; unit: string } | { name: string; unit: string }[] | null | undefined);
      return {
        productId: it.product_id,
        productName: prod?.name ?? "",
        uom: prod?.unit ?? "PCS",
        qty: Number(it.qty),
        rate: Number(it.rate),
        discountPct: 0,
        amount: Number(it.qty) * Number(it.rate),
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
      discountType: disc > 0 ? "flat" : "none",
      discountValue: disc,
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
  const items = sale.lines.map((l) => ({
    product_id: l.productId,
    qty: l.qty,
    rate: l.rate,
  }));

  const payMode =
    sale.balance <= 0 && sale.paidNow >= sale.grandTotal
      ? sale.paymentMode || "Cash"
      : sale.paidNow > 0
        ? sale.paymentMode || "Cash"
        : "Credit";

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
  void queryClient.invalidateQueries({ queryKey: DOMAIN_QUERY_KEY });
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
  void queryClient.invalidateQueries({ queryKey: DOMAIN_QUERY_KEY });
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

export async function commitPurchaseLive(opts: {
  supplierId: string;
  lines: { productId: string; receivedQty: number; cost: number }[];
  totalReceived: number;
}): Promise<void> {
  const lines = opts.lines
    .filter((l) => l.receivedQty > 0)
    .map((l) => ({
      product_id: l.productId,
      qty: l.receivedQty,
      rate: l.cost,
    }));

  const { error } = await supabase.rpc("record_purchase", {
    p_purchase_date: new Date().toISOString().slice(0, 10),
    p_supplier_id: opts.supplierId,
    p_lines: lines,
    p_notes: null,
  });
  if (error) throw error;
  void queryClient.invalidateQueries({ queryKey: DOMAIN_QUERY_KEY });
}

export async function commitSupplierPaymentLive(opts: { supplierId: string; amount: number }): Promise<void> {
  const { error } = await supabase.rpc("apply_supplier_payment", {
    p_payment_date: new Date().toISOString().slice(0, 10),
    p_supplier_id: opts.supplierId,
    p_amount: opts.amount,
    p_notes: null,
  });
  if (error) throw error;
  void queryClient.invalidateQueries({ queryKey: DOMAIN_QUERY_KEY });
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
  discount_pct: number;
  vat_applicable: boolean;
  min_qty: number;
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
    discount_pct: p.discount_pct,
    vat_applicable: p.vat_applicable,
    min_qty: p.min_qty,
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
  paidBy?: string;
  notes?: string;
}): Promise<void> {
  const { error } = await supabase.rpc("record_expense", {
    p_expense_date: new Date().toISOString().slice(0, 10),
    p_category: input.category,
    p_amount: input.amount,
    p_paid_by: input.paidBy ?? null,
    p_notes: input.notes ?? null,
  });
  if (error) throw error;
  void queryClient.invalidateQueries({ queryKey: DOMAIN_QUERY_KEY });
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
  invoice_prefix: string | null;
  bill_footer: string | null;
  overdue_days: number | null;
  due_soon_days: number | null;
  default_markup_pct: number | null;
  default_min_qty: number | null;
};

export function mapTenantSettingsRow(row: TenantSettingsRow): BusinessSettings {
  return {
    name: row.name || BUSINESS.name,
    legalName: row.legal_name ?? BUSINESS.legalName,
    region: row.region ?? BUSINESS.region,
    currency: BUSINESS.currency,
    invoicePrefix: row.invoice_prefix?.trim() || BUSINESS.invoicePrefix,
    phone: row.phone ?? BUSINESS.phone,
    mobile: row.mobile ?? BUSINESS.mobile,
    email: row.email ?? BUSINESS.email,
    addressLine1: row.address_line1 ?? BUSINESS.addressLine1,
    addressLine2: row.address_line2 ?? BUSINESS.addressLine2,
    district: row.district ?? BUSINESS.district,
    province: row.province ?? BUSINESS.province,
    country: row.country ?? BUSINESS.country,
    panNumber: row.pan_number ?? BUSINESS.panNumber,
    vatRegistered: row.vat_registered ?? BUSINESS.vatRegistered,
    vatNumber: row.vat_number ?? BUSINESS.vatNumber,
    billFooter: row.bill_footer ?? BUSINESS.billFooter,
    overdueDays: row.overdue_days ?? BUSINESS.overdueDays,
    dueSoonDays: row.due_soon_days ?? BUSINESS.dueSoonDays,
    defaultMarkupPct: row.default_markup_pct ?? BUSINESS.defaultMarkupPct,
    defaultMinQty: row.default_min_qty ?? BUSINESS.defaultMinQty,
  };
}

export async function fetchTenantSettingsLive(): Promise<BusinessSettings> {
  const { data, error } = await supabase.from("tenant_settings").select("*").maybeSingle();
  if (error) throw error;
  if (!data) return { ...BUSINESS };
  return mapTenantSettingsRow(data as TenantSettingsRow);
}

export async function fetchDomainBundle() {
  const [products, customers, suppliers, sales, payments, business] = await Promise.all([
    fetchProductsLive(),
    fetchCustomersLive(),
    fetchSuppliersLive(),
    fetchSalesLive(),
    fetchPaymentsLive(),
    fetchTenantSettingsLive(),
  ]);
  return { products, customers, suppliers, sales, payments, business };
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
