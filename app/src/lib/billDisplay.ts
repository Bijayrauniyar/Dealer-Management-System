import type { BusinessSettings } from "@/domain/types";

export const BILL_VAT_RATE = 13;

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
