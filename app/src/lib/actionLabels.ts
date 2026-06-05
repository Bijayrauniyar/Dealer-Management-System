/** User-facing labels for primary flows (Vyapar/Tally-style; keep in sync with quick menu + forms). */
export const SALES_INVOICE_LABEL = "Sales invoice";
export const PURCHASE_INVOICE_LABEL = "Purchase invoice";
/** Money received from customers (Vyapar: Payment In; Tally: Receipt). */
export const PAYMENT_IN_LABEL = "Payment in";
/** Money paid to suppliers (Vyapar: Payment Out). */
export const PAYMENT_OUT_LABEL = "Payment out";

/** Sticky bar primary actions on sale entry. */
export const SAVE_INVOICE_ACTION = "Save invoice";
export const UPDATE_INVOICE_ACTION = "Update invoice";
export const SAVE_INVOICE_PRINT_ACTION = "Save & print";
export const UPDATE_INVOICE_PRINT_ACTION = "Update & print";

/** @deprecated Use SAVE_INVOICE_ACTION */
export const SAVE_SALES_INVOICE_ACTION = SAVE_INVOICE_ACTION;
/** @deprecated Use UPDATE_INVOICE_ACTION */
export const UPDATE_SALES_INVOICE_ACTION = UPDATE_INVOICE_ACTION;
/** @deprecated Use SAVE_INVOICE_PRINT_ACTION */
export const SAVE_SALES_INVOICE_PRINT_ACTION = SAVE_INVOICE_PRINT_ACTION;
/** @deprecated Use UPDATE_INVOICE_PRINT_ACTION */
export const UPDATE_SALES_INVOICE_PRINT_ACTION = UPDATE_INVOICE_PRINT_ACTION;

export function salesInvoiceWithProductLabel(): string {
  return `${SALES_INVOICE_LABEL} with this product`;
}
