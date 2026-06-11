/** Arguments for Supabase-backed domain write helpers. */
export interface CommitPaymentOpts {
  customerId: string;
  amount: number;
  mode: string;
  reference: string;
  date: string;
  allocations: { saleId: string; amount: number; billNo: string }[];
}

export interface CommitAdvancePaymentOpts {
  customerId: string;
  amount: number;
  mode: string;
  reference: string;
  date: string;
}

export interface CommitReturnOpts {
  customerId: string;
  saleId: string;
  billNo: string;
  creditAmount: number;
  lines: { productId: string; returnQty: number }[];
  reason?: string;
}

export interface CommitPurchaseOpts {
  supplierId: string;
  purchaseDate: string;
  supplierInvoiceNo?: string | null;
  /** Due today or earlier → saved as paid (cash). Future / empty → credit. */
  dueDate?: string | null;
  lines: { productId: string; receivedQty: number; rateExcl: number }[];
  totalReceived: number;
}

export interface CommitPurchaseUpdateOpts {
  purchaseId: string;
  supplierId: string;
  purchaseDate: string;
  /** Set once when purchase has no invoice no. yet; omitted when already locked. */
  supplierInvoiceNo?: string | null;
  dueDate?: string | null;
  notes?: string | null;
  lines: { productId: string; receivedQty: number; rateExcl: number }[];
}

export interface CommitSupplierPaymentOpts {
  supplierId: string;
  amount: number;
  paymentDate: string;
  mode: string;
  notes?: string | null;
}
