import { roundMoney } from "@/lib/money";
import type { SalesBillPriceMode } from "@/lib/billPriceDisplay";

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

/** Rate column value on bill — Settings picks MRP or sell price; bill header always says Rate. */
export function billLineRateColumnValue(
  line: {
    qty: number;
    mrp?: number;
    rate: number;
    discountPct?: number;
    amount?: number;
  },
  mode: SalesBillPriceMode,
  piecesPerPack?: number,
): number {
  const raw = _billLineRateColumnRaw(line, mode);
  if (piecesPerPack && piecesPerPack > 1) {
    return roundMoney(raw / piecesPerPack);
  }
  return raw;
}

function _billLineRateColumnRaw(
  line: {
    qty: number;
    mrp?: number;
    rate: number;
    discountPct?: number;
    amount?: number;
  },
  mode: SalesBillPriceMode,
): number {
  if (mode === "selling_price") {
    return Number(line.rate) > 0 ? Number(line.rate) : Number(line.mrp) || 0;
  }
  const disc = Number(line.discountPct ?? 0);
  if (disc > 0) {
    return saleLineDisplayMrp(line);
  }
  return saleLineChargeUnit(
    { mrp: Number(line.mrp) || 0, rate: Number(line.rate) || 0 },
    "mrp",
  );
}

/** Per-unit price used for line total — follows Settings (MRP vs selling price). */
export function saleLineChargeUnit(
  line: { mrp: number; rate: number },
  mode: SalesBillPriceMode,
): number {
  if (mode === "selling_price") {
    return Number(line.rate) > 0 ? Number(line.rate) : Number(line.mrp) || 0;
  }
  return Number(line.mrp) > 0 ? Number(line.mrp) : Number(line.rate) || 0;
}

/** Line amount on sales entry — respects Settings price column choice. */
export function saleEntryLineAmount(
  line: LinePricing & { discountPct?: number },
  mode: SalesBillPriceMode,
): number {
  const qty = Number(line.qty) || 0;
  const disc = Number(line.discountPct ?? 0);
  const unit = saleLineChargeUnit(
    { mrp: Number(line.mrp) || 0, rate: Number(line.rate) || 0 },
    mode,
  );
  return roundMoney(qty * unit * (1 - disc / 100));
}

/** Unit price stored in DB so sum(qty×rate) matches subtotal. */
export function effectiveRateForRpc(l: LinePricing): number {
  const qty = Number(l.qty) || 0;
  if (qty <= 0) return 0;
  return roundMoney(lineAmountFromMrp(l) / qty);
}

/**
 * Label MRP on a saved bill line.
 * With line Disc% → reverse from amount (dealer shows MRP + discount).
 * Without → stored rate per unit (matches what was charged; ignores catalog drift).
 */
export function saleLineDisplayMrp(line: {
  qty: number;
  rate: number;
  mrp?: number;
  discountPct?: number;
  amount?: number;
}): number {
  const qty = Number(line.qty) || 0;
  const rate = Number(line.rate) || 0;
  const disc = Number(line.discountPct ?? 0);
  const amt = billLineAmount(line);

  if (qty <= 0) return Number(line.mrp) || rate || 0;

  if (disc > 0 && amt > 0) {
    const label = roundMoney(amt / (qty * (1 - disc / 100)));
    if (label > 0) return label;
  }

  if (rate > 0) return rate;
  return Number(line.mrp) || 0;
}

/** RPC rate when shop uses MRP or selling price for line totals. */
export function effectiveRateForRpcWithMode(
  line: LinePricing & { discountPct?: number },
  mode: SalesBillPriceMode,
): number {
  const qty = Number(line.qty) || 0;
  if (qty <= 0) return 0;
  return roundMoney(saleEntryLineAmount(line, mode) / qty);
}
