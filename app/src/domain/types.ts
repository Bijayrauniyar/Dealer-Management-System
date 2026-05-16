/**
 * Shared domain types — UI + Supabase mapping (no seed data).
 */

export type BusinessSettings = {
  name: string;
  legalName: string;
  region: string;
  currency: string;
  invoicePrefix: string;
  phone: string;
  mobile: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  district: string;
  province: string;
  country: string;
  panNumber: string;
  vatRegistered: boolean;
  vatNumber: string;
  billFooter: string;
  overdueDays: number;
  dueSoonDays: number;
  defaultMarkupPct: number;
  defaultMinQty: number;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  area: string;
  address: string;
  panNumber: string;
  outstanding: number;
  creditLimit: number;
  oldestBillDays: number;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  uom: string;
  mrp: number;
  costPrice: number;
  sellingPrice: number;
  discountPct: number;
  vatApplicable: boolean;
  onHand: number;
  minQty: number;
  description?: string;
};

export type Supplier = {
  id: string;
  name: string;
  legalName: string;
  contactPerson: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  district: string;
  country: string;
  panNumber: string;
  vatNumber: string;
  paymentTermsDays: number;
  outstanding: number;
  notes: string;
};

export type SaleLine = {
  productId: string;
  productName: string;
  uom: string;
  qty: number;
  mrp?: number;
  rate: number;
  discountPct?: number;
  amount?: number;
};

export type Sale = {
  id: string;
  billNo: string;
  date: string;
  customerId: string;
  customerName: string;
  lines: SaleLine[];
  subtotal: number;
  discountType: "none" | "flat" | "percent";
  discountValue: number;
  discountAmount: number;
  afterDiscount: number;
  billTerms: string;
  billTermsAmount: number;
  vatRate: number;
  vatAmount: number;
  grandTotal: number;
  paidNow: number;
  paymentMode: string;
  balance: number;
  dueDate: string;
  notes: string;
  total: number;
};

export type BillStatus = "paid" | "partial" | "overdue" | "current";

export type OutstandingBill = {
  id: string;
  saleId: string;
  customerId: string;
  billNo: string;
  billDate: string;
  dueDate: string;
  billTotal: number;
  paidAmount: number;
  balance: number;
  status: BillStatus;
};

export type Payment = {
  id: string;
  date: string;
  customerId: string;
  customerName: string;
  amount: number;
  mode: string;
  reference: string;
  billNo?: string;
};

export type CapitalEntry = {
  id: string;
  date: string;
  category: "fixed_asset" | "inventory" | "deposit" | "owner_capital" | "loan";
  name: string;
  amount: number;
  currentValue: number;
  notes: string;
};

export type ExpenseListItem = {
  id: string;
  date: string;
  category: string;
  amount: number;
  notes: string;
};

export type PurchaseListItem = {
  id: string;
  purchaseNo: string;
  date: string;
  total: number;
  supplierName: string;
};

export type PnlTotals = {
  lifetimePurchases: number;
  lifetimeExpenses: number;
  lifetimeReturnsCredit: number;
};

/** Cash worksheet for one day (Supabase aggregates). */
export type DailyCashBreakdown = {
  openingBalance: number;
  cashSalesToday: number;
  cashReceiptsToday: number;
  expensesCash: number;
  supplierPaymentsCash: number;
};
