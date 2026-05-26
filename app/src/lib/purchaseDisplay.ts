import { fmtDate } from "@/lib/utils";

type PurchaseLabel = {
  supplierInvoiceNo?: string;
  date: string;
  supplierName?: string;
};

/** User-facing purchase title — supplier invoice only (PO stays internal). */
export function purchaseDisplayTitle(p: PurchaseLabel): string {
  const inv = p.supplierInvoiceNo?.trim();
  if (inv) return inv;
  if (p.supplierName?.trim()) return p.supplierName.trim();
  return fmtDate(p.date);
}

/** Secondary line under title in lists / detail. */
export function purchaseDisplaySubtitle(p: PurchaseLabel): string {
  const inv = p.supplierInvoiceNo?.trim();
  const date = fmtDate(p.date);
  const name = p.supplierName?.trim() ?? "";
  if (inv) return name ? `${date} · ${name}` : date;
  return date;
}
