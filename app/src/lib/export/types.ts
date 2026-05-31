export type ExportDateRange = {
  from: string;
  to: string;
};

export type ExportKind =
  | "products"
  | "customers"
  | "stock_snapshot"
  | "sales_register"
  | "sales_lines"
  | "purchases_register"
  | "customer_outstanding"
  | "vat_period_summary"
  | "full_backup";

export const EXPORT_ROW_CAP = 50_000;

export type CsvRow = Record<string, string | number | null | undefined>;
