import type { BusinessSettings } from "@/domain/types";
import { roundMoney } from "@/lib/money";

/** @deprecated Use getVatPct(settings) — kept for gradual migration */
export const DEFAULT_VAT_PCT = 13;

export function getVatPct(
  b: Pick<BusinessSettings, "defaultVatPct">,
): number {
  const n = Number(b.defaultVatPct);
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_VAT_PCT;
}

export function addVatToExcl(excl: number, vatPct: number): number {
  if (excl <= 0 || vatPct <= 0) return roundMoney(excl);
  return roundMoney(excl * (1 + vatPct / 100));
}

export function vatAmountFromExcl(excl: number, vatPct: number): number {
  if (excl <= 0 || vatPct <= 0) return 0;
  return roundMoney(excl * (vatPct / 100));
}

/** Split a VAT-inclusive unit or line amount into excl + vat + incl. */
export function splitInclusiveAmount(
  incl: number,
  vatPct: number,
): { excl: number; vat: number; incl: number } {
  const roundedIncl = roundMoney(incl);
  if (roundedIncl <= 0) return { excl: 0, vat: 0, incl: 0 };
  if (vatPct <= 0) return { excl: roundedIncl, vat: 0, incl: roundedIncl };
  const excl = roundMoney(roundedIncl / (1 + vatPct / 100));
  const vat = roundMoney(roundedIncl - excl);
  return { excl, vat, incl: roundedIncl };
}

/** Product purchase_price is stored VAT-inclusive; derive excl for purchase entry. */
export function purchasePriceExclFromProduct(incl: number, vatPct: number): number {
  return splitInclusiveAmount(incl, vatPct).excl;
}
