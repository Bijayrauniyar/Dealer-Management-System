import type { BusinessSettings } from "@/domain/types";
import { MONEY_DECIMAL_PLACES, PRICE_DECIMAL_PLACES, roundMoney } from "@/lib/money";

/** @deprecated Use getVatPct(settings) — kept for gradual migration */
export const DEFAULT_VAT_PCT = 13;

export function getVatPct(
  b: Pick<BusinessSettings, "defaultVatPct">,
): number {
  const n = Number(b.defaultVatPct);
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_VAT_PCT;
}

export function addVatToExcl(
  excl: number,
  vatPct: number,
  decimals = MONEY_DECIMAL_PLACES,
): number {
  if (excl <= 0 || vatPct <= 0) return roundMoney(excl, decimals);
  return roundMoney(excl * (1 + vatPct / 100), decimals);
}

/** VAT add for product catalog prices (4 decimal places). */
export function addVatToExclPrice(excl: number, vatPct: number): number {
  return addVatToExcl(excl, vatPct, PRICE_DECIMAL_PLACES);
}

export function vatAmountFromExcl(excl: number, vatPct: number): number {
  if (excl <= 0 || vatPct <= 0) return 0;
  return roundMoney(excl * (vatPct / 100));
}

/** Split a VAT-inclusive unit or line amount into excl + vat + incl. */
export function splitInclusiveAmount(
  incl: number,
  vatPct: number,
  decimals = MONEY_DECIMAL_PLACES,
): { excl: number; vat: number; incl: number } {
  const roundedIncl = roundMoney(incl, decimals);
  if (roundedIncl <= 0) return { excl: 0, vat: 0, incl: 0 };
  if (vatPct <= 0) return { excl: roundedIncl, vat: 0, incl: roundedIncl };
  const excl = roundMoney(roundedIncl / (1 + vatPct / 100), decimals);
  const vat = roundMoney(roundedIncl - excl, decimals);
  return { excl, vat, incl: roundedIncl };
}

/** Product purchase_price is stored VAT-inclusive; derive excl for product form. */
export function purchasePriceExclFromProduct(
  incl: number,
  vatPct: number,
  decimals = PRICE_DECIMAL_PLACES,
): number {
  return splitInclusiveAmount(incl, vatPct, decimals).excl;
}
