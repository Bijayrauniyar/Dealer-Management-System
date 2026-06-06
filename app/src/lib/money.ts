/** Bills, payments, totals — NPR paisa (2 decimals). */
export const MONEY_DECIMAL_PLACES = 2;

/** Product buy/sell/MRP — finer precision for distributor costing. */
export const PRICE_DECIMAL_PLACES = 4;

export function roundMoney(value: number, decimals = MONEY_DECIMAL_PLACES): number {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/** Format product/catalog price for hints (up to 4 decimals). */
export function formatPriceAmount(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: PRICE_DECIMAL_PLACES,
  }).format(roundMoney(value, PRICE_DECIMAL_PLACES));
}

/** String for money NumericInput when not focused (trims trailing zeros). */
export function formatAmountForInput(value: number, decimals = MONEY_DECIMAL_PLACES): string {
  if (value === 0) return "";
  const rounded = roundMoney(value, decimals);
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(rounded);
}

/** Spread on &lt;NumericInput&gt; for NPR fields (totals, payments). */
export const numericMoneyProps = {
  allowDecimal: true,
  decimalPlaces: MONEY_DECIMAL_PLACES,
} as const;

/** Spread on &lt;NumericInput&gt; for product catalog prices (buy, sell, MRP). */
export const numericPriceProps = {
  allowDecimal: true,
  decimalPlaces: PRICE_DECIMAL_PLACES,
} as const;

/** Spread on &lt;NumericInput&gt; for percentage fields (markup, discount %, VAT %). */
export const numericPercentProps = {
  allowDecimal: true,
  decimalPlaces: 2,
} as const;

/** Spread on &lt;NumericInput&gt; for quantities (invoice/received/sale qty — DB numeric(12,2)). */
export const numericQtyProps = {
  allowDecimal: true,
  decimalPlaces: 2,
} as const;

/** Round a percentage value for display/storage (e.g. 4.5% markup). */
export function roundPercent(value: number): number {
  return roundMoney(value, 2);
}
