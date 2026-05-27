import { roundMoney } from "@/lib/money";

/** MRP-based bill line calculations (customer-facing invoice). */

export type LinePricing = {
  qty: number;
  mrp: number;
  rate?: number;
  discountPct?: number;
};

/** Line amount on bill: Qty × MRP × (1 − line Disc%). */
export function lineAmountFromMrp(l: LinePricing): number {
  const mrp = Number(l.mrp) || 0;
  const qty = Number(l.qty) || 0;
  const disc = Number(l.discountPct ?? 0);
  if (mrp > 0) {
    return roundMoney(qty * mrp * (1 - disc / 100));
  }
  const rate = Number(l.rate) || 0;
  return roundMoney(qty * rate * (1 - disc / 100));
}

/** Line amount on printed/downloaded bill (matches DB subtotal). */
export function billLineAmount(line: {
  qty: number;
  rate: number;
  mrp?: number;
  discountPct?: number;
  amount?: number;
}): number {
  if (line.amount != null && Number.isFinite(line.amount)) {
    return roundMoney(line.amount);
  }
  const fromRate = roundMoney(line.qty * line.rate);
  if (line.rate > 0) return fromRate;
  return lineAmountFromMrp({
    qty: line.qty,
    mrp: line.mrp ?? line.rate,
    rate: line.rate,
    discountPct: line.discountPct,
  });
}

/** Unit price stored in DB so sum(qty×rate) matches subtotal. */
export function effectiveRateForRpc(l: LinePricing): number {
  const qty = Number(l.qty) || 0;
  if (qty <= 0) return 0;
  return roundMoney(lineAmountFromMrp(l) / qty);
}
