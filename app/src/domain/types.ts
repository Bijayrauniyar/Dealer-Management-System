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
  /** Default VAT % for purchases (always) and sales when VAT registered. */
  defaultVatPct: number;
  billFooter: string;
  overdueDays: number;
  dueSoonDays: number;
  defaultMarkupPct: number;
  /** Low-stock default in base unit (PCS, etc.). */
  defaultMinQty: number;
  /** Low-stock default in pack unit (Box, etc.) when product has conversion. */
  defaultMinPackQty: number;
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

/** MRP and dealer sell price for one unit of measure. */
export type ProductUomPrice = {
  mrp: number;
  sellingPrice: number;
};

/** e.g. 1 Box = 10 PCS (base unit is product.uom). */
export type ProductUomConversion = {
  packUom: string;
  piecesPerPack: number;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  uom: string;
  mrp: number;
  costPrice: number;
  sellingPrice: number;
  /** Prices keyed by UOM (always includes primary `uom`). */
  uomPrices: Record<string, ProductUomPrice>;
  /** Optional pack size: 1 packUom = piecesPerPack × uom. */
  uomConversion: ProductUomConversion | null;
  discountPct: number;
  vatApplicable: boolean;
  onHand: number;
  minQty: number;
  /** Optional alert threshold in pack UOM (e.g. Box); 0 = use base minQty only. */
  minQtyPack?: number;
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
  /** Free under scheme (FOC row); also inferred when rate & amount are 0. */
  isFoc?: boolean;
  /** Shown under product name on bill, e.g. FOC or scheme name. */
  focNote?: string;
};

/** Buy-X-get-Y offer from scheme_tracker. */
export type ProductScheme = {
  id: string;
  schemeName: string;
  productId: string;
  buyQty: number;
  freeQty: number;
  /** Paid line must use this UOM when set (e.g. Box). */
  buyUom?: string | null;
  /** Free line uses this UOM when set (e.g. PCS); else same as paid line. */
  freeUom?: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
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
  /** Number on the supplier's tax invoice (optional). */
  supplierInvoiceNo: string;
  date: string;
  total: number;
  supplierId: string;
  supplierName: string;
  paid: number;
  paymentStatus: "unpaid" | "partial" | "paid";
};

export type PurchaseLineDetail = {
  productId: string;
  productName: string;
  qty: number;
  uom: string;
  rateExcl: number;
  rateIncl: number;
  vatAmount: number;
  amount: number;
};

export type PurchaseDetail = PurchaseListItem & {
  subtotalExcl: number;
  vatAmount: number;
  subtotal: number;
  notes: string;
  lines: PurchaseLineDetail[];
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
