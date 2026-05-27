/** NPR amounts: store and display up to 2 decimal places (paisa). */
export const MONEY_DECIMAL_PLACES = 2;

export function roundMoney(value: number, decimals = MONEY_DECIMAL_PLACES): number {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
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

/** Spread on &lt;NumericInput&gt; for NPR fields (prices, totals, payments). */
export const numericMoneyProps = {
  allowDecimal: true,
  decimalPlaces: MONEY_DECIMAL_PLACES,
} as const;
