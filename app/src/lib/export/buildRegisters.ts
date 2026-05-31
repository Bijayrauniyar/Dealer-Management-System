import { supabase } from "@/lib/supabase";
import {
  CUSTOMER_COLUMNS,
  OUTSTANDING_COLUMNS,
  PRODUCT_COLUMNS,
  PURCHASE_REGISTER_COLUMNS,
  SALES_LINES_COLUMNS,
  SALES_REGISTER_COLUMNS,
  STOCK_COLUMNS,
  VAT_SUMMARY_COLUMNS,
  num,
  plainRow,
} from "./columns";
import { fetchAllPages, type RangedQuery } from "./fetchPaginated";
import type { CsvRow, ExportDateRange } from "./types";
import { EXPORT_ROW_CAP } from "./types";

function assertCap(rows: unknown[], label: string): void {
  if (rows.length > EXPORT_ROW_CAP) {
    throw new Error(
      `${label} has ${rows.length} rows (limit ${EXPORT_ROW_CAP}). Narrow the date range or contact support.`,
    );
  }
}

export async function buildProductsExport(includeCost: boolean): Promise<CsvRow[]> {
  const rows = await fetchAllPages<Record<string, unknown>>(
    () =>
      supabase
        .from("products")
        .select(
          "id, code, name, category, unit, purchase_price, sale_price, mrp, opening_stock, is_active",
        )
        .eq("is_active", true)
        .order("name") as unknown as RangedQuery,
  );
  const stockRows = await fetchAllPages<Record<string, unknown>>(
    () => supabase.from("v_stock").select("product_id, closing_stock") as unknown as RangedQuery,
  );
  const stockMap = new Map(stockRows.map((s) => [s.product_id as string, num(s.closing_stock)]));
  return rows.map((r) => {
    const id = r.id as string;
    return plainRow({
      product_id: id,
      code: String(r.code ?? ""),
      name: String(r.name ?? ""),
      category: String(r.category ?? ""),
      unit: String(r.unit ?? ""),
      purchase_price: includeCost ? num(r.purchase_price) : "",
      sale_price: num(r.sale_price),
      mrp: num(r.mrp),
      opening_stock: num(r.opening_stock),
      on_hand: stockMap.get(id) ?? num(r.opening_stock),
      active: r.is_active ? "yes" : "no",
    });
  });
}

export async function buildCustomersExport(): Promise<CsvRow[]> {
  const rows = await fetchAllPages<Record<string, unknown>>(
    () =>
      supabase
        .from("customers")
        .select("id, name, phone, area, address, credit_limit")
        .eq("is_active", true)
        .order("name") as unknown as RangedQuery,
  );
  const bal = await fetchAllPages<Record<string, unknown>>(
    () => supabase.from("v_customer_balance").select("customer_id, balance") as unknown as RangedQuery,
  );
  const balMap = new Map(bal.map((b) => [b.customer_id as string, num(b.balance)]));
  return rows.map((r) => {
    const id = r.id as string;
    return plainRow({
      customer_id: id,
      name: String(r.name ?? ""),
      phone: String(r.phone ?? ""),
      area: String(r.area ?? ""),
      address: String(r.address ?? ""),
      credit_limit: num(r.credit_limit),
      outstanding: balMap.get(id) ?? 0,
    });
  });
}

export async function buildStockSnapshotExport(): Promise<CsvRow[]> {
  const exportedAt = new Date().toISOString();
  const rows = await fetchAllPages<Record<string, unknown>>(() =>
    supabase
      .from("v_stock")
      .select(
        "product_id, code, name, unit, opening_stock, purchased, adjusted, sold, damaged, returned, closing_stock",
      )
      .order("name") as unknown as RangedQuery,
  );
  return rows.map((r) =>
    plainRow({
      product_id: String(r.product_id ?? ""),
      code: String(r.code ?? ""),
      name: String(r.name ?? ""),
      unit: String(r.unit ?? ""),
      opening_stock: num(r.opening_stock),
      purchased: num(r.purchased),
      adjusted: num((r as { adjusted?: number }).adjusted ?? 0),
      sold: num(r.sold),
      damaged: num(r.damaged),
      returned: num(r.returned),
      closing_stock: num(r.closing_stock),
      exported_at: exportedAt,
    }),
  );
}

export async function buildSalesRegisterExport(range: ExportDateRange): Promise<CsvRow[]> {
  const rows = await fetchAllPages<Record<string, unknown>>(() =>
    supabase
      .from("sales_bills")
      .select(
        "bill_no, bill_date, payment_mode, subtotal, discount, vat_amount, extra_charges, total, paid, customers(name)",
      )
      .gte("bill_date", range.from)
      .lte("bill_date", range.to)
      .order("bill_date") as unknown as RangedQuery,
  );
  assertCap(rows, "Sales register");
  return rows.map((r) => {
    const total = num(r.total);
    const paid = num(r.paid);
    const cust = r.customers as { name?: string } | { name?: string }[] | null;
    const customerName = Array.isArray(cust) ? cust[0]?.name : cust?.name;
    return plainRow({
      bill_no: String(r.bill_no ?? ""),
      bill_date: String(r.bill_date ?? ""),
      customer_name: customerName ?? "",
      payment_mode: String(r.payment_mode ?? ""),
      subtotal: num(r.subtotal),
      discount: num(r.discount),
      vat_amount: num(r.vat_amount),
      extra_charges: num(r.extra_charges),
      total,
      paid,
      balance: Math.max(0, total - paid),
    });
  });
}

export async function buildSalesLinesExport(range: ExportDateRange): Promise<CsvRow[]> {
  const bills = await fetchAllPages<{ id: string; bill_no: string; bill_date: string }>(() =>
    supabase
      .from("sales_bills")
      .select("id, bill_no, bill_date")
      .gte("bill_date", range.from)
      .lte("bill_date", range.to) as unknown as RangedQuery,
  );
  const billMap = new Map(bills.map((b) => [b.id, b]));
  const billIds = bills.map((b) => b.id);
  if (!billIds.length) return [];

  const lines: CsvRow[] = [];
  const chunk = 200;
  for (let i = 0; i < billIds.length; i += chunk) {
    const slice = billIds.slice(i, i + chunk);
    const { data, error } = await supabase
      .from("sales_items")
      .select("bill_id, qty, rate, unit, products(code, name)")
      .in("bill_id", slice);
    if (error) throw error;
    for (const it of data ?? []) {
      const bill = billMap.get(it.bill_id as string);
      const prod = it.products as { code?: string; name?: string } | null;
      const qty = num(it.qty);
      const rate = num(it.rate);
      lines.push(
        plainRow({
          bill_no: bill?.bill_no ?? "",
          bill_date: bill?.bill_date ?? "",
          product_code: prod?.code ?? "",
          product_name: prod?.name ?? "",
          qty,
          unit: it.unit ?? "",
          rate,
          line_total: qty * rate,
        }),
      );
    }
  }
  assertCap(lines, "Sales lines");
  return lines;
}

export async function buildPurchasesRegisterExport(range: ExportDateRange): Promise<CsvRow[]> {
  const rows = await fetchAllPages<Record<string, unknown>>(() =>
    supabase
      .from("purchases")
      .select(
        "purchase_date, subtotal_excl, vat_amount, total, paid, supplier_invoice_no, suppliers(name)",
      )
      .gte("purchase_date", range.from)
      .lte("purchase_date", range.to)
      .order("purchase_date") as unknown as RangedQuery,
  );
  assertCap(rows, "Purchase register");
  return rows.map((r) => {
    const total = num(r.total);
    const paid = num(r.paid);
    const sup = r.suppliers as { name?: string } | { name?: string }[] | null;
    const supplierName = Array.isArray(sup) ? sup[0]?.name : sup?.name;
    return plainRow({
      purchase_date: String(r.purchase_date ?? ""),
      supplier_name: supplierName ?? "",
      supplier_invoice_no: String(r.supplier_invoice_no ?? ""),
      subtotal_excl: num(r.subtotal_excl),
      vat_amount: num(r.vat_amount),
      total,
      paid,
      balance: Math.max(0, total - paid),
    });
  });
}

export async function buildOutstandingExport(): Promise<CsvRow[]> {
  const rows = await fetchAllPages<Record<string, unknown>>(() =>
    supabase
      .from("v_customer_balance")
      .select("customer_id, balance, customers(id, name, phone, area)")
      .gt("balance", 0) as unknown as RangedQuery,
  );
  return rows.map((r) => {
    const c = r.customers as { id?: string; name?: string; phone?: string; area?: string } | null;
    return plainRow({
      customer_id: String(c?.id ?? r.customer_id ?? ""),
      name: String(c?.name ?? ""),
      phone: String(c?.phone ?? ""),
      area: String(c?.area ?? ""),
      outstanding: num(r.balance),
    });
  });
}

export async function buildVatPeriodSummaryExport(range: ExportDateRange): Promise<CsvRow[]> {
  const sales = await fetchAllPages<{ vat_amount: number }>(() =>
    supabase
      .from("sales_bills")
      .select("vat_amount")
      .gte("bill_date", range.from)
      .lte("bill_date", range.to) as unknown as RangedQuery,
  );
  const purchases = await fetchAllPages<{ vat_amount: number }>(
    () =>
      supabase
        .from("purchases")
        .select("vat_amount")
        .gte("purchase_date", range.from)
        .lte("purchase_date", range.to) as unknown as RangedQuery,
  );
  const outputVat = sales.reduce((s, r) => s + num(r.vat_amount), 0);
  const inputVat = purchases.reduce((s, r) => s + num(r.vat_amount), 0);
  return [
    plainRow({
      period_from: range.from,
      period_to: range.to,
      output_vat: outputVat,
      input_vat: inputVat,
      net_vat_payable: outputVat - inputVat,
    }),
  ];
}

export {
  PRODUCT_COLUMNS,
  CUSTOMER_COLUMNS,
  STOCK_COLUMNS,
  SALES_REGISTER_COLUMNS,
  SALES_LINES_COLUMNS,
  PURCHASE_REGISTER_COLUMNS,
  OUTSTANDING_COLUMNS,
  VAT_SUMMARY_COLUMNS,
};
