import type { BusinessSettings, Sale, SaleLine } from "@/domain/types";
import { DEFAULT_VAT_PCT, getVatPct } from "@/lib/tax";
import { fmtDate } from "@/lib/utils";
import { buildSellerContactLine, formatSellerAddressSegments } from "./sellerAddressLine";

/** @deprecated Use getVatPct(settings) */
export const BILL_VAT_RATE = DEFAULT_VAT_PCT;

export { getVatPct };

/** Whether bills for this shop add VAT at footer (tenant Settings — not per product). */
export function tenantChargesVat(
  b: Pick<BusinessSettings, "vatRegistered" | "vatNumber">,
): boolean {
  return Boolean(b.vatRegistered && b.vatNumber.trim());
}

/** Center title on printed bill (same for PAN and VAT shops; tax id is shown top-right). */
export function billDocumentTitle(): string {
  return "Sales details";
}

/** Uppercase title for bill header (screen + PDF). */
export function billDocumentTitleDisplay(): string {
  return billDocumentTitle().toUpperCase();
}

/**
 * How payment was made at billing (not the same as “fully paid”).
 * Credit bill with balance must not show “Cash”.
 */
export function billPaymentModeDisplay(
  sale: Pick<Sale, "paymentMode" | "balance" | "paidNow">,
): string {
  const balance = Number(sale.balance) || 0;
  const paid = Number(sale.paidNow) || 0;
  const mode = sale.paymentMode?.trim();

  if (balance <= 0) return paid > 0 ? mode || "Cash" : "Paid";
  if (paid <= 0) return "Credit";
  return mode ? `Partial (${mode})` : "Partial";
}

/** Balance / due date in bill meta — one “Due” only (not duplicated with a badge). */
export function billPaymentStatusLabel(
  sale: Pick<Sale, "balance" | "dueDate">,
): string | null {
  if (sale.balance <= 0) return "Paid";
  if (sale.dueDate) return `Due ${fmtDate(sale.dueDate)}`;
  return "Unpaid";
}

/** Label for remaining amount on bill totals (screen, print, PDF). */
export function billBalanceDueLabel(): string {
  return "Due";
}

/** Line has explicit or implied discount (DISC% column on bill). */
export function billLineHasDiscount(line: SaleLine): boolean {
  if ((line.discountPct ?? 0) > 0) return true;
  const mrp = Number(line.mrp) || 0;
  const qty = Number(line.qty) || 0;
  if (mrp <= 0 || qty <= 0) return false;
  const gross = Math.round(qty * mrp);
  const amt = line.amount != null ? Math.round(line.amount) : Math.round(qty * line.rate);
  return amt < gross;
}

/**
 * Bill-level discount from sale form (% or flat on total items) — show in totals.
 * Item-level discount uses DISC% column only, not this row.
 */
export function billShowsFooterDiscount(
  sale: Pick<Sale, "discountType" | "discountAmount">,
): boolean {
  return (
    sale.discountAmount > 0 &&
    (sale.discountType === "percent" || sale.discountType === "flat")
  );
}

export function billFooterDiscountLabel(
  sale: Pick<Sale, "discountType" | "discountValue">,
): string {
  if (sale.discountType === "percent") return `Discount (${sale.discountValue}%)`;
  return "Discount";
}

/** Subtotal before bill-level discount; when no bill discount, lines total is final subtotal. */
export function billSubtotalForDisplay(
  sale: Pick<Sale, "subtotal" | "afterDiscount" | "discountType" | "discountAmount">,
): number {
  return billShowsFooterDiscount(sale) ? sale.subtotal : sale.afterDiscount;
}

/**
 * DISC% column — item-level discounts only.
 * When bill-level discount is in totals, do not repeat discount on each line.
 */
export function billShowsLineDiscColumn(
  lines: SaleLine[],
  sale?: Pick<Sale, "discountType" | "discountAmount">,
): boolean {
  if (sale && billShowsFooterDiscount(sale)) return false;
  return lines.some(billLineHasDiscount);
}

/** One name on bill: legal/registered if set, else trading name. */
export function sellerBillName(b: Pick<BusinessSettings, "legalName" | "name">): string {
  const legal = b.legalName.trim();
  const trading = b.name.trim();
  return legal || trading || "—";
}

/** Address + phone under shop name (left column of letterhead). Dedupes repeated place names from Settings. */
export function sellerContactLine(
  b: Pick<
    BusinessSettings,
    "addressLine1" | "addressLine2" | "district" | "province" | "country" | "mobile" | "phone"
  >,
): string {
  const segments = formatSellerAddressSegments({
    addressLine1: b.addressLine1,
    addressLine2: b.addressLine2,
    district: b.district,
    province: b.province,
    country: b.country,
  });
  return buildSellerContactLine(segments, { mobile: b.mobile, phone: b.phone });
}

/** Seller tax line on bill: VAT if registered + number set, else PAN if set — never both. */
export function sellerTaxId(
  b: Pick<BusinessSettings, "vatRegistered" | "vatNumber" | "panNumber">,
): { label: "VAT" | "PAN"; number: string } | null {
  const vat = b.vatNumber.trim();
  const pan = b.panNumber.trim();
  if (b.vatRegistered && vat) return { label: "VAT", number: vat };
  if (pan) return { label: "PAN", number: pan };
  return null;
}

export type TaxRegistrationKind = "pan" | "vat";

export function taxKindFromSettings(
  b: Pick<BusinessSettings, "vatRegistered" | "vatNumber" | "panNumber">,
): TaxRegistrationKind {
  const vat = b.vatNumber.trim();
  if (b.vatRegistered && vat) return "vat";
  return "pan";
}

export function taxNumberFromSettings(
  b: Pick<BusinessSettings, "vatRegistered" | "vatNumber" | "panNumber">,
  kind: TaxRegistrationKind,
): string {
  if (kind === "vat") return b.vatNumber.trim();
  return b.panNumber.trim();
}

/** Payload fields for tenant_settings — one tax id only. */
export function taxFieldsForSave(
  kind: TaxRegistrationKind,
  number: string,
): {
  pan_number: string | null;
  vat_registered: boolean;
  vat_number: string | null;
} {
  const n = number.trim();
  if (!n) {
    return { pan_number: null, vat_registered: false, vat_number: null };
  }
  if (kind === "vat") {
    return { pan_number: null, vat_registered: true, vat_number: n };
  }
  return { pan_number: n, vat_registered: false, vat_number: null };
}
