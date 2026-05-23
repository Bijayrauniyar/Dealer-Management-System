/** Arguments for Supabase-backed domain write helpers. */
export interface CommitPaymentOpts {
  customerId: string;
  amount: number;
  mode: string;
  reference: string;
  date: string;
  allocations: { saleId: string; amount: number; billNo: string }[];
}

export interface CommitReturnOpts {
  customerId: string;
  saleId: string;
  billNo: string;
  creditAmount: number;
  lines: { productId: string; returnQty: number }[];
}

export interface CommitPurchaseOpts {
  supplierId: string;
  purchaseDate: string;
  lines: { productId: string; receivedQty: number; cost: number }[];
  totalReceived: number;
}

export interface CommitSupplierPaymentOpts {
  supplierId: string;
  amount: number;
  paymentDate: string;
  mode: string;
  notes?: string | null;
}
