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
    return Math.round(qty * mrp * (1 - disc / 100));
  }
  const rate = Number(l.rate) || 0;
  return Math.round(qty * rate * (1 - disc / 100));
}

/** Unit price stored in DB so sum(qty×rate) matches subtotal. */
export function effectiveRateForRpc(l: LinePricing): number {
  const qty = Number(l.qty) || 0;
  if (qty <= 0) return 0;
  return Math.round(lineAmountFromMrp(l) / qty);
}
