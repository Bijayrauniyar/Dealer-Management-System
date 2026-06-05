import type { CsvRow } from "./types";

export const PRODUCT_COLUMNS = [
  "product_id",
  "code",
  "name",
  "category",
  "unit",
  "purchase_price",
  "sale_price",
  "mrp",
  "opening_stock",
  "on_hand",
  "hsn_code",
  "active",
] as const;

export const CUSTOMER_COLUMNS = [
  "customer_id",
  "name",
  "phone",
  "area",
  "address",
  "credit_limit",
  "outstanding",
] as const;

export const STOCK_COLUMNS = [
  "product_id",
  "code",
  "name",
  "unit",
  "opening_stock",
  "purchased",
  "adjusted",
  "sold",
  "damaged",
  "returned",
  "closing_stock",
  "exported_at",
] as const;

export const SALES_REGISTER_COLUMNS = [
  "bill_no",
  "bill_date",
  "customer_name",
  "payment_mode",
  "subtotal",
  "discount",
  "vat_amount",
  "extra_charges",
  "total",
  "paid",
  "balance",
] as const;

export const SALES_LINES_COLUMNS = [
  "bill_no",
  "bill_date",
  "product_code",
  "product_name",
  "qty",
  "unit",
  "rate",
  "line_total",
] as const;

export const PURCHASE_REGISTER_COLUMNS = [
  "purchase_date",
  "supplier_name",
  "supplier_invoice_no",
  "subtotal_excl",
  "vat_amount",
  "total",
  "paid",
  "balance",
] as const;

export const OUTSTANDING_COLUMNS = ["customer_id", "name", "phone", "area", "outstanding"] as const;

export const VAT_SUMMARY_COLUMNS = [
  "period_from",
  "period_to",
  "output_vat",
  "input_vat",
  "net_vat_payable",
] as const;

export const EXPENSES_REGISTER_COLUMNS = [
  "expense_date",
  "category",
  "amount",
  "paid_by",
  "notes",
] as const;

export const DAMAGES_REGISTER_COLUMNS = [
  "damage_date",
  "product_code",
  "product_name",
  "qty",
  "reason",
  "cost",
  "notes",
] as const;

export const RETURNS_REGISTER_COLUMNS = [
  "return_date",
  "customer_name",
  "product_code",
  "product_name",
  "qty",
  "reason",
  "credit_note_amount",
  "notes",
] as const;

export function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function plainRow(row: CsvRow): CsvRow {
  const out: CsvRow = {};
  for (const [k, v] of Object.entries(row)) {
    if (typeof v === "number") out[k] = Math.round(v * 100) / 100;
    else out[k] = v ?? "";
  }
  return out;
}
