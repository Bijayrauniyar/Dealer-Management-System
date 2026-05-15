/**
 * Dummy data – mirrors the "Havmor Distributor – Parsa & Bara (NPR)" control sheet
 * plus enough list data for every screen.
 *
 * When the real backend is wired up, replace the per-hook static arrays
 * with TanStack Query fetches. The component contracts stay the same.
 */

// ─── Business / Tenant settings ──────────────────────────────────────────────
export const BUSINESS = {
  name:           "Havmor Ice Cream Distributor",
  legalName:      "Sharma Distributor Pvt. Ltd.",
  region:         "Parsa & Bara",
  currency:       "NPR",
  invoicePrefix:  "HB",
  // Contact
  phone:          "056-521234",
  mobile:         "9845001122",
  email:          "havmor.parsa@gmail.com",
  // Address
  addressLine1:   "Ghantaghar Road",
  addressLine2:   "Birgunj-06",
  district:       "Parsa",
  province:       "Madhesh",
  country:        "Nepal",
  // Tax / registration
  panNumber:      "305812456",      // 9-digit Nepal PAN
  vatRegistered:  false,            // flip to true when VAT registered
  vatNumber:      "",               // 9-digit VAT (same as PAN once registered)
  // Bill footer text (printed on invoices)
  billFooter:     "Thank you for your business! Goods once sold are not returnable without prior approval.",

  // ── Configurable operational thresholds ───────────────────────
  // These live in Settings and can be changed by the dealer.
  overdueDays:    7,     // bills past due date by this many days are marked "Overdue"
  dueSoonDays:    3,     // bills due within this many days get a "due soon" reminder

  // ── Product defaults (pre-fill new product form) ───────────────
  defaultMarkupPct:   15,   // default % markup over buy price → auto-calculates sell price
  defaultMinQty:      20,   // default low-stock threshold applied to every new product
};

export type BusinessSettings = typeof BUSINESS;

// ─── Dashboard / Period KPIs (sheet: Feb 2026 – May 2026) ─────────────────────
export const PERIOD = { from: "2026-02-01", to: "2026-05-01" };

export const DASHBOARD = {
  totalSales:        193_820,
  totalPurchase:      55_640,
  totalExpenses:     151_500,
  returnsCredit:       4_639,
  netProfit:         -17_959,
  pendingDue:         30_430,
  supplierPayable:   442_000,
  damageQty:              47,
  freezerDeposits:    72_000,
  todaySales:         18_200,
  todaySalesCount:         6,
  todayCollection:    12_000,
};

export const AGING = [
  { bucket: "0–7 days",   days: "0-7",   amount:      0 },
  { bucket: "8–30 days",  days: "8-30",  amount:      0 },
  { bucket: "31–60 days", days: "31-60", amount: 12_620 },
  { bucket: "60+ days",   days: "60+",   amount: 17_810 },
];

// ─── Customers ────────────────────────────────────────────────────────────────
export type Customer = {
  id: string;
  name: string;
  phone: string;
  area: string;          // locality / short area name
  address: string;       // full address line printed on bills
  panNumber: string;     // VAT/PAN No — क्रेताको पान नं.
  outstanding: number;
  creditLimit: number;
  oldestBillDays: number;
};

export const CUSTOMERS: Customer[] = [
  { id: "c1", name: "Ghantaghar Stores",      phone: "9841123456", area: "Birgunj",    address: "Ghantaghar, Birgunj-05, Parsa",       panNumber: "302156789", outstanding: 18_400, creditLimit: 25_000, oldestBillDays: 34 },
  { id: "c2", name: "Adarsha Cold Store",     phone: "9842234567", area: "Birgunj",    address: "New Road, Birgunj-03, Parsa",          panNumber: "304567890", outstanding: 11_915, creditLimit: 20_000, oldestBillDays:  5 },
  { id: "c3", name: "Birgunj Bazar Sweets",   phone: "9843345678", area: "Birgunj",    address: "Bazar Chowk, Birgunj-02, Parsa",       panNumber: "",          outstanding:  9_200, creditLimit: 15_000, oldestBillDays: 12 },
  { id: "c4", name: "Kalaiya Grocery",        phone: "9844456789", area: "Kalaiya",    address: "Main Market, Kalaiya-01, Bara",        panNumber: "308901234", outstanding:  7_500, creditLimit: 10_000, oldestBillDays: 22 },
  { id: "c5", name: "Simara Junction Store",  phone: "9845567890", area: "Simara",     address: "Simara Road, Simara-02, Bara",         panNumber: "",          outstanding:  5_800, creditLimit: 10_000, oldestBillDays: 17 },
  { id: "c6", name: "Parsa Fresh Dairy",      phone: "9846678901", area: "Parsa",      address: "Parsa Bazaar, Birgunj-08, Parsa",      panNumber: "",          outstanding:  3_100, creditLimit:  8_000, oldestBillDays:  3 },
  { id: "c7", name: "Mahendra Highway Store", phone: "9847789012", area: "Birgunj",    address: "Mahendra Highway, Birgunj-09, Parsa",  panNumber: "",          outstanding:  2_400, creditLimit:  5_000, oldestBillDays:  8 },
  { id: "c8", name: "Narayanganj Sweet",      phone: "9848890123", area: "Narayanganj",address: "Narayanganj-01, Parsa",                panNumber: "",          outstanding:  1_800, creditLimit:  5_000, oldestBillDays:  1 },
];

// ─── Products ─────────────────────────────────────────────────────────────────
export type Product = {
  id:           string;
  name:         string;
  category:     string;
  uom:          string;    // Unit of Measure: PCS, Box, Ltr, Kg …

  // ── Pricing (all in NPR) ─────────────────────────────────────
  mrp:          number;    // Max Retail Price printed on product — shown on bill so customer can see MRP
  costPrice:    number;    // Buy price from Havmor — PRIVATE, used only for profit calc, never shown to customers
  sellingPrice: number;    // Our price to the customer (excl. VAT if vatApplicable)
  discountPct:  number;    // Standard % discount given on this product (0 = none)

  // ── VAT ──────────────────────────────────────────────────────
  // When vatApplicable = true, sellingPrice is EXCLUSIVE of VAT.
  // On the sales bill: line amount = qty × sellingPrice, then VAT (13%)
  // is added at bill footer — NOT on each line.
  vatApplicable: boolean;

  // ── Stock ─────────────────────────────────────────────────────
  onHand:  number;   // current stock on hand
  minQty:  number;   // low-stock threshold — configurable per product

  description?: string;
};

// Helper — keep arithmetic in one place
const p = (
  id: string, name: string, category: string, uom: string,
  mrp: number, cost: number, sell: number,
  onHand: number, minQty: number,
  discountPct = 0, vatApplicable = false,
): Product => ({
  id, name, category, uom, mrp,
  costPrice: cost, sellingPrice: sell, discountPct, vatApplicable,
  onHand, minQty,
});

export const PRODUCTS: Product[] = [
  // id,  name,                          category,     uom,   mrp, cost, sell, onHand, minQty, discountPct, vatApplicable
  p("p1",  "Havmor Vanilla 500ml",      "Ice Cream", "PCS",  200, 120, 160, 240, 50,  5),       // 5% standard trade discount
  p("p2",  "Havmor Chocolate 500ml",    "Ice Cream", "PCS",  220, 135, 180, 190, 50,  5),       // 5%
  p("p3",  "Havmor Mango 500ml",        "Ice Cream", "PCS",  210, 128, 170, 310, 50,  3),       // 3% seasonal
  p("p4",  "Havmor Butter Scotch 1L",   "Ice Cream", "PCS",  360, 210, 280,  85, 30),           // no discount
  p("p5",  "Havmor Strawberry 500ml",   "Ice Cream", "PCS",  200, 120, 160,  42, 50),           // no discount
  p("p6",  "Havmor Cassata 1L",         "Ice Cream", "PCS",  400, 240, 320,  75, 20, 10),       // 10% bulk deal
  p("p7",  "Havmor Choco Bar (box 12)", "Bar",       "Box",  600, 360, 480, 120, 30,  5),       // 5%
  p("p8",  "Havmor Kulfi (box 12)",     "Bar",       "Box",  540, 315, 420,  90, 30,  5),       // 5%
  p("p9",  "Havmor Party Pack 2L",      "Party",     "PCS",  650, 390, 520,  34, 20),           // no discount
  p("p10", "Havmor Kesar Pista 1L",     "Ice Cream", "PCS",  450, 270, 360,  18, 20),           // no discount
];

// ─── Top 5 products by qty (period) ───────────────────────────────────────────
export const TOP_PRODUCTS = [
  { productId: "p3", name: "Havmor Mango 500ml",      qty: 480, revenue: 81_600 },
  { productId: "p1", name: "Havmor Vanilla 500ml",    qty: 420, revenue: 67_200 },
  { productId: "p2", name: "Havmor Chocolate 500ml",  qty: 310, revenue: 55_800 },
  { productId: "p7", name: "Havmor Choco Bar (box 12)", qty: 180, revenue: 86_400 },
  { productId: "p4", name: "Havmor Butter Scotch 1L", qty: 130, revenue: 36_400 },
];

// ─── Top 5 customers by sales (period) ───────────────────────────────────────
export const TOP_CUSTOMERS = [
  { customerId: "c1", name: "Ghantaghar Stores",    sales: 48_200 },
  { customerId: "c2", name: "Adarsha Cold Store",   sales: 36_500 },
  { customerId: "c3", name: "Birgunj Bazar Sweets", sales: 29_100 },
  { customerId: "c4", name: "Kalaiya Grocery",      sales: 21_000 },
  { customerId: "c5", name: "Simara Junction Store",sales: 18_700 },
];

// ─── Overdue customers ────────────────────────────────────────────────────────
export const OVERDUE = CUSTOMERS.filter((c) => c.oldestBillDays > 7 && c.outstanding > 0).sort(
  (a, b) => b.outstanding - a.outstanding,
);

// ─── Suppliers ────────────────────────────────────────────────────────────────
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
  vatNumber: string;          // blank if not VAT registered
  paymentTermsDays: number;
  outstanding: number;
  notes: string;
};

export const SUPPLIERS: Supplier[] = [
  {
    id: "s1",
    name:          "Havmor Foods Ltd (HO)",
    legalName:     "Havmor Ice Cream Ltd.",
    contactPerson: "Rajesh Mehta (Sales Manager)",
    phone:         "079-61234567",
    email:         "distributor@havmor.com",
    addressLine1:  "Havmor House, S.G. Highway",
    addressLine2:  "Ahmedabad - 380054",
    district:      "Ahmedabad",
    country:       "India",
    panNumber:     "AAACH1234F",
    vatNumber:     "24AAACH1234F1ZA",
    paymentTermsDays: 30,
    outstanding:   380_000,
    notes:         "Primary supplier. Order cutoff: Monday 5 PM.",
  },
  {
    id: "s2",
    name:          "Packaging Plus Nepal",
    legalName:     "Packaging Plus Nepal Pvt. Ltd.",
    contactPerson: "Suresh Thapa",
    phone:         "9841000002",
    email:         "packagingplus@gmail.com",
    addressLine1:  "Putalisadak",
    addressLine2:  "Kathmandu-02",
    district:      "Kathmandu",
    country:       "Nepal",
    panNumber:     "309871234",
    vatNumber:     "",
    paymentTermsDays: 15,
    outstanding:    42_000,
    notes:         "Packaging bags, stickers, carry boxes.",
  },
  {
    id: "s3",
    name:          "FrostLine Transport Co.",
    legalName:     "FrostLine Transport Pvt. Ltd.",
    contactPerson: "Bikash Yadav",
    phone:         "9841000003",
    email:         "frostline@gmail.com",
    addressLine1:  "Simara Road",
    addressLine2:  "Birgunj-04",
    district:      "Parsa",
    country:       "Nepal",
    panNumber:     "302345678",
    vatNumber:     "",
    paymentTermsDays: 15,
    outstanding:    20_000,
    notes:         "Cold-chain transport for incoming Havmor shipments.",
  },
];

// ─── Sales / Bills ────────────────────────────────────────────────────────────
export type SaleLine = {
  productId: string;
  productName: string;
  uom: string;           // Unit of Measure — PCS, Box, Ltr, etc.
  qty: number;
  mrp?: number;          // MRP on product label — stored at time of billing for reference
  rate: number;          // Our sell price (excl. VAT) — printed as "Rate" on bill
  discountPct?: number;  // Per-line product discount % (0 = none); line amount = qty × rate × (1 − discountPct/100)
  amount?: number;       // Computed line total (qty × rate × (1 − discountPct/100)); optional for backward compat
  // addLess: number;    // Phase 2: per-line adjustment (+/−)
};

export type Sale = {
  id: string;
  billNo: string;
  date: string;          // ISO AD date
  customerId: string;
  customerName: string;
  lines: SaleLine[];
  subtotal: number;
  discountType: "none" | "flat" | "percent";
  discountValue: number;      // flat amount or % figure
  discountAmount: number;     // resolved deduction
  afterDiscount: number;      // subtotal − discountAmount (taxable base)
  billTerms: string;          // label for add. charges e.g. "Transport"
  billTermsAmount: number;    // add. charges added to bill
  vatRate: number;            // 0 or 13 (%)
  vatAmount: number;          // (afterDiscount + billTermsAmount) × vatRate / 100
  grandTotal: number;         // afterDiscount + billTermsAmount + vatAmount
  paidNow: number;            // collected at time of billing
  paymentMode: string;
  balance: number;            // grandTotal − paidNow
  dueDate: string;
  notes: string;
  total: number;              // alias = grandTotal (backward compat)
};

// Helper — computes derived fields so we don't repeat arithmetic
function mkSale(s: Omit<Sale, "afterDiscount" | "vatAmount" | "grandTotal" | "total">): Sale {
  const afterDiscount = s.subtotal - s.discountAmount;
  const taxBase       = afterDiscount + s.billTermsAmount;
  const vatAmount     = Math.round(taxBase * s.vatRate / 100);
  const grandTotal    = taxBase + vatAmount;
  return { ...s, afterDiscount, vatAmount, grandTotal, total: grandTotal };
}

export const SALES: Sale[] = [
  // ── c1 Ghantaghar Stores ──────────────────────────────────────────────────
  mkSale({
    id: "sl-c1-1", billNo: "HB-115", date: "2026-03-25", customerId: "c1", customerName: "Ghantaghar Stores",
    lines: [
      { productId: "p1", productName: "Havmor Vanilla 500ml",      uom: "PCS", qty: 20, rate: 160 },
      { productId: "p3", productName: "Havmor Mango 500ml",        uom: "PCS", qty: 15, rate: 170 },
      { productId: "p7", productName: "Havmor Choco Bar (box 12)", uom: "Box", qty:  5, rate: 480 },
    ],
    subtotal: 8_750, discountType: "flat", discountValue: 250, discountAmount: 250,
    billTerms: "", billTermsAmount: 0, vatRate: 0,
    paidNow: 8_500, paymentMode: "Cash", balance: 0,
    dueDate: "2026-04-01", notes: "Full payment at delivery.",
  }),
  mkSale({
    id: "sl-c1-2", billNo: "HB-128", date: "2026-04-10", customerId: "c1", customerName: "Ghantaghar Stores",
    lines: [
      { productId: "p2", productName: "Havmor Chocolate 500ml", uom: "PCS", qty: 25, rate: 180 },
      { productId: "p6", productName: "Havmor Cassata 1L",      uom: "PCS", qty: 10, rate: 320 },
      { productId: "p9", productName: "Havmor Party Pack 2L",   uom: "PCS", qty:  5, rate: 520 },
    ],
    subtotal: 10_300, discountType: "percent", discountValue: 3, discountAmount: 309,
    billTerms: "Transport", billTermsAmount: 500, vatRate: 0,
    paidNow: 2_000, paymentMode: "Cash", balance: 8_491,
    dueDate: "2026-04-17", notes: "Partial cash at delivery.",
  }),
  mkSale({
    id: "sl-c1-3", billNo: "HB-135", date: "2026-04-26", customerId: "c1", customerName: "Ghantaghar Stores",
    lines: [
      { productId: "p3", productName: "Havmor Mango 500ml",      uom: "PCS", qty: 20, rate: 170 },
      { productId: "p4", productName: "Havmor Butter Scotch 1L", uom: "PCS", qty: 10, rate: 280 },
    ],
    subtotal: 6_200, discountType: "none", discountValue: 0, discountAmount: 0,
    billTerms: "", billTermsAmount: 0, vatRate: 0,
    paidNow: 0, paymentMode: "", balance: 6_200,
    dueDate: "2026-05-03", notes: "",
  }),
  mkSale({
    id: "sl1", billNo: "HB-142", date: "2026-05-14", customerId: "c1", customerName: "Ghantaghar Stores",
    lines: [
      { productId: "p1", productName: "Havmor Vanilla 500ml",   uom: "PCS", qty: 6, rate: 160 },
      { productId: "p2", productName: "Havmor Chocolate 500ml", uom: "PCS", qty: 6, rate: 180 },
      { productId: "p3", productName: "Havmor Mango 500ml",     uom: "PCS", qty: 6, rate: 170 },
    ],
    subtotal: 3_060, discountType: "flat", discountValue: 60, discountAmount: 60,
    billTerms: "", billTermsAmount: 0, vatRate: 0,
    paidNow: 0, paymentMode: "", balance: 3_000,
    dueDate: "2026-05-21", notes: "Scheme: summer flat NPR 10/item.",
  }),

  // ── c2 Adarsha Cold Store ─────────────────────────────────────────────────
  mkSale({
    id: "sl-c2-1", billNo: "HB-120", date: "2026-04-20", customerId: "c2", customerName: "Adarsha Cold Store",
    lines: [
      { productId: "p7", productName: "Havmor Choco Bar (box 12)", uom: "Box", qty: 6, rate: 480 },
      { productId: "p8", productName: "Havmor Kulfi (box 12)",     uom: "Box", qty: 5, rate: 420 },
    ],
    subtotal: 5_880, discountType: "percent", discountValue: 5, discountAmount: 294,
    billTerms: "", billTermsAmount: 0, vatRate: 0,
    paidNow: 5_586, paymentMode: "eSewa", balance: 0,
    dueDate: "2026-04-27", notes: "",
  }),
  mkSale({
    id: "sl-c2-2", billNo: "HB-138", date: "2026-05-09", customerId: "c2", customerName: "Adarsha Cold Store",
    lines: [
      { productId: "p3",  productName: "Havmor Mango 500ml",       uom: "PCS", qty: 30, rate: 170 },
      { productId: "p9",  productName: "Havmor Party Pack 2L",     uom: "PCS", qty:  8, rate: 520 },
      { productId: "p10", productName: "Havmor Kesar Pista 1L",    uom: "PCS", qty:  5, rate: 360 },
    ],
    subtotal: 9_960, discountType: "flat", discountValue: 1_000, discountAmount: 1_000,
    billTerms: "", billTermsAmount: 0, vatRate: 0,
    paidNow: 0, paymentMode: "", balance: 8_960,
    dueDate: "2026-05-16", notes: "Bulk deal — NPR 1,000 off.",
  }),
  mkSale({
    id: "sl3", billNo: "HB-141", date: "2026-05-13", customerId: "c2", customerName: "Adarsha Cold Store",
    lines: [{ productId: "p7", productName: "Havmor Choco Bar (box 12)", uom: "Box", qty: 6, rate: 480 }],
    subtotal: 2_880, discountType: "none", discountValue: 0, discountAmount: 0,
    billTerms: "", billTermsAmount: 0, vatRate: 0,
    paidNow: 0, paymentMode: "", balance: 2_880,
    dueDate: "2026-05-20", notes: "",
  }),

  // ── c3 Birgunj Bazar Sweets ───────────────────────────────────────────────
  mkSale({
    id: "sl-c3-1", billNo: "HB-133", date: "2026-05-02", customerId: "c3", customerName: "Birgunj Bazar Sweets",
    lines: [
      { productId: "p1", productName: "Havmor Vanilla 500ml",   uom: "PCS", qty: 20, rate: 160 },
      { productId: "p2", productName: "Havmor Chocolate 500ml", uom: "PCS", qty: 15, rate: 180 },
      { productId: "p3", productName: "Havmor Mango 500ml",     uom: "PCS", qty: 15, rate: 170 },
    ],
    subtotal: 9_650, discountType: "percent", discountValue: 5, discountAmount: 482,
    billTerms: "", billTermsAmount: 0, vatRate: 0,
    paidNow: 8_000, paymentMode: "Cheque", balance: 1_168,
    dueDate: "2026-05-09", notes: "Cheque CH-1012 for NPR 8,000 received.",
  }),
  mkSale({
    id: "sl2", billNo: "HB-143", date: "2026-05-14", customerId: "c3", customerName: "Birgunj Bazar Sweets",
    lines: [
      { productId: "p3", productName: "Havmor Mango 500ml",      uom: "PCS", qty: 30, rate: 170 },
      { productId: "p4", productName: "Havmor Butter Scotch 1L", uom: "PCS", qty: 10, rate: 280 },
    ],
    subtotal: 7_900, discountType: "none", discountValue: 0, discountAmount: 0,
    billTerms: "", billTermsAmount: 0, vatRate: 0,
    paidNow: 0, paymentMode: "", balance: 7_900,
    dueDate: "2026-05-21", notes: "",
  }),

  // ── c4 Kalaiya Grocery ────────────────────────────────────────────────────
  mkSale({
    id: "sl-c4-1", billNo: "HB-124", date: "2026-04-22", customerId: "c4", customerName: "Kalaiya Grocery",
    lines: [
      { productId: "p3", productName: "Havmor Mango 500ml",   uom: "PCS", qty: 20, rate: 170 },
      { productId: "p1", productName: "Havmor Vanilla 500ml", uom: "PCS", qty: 10, rate: 160 },
    ],
    subtotal: 5_000, discountType: "none", discountValue: 0, discountAmount: 0,
    billTerms: "", billTermsAmount: 0, vatRate: 0,
    paidNow: 0, paymentMode: "", balance: 5_000,
    dueDate: "2026-04-29", notes: "",
  }),
  mkSale({
    id: "sl-c4-2", billNo: "HB-137", date: "2026-05-06", customerId: "c4", customerName: "Kalaiya Grocery",
    lines: [
      { productId: "p4", productName: "Havmor Butter Scotch 1L", uom: "PCS", qty: 10, rate: 280 },
      { productId: "p6", productName: "Havmor Cassata 1L",       uom: "PCS", qty:  5, rate: 320 },
    ],
    subtotal: 4_400, discountType: "flat", discountValue: 400, discountAmount: 400,
    billTerms: "", billTermsAmount: 0, vatRate: 0,
    paidNow: 2_500, paymentMode: "Mobile banking", balance: 1_500,
    dueDate: "2026-05-13", notes: "MB-4421 partial.",
  }),

  // ── c5 Simara Junction Store ──────────────────────────────────────────────
  mkSale({
    id: "sl-c5-1", billNo: "HB-130", date: "2026-04-27", customerId: "c5", customerName: "Simara Junction Store",
    lines: [
      { productId: "p2", productName: "Havmor Chocolate 500ml",   uom: "PCS", qty: 12, rate: 180 },
      { productId: "p7", productName: "Havmor Choco Bar (box 12)", uom: "Box", qty:  3, rate: 480 },
    ],
    subtotal: 3_600, discountType: "none", discountValue: 0, discountAmount: 0,
    billTerms: "", billTermsAmount: 0, vatRate: 0,
    paidNow: 0, paymentMode: "", balance: 3_600,
    dueDate: "2026-05-04", notes: "",
  }),
  mkSale({
    id: "sl4", billNo: "HB-140", date: "2026-05-12", customerId: "c5", customerName: "Simara Junction Store",
    lines: [{ productId: "p1", productName: "Havmor Vanilla 500ml", uom: "PCS", qty: 10, rate: 160 }],
    subtotal: 1_600, discountType: "none", discountValue: 0, discountAmount: 0,
    billTerms: "", billTermsAmount: 0, vatRate: 0,
    paidNow: 0, paymentMode: "", balance: 1_600,
    dueDate: "2026-05-19", notes: "",
  }),

  // ── c6 Parsa Fresh Dairy ──────────────────────────────────────────────────
  mkSale({
    id: "sl-c6-1", billNo: "HB-144", date: "2026-05-11", customerId: "c6", customerName: "Parsa Fresh Dairy",
    lines: [
      { productId: "p5", productName: "Havmor Strawberry 500ml", uom: "PCS", qty: 10, rate: 160 },
      { productId: "p8", productName: "Havmor Kulfi (box 12)",   uom: "Box", qty:  3, rate: 420 },
    ],
    subtotal: 2_860, discountType: "none", discountValue: 0, discountAmount: 0,
    billTerms: "", billTermsAmount: 0, vatRate: 0,
    paidNow: 0, paymentMode: "", balance: 2_860,
    dueDate: "2026-05-18", notes: "",
  }),

  // ── c7 Mahendra Highway Store ─────────────────────────────────────────────
  mkSale({
    id: "sl-c7-1", billNo: "HB-139", date: "2026-05-06", customerId: "c7", customerName: "Mahendra Highway Store",
    lines: [
      { productId: "p3", productName: "Havmor Mango 500ml",   uom: "PCS", qty:  8, rate: 170 },
      { productId: "p1", productName: "Havmor Vanilla 500ml", uom: "PCS", qty:  5, rate: 160 },
    ],
    subtotal: 2_160, discountType: "none", discountValue: 0, discountAmount: 0,
    billTerms: "", billTermsAmount: 0, vatRate: 0,
    paidNow: 0, paymentMode: "", balance: 2_160,
    dueDate: "2026-05-13", notes: "",
  }),

  // ── c8 Narayanganj Sweet — VAT demo bill ──────────────────────────────────
  mkSale({
    id: "sl-c8-1", billNo: "HB-145", date: "2026-05-13", customerId: "c8", customerName: "Narayanganj Sweet",
    lines: [
      { productId: "p6", productName: "Havmor Cassata 1L",    uom: "PCS", qty: 3, rate: 320 },
      { productId: "p9", productName: "Havmor Party Pack 2L", uom: "PCS", qty: 2, rate: 520 },
    ],
    subtotal: 2_000, discountType: "none", discountValue: 0, discountAmount: 0,
    billTerms: "Transport", billTermsAmount: 200, vatRate: 13,  // VAT demo
    paidNow: 0, paymentMode: "", balance: 2_486,
    dueDate: "2026-05-20", notes: "VAT bill — customer requested.",
  }),
];

// Quick lookup map by billNo (used by BillDetailPage)
export const SALES_BY_BILL: Record<string, (typeof SALES)[0]> = Object.fromEntries(
  SALES.map((s) => [s.billNo, s]),
);

// ─── Outstanding bills (one row per sale — tracks what is paid / still due) ───
export type BillStatus = "paid" | "partial" | "overdue" | "current";

export type OutstandingBill = {
  id: string;
  saleId: string;
  customerId: string;
  billNo: string;
  billDate: string;       // date sale was created
  dueDate: string;        // payment must be received by this date
  billTotal: number;
  paidAmount: number;
  balance: number;        // billTotal - paidAmount
  status: BillStatus;
};

export const OUTSTANDING_BILLS: OutstandingBill[] = [
  // ── c1 Ghantaghar Stores (outstanding 18,400) ─────────────────────────────
  { id: "ob-c1-1", saleId: "sl-c1-1", customerId: "c1", billNo: "HB-115", billDate: "2026-03-25", dueDate: "2026-04-01", billTotal: 8_500,  paidAmount: 8_500, balance: 0,      status: "paid" },
  { id: "ob-c1-2", saleId: "sl-c1-2", customerId: "c1", billNo: "HB-128", billDate: "2026-04-10", dueDate: "2026-04-17", billTotal: 10_000, paidAmount: 2_000, balance: 8_000,  status: "overdue" },
  { id: "ob-c1-3", saleId: "sl-c1-3", customerId: "c1", billNo: "HB-135", billDate: "2026-04-26", dueDate: "2026-05-03", billTotal: 6_000,  paidAmount: 0,     balance: 6_000,  status: "overdue" },
  { id: "ob-c1-4", saleId: "sl1",     customerId: "c1", billNo: "HB-142", billDate: "2026-05-14", dueDate: "2026-05-21", billTotal: 4_400,  paidAmount: 0,     balance: 4_400,  status: "current" },

  // ── c2 Adarsha Cold Store (outstanding 11,915) ────────────────────────────
  { id: "ob-c2-1", saleId: "sl-c2-1", customerId: "c2", billNo: "HB-120", billDate: "2026-04-20", dueDate: "2026-04-27", billTotal: 5_200,  paidAmount: 5_200, balance: 0,      status: "paid" },
  { id: "ob-c2-2", saleId: "sl-c2-2", customerId: "c2", billNo: "HB-138", billDate: "2026-05-09", dueDate: "2026-05-16", billTotal: 8_915,  paidAmount: 0,     balance: 8_915,  status: "current" },
  { id: "ob-c2-3", saleId: "sl3",     customerId: "c2", billNo: "HB-141", billDate: "2026-05-13", dueDate: "2026-05-20", billTotal: 3_000,  paidAmount: 0,     balance: 3_000,  status: "current" },

  // ── c3 Birgunj Bazar Sweets (outstanding 9,200) ───────────────────────────
  { id: "ob-c3-1", saleId: "sl-c3-1", customerId: "c3", billNo: "HB-133", billDate: "2026-05-02", dueDate: "2026-05-09", billTotal: 9_200,  paidAmount: 8_000, balance: 1_200,  status: "overdue" },
  { id: "ob-c3-2", saleId: "sl2",     customerId: "c3", billNo: "HB-143", billDate: "2026-05-14", dueDate: "2026-05-21", billTotal: 8_000,  paidAmount: 0,     balance: 8_000,  status: "current" },

  // ── c4 Kalaiya Grocery (outstanding 7,500) ────────────────────────────────
  { id: "ob-c4-1", saleId: "sl-c4-1", customerId: "c4", billNo: "HB-124", billDate: "2026-04-22", dueDate: "2026-04-29", billTotal: 5_000,  paidAmount: 0,     balance: 5_000,  status: "overdue" },
  { id: "ob-c4-2", saleId: "sl-c4-2", customerId: "c4", billNo: "HB-137", billDate: "2026-05-06", dueDate: "2026-05-13", billTotal: 5_000,  paidAmount: 2_500, balance: 2_500,  status: "overdue" },

  // ── c5 Simara Junction Store (outstanding 5,800) ──────────────────────────
  { id: "ob-c5-1", saleId: "sl-c5-1", customerId: "c5", billNo: "HB-130", billDate: "2026-04-27", dueDate: "2026-05-04", billTotal: 4_200,  paidAmount: 0,     balance: 4_200,  status: "overdue" },
  { id: "ob-c5-2", saleId: "sl4",     customerId: "c5", billNo: "HB-140", billDate: "2026-05-12", dueDate: "2026-05-19", billTotal: 1_600,  paidAmount: 0,     balance: 1_600,  status: "current" },

  // ── c6 Parsa Fresh Dairy (outstanding 3,100) ──────────────────────────────
  { id: "ob-c6-1", saleId: "sl-c6-1", customerId: "c6", billNo: "HB-144", billDate: "2026-05-11", dueDate: "2026-05-18", billTotal: 3_100,  paidAmount: 0,     balance: 3_100,  status: "current" },

  // ── c7 Mahendra Highway Store (outstanding 2,400) ─────────────────────────
  { id: "ob-c7-1", saleId: "sl-c7-1", customerId: "c7", billNo: "HB-139", billDate: "2026-05-06", dueDate: "2026-05-13", billTotal: 2_400,  paidAmount: 0,     balance: 2_400,  status: "overdue" },

  // ── c8 Narayanganj Sweet (outstanding 1,800) ──────────────────────────────
  { id: "ob-c8-1", saleId: "sl-c8-1", customerId: "c8", billNo: "HB-145", billDate: "2026-05-13", dueDate: "2026-05-20", billTotal: 1_800,  paidAmount: 0,     balance: 1_800,  status: "current" },
];

// ─── Recent payments ──────────────────────────────────────────────────────────
export type Payment = { id: string; date: string; customerId: string; customerName: string; amount: number; mode: string; reference: string; billNo?: string };

export const PAYMENTS: Payment[] = [
  { id: "pmt1", date: "2026-05-14", customerId: "c1", customerName: "Ghantaghar Stores",    amount: 5_000, mode: "Cash",           reference: "",          billNo: "HB-128" },
  { id: "pmt2", date: "2026-05-13", customerId: "c2", customerName: "Adarsha Cold Store",   amount: 3_000, mode: "eSewa",          reference: "TXN-23891", billNo: "HB-138" },
  { id: "pmt3", date: "2026-05-12", customerId: "c4", customerName: "Kalaiya Grocery",      amount: 2_500, mode: "Mobile banking", reference: "MB-4421",   billNo: "HB-137" },
  { id: "pmt4", date: "2026-05-10", customerId: "c3", customerName: "Birgunj Bazar Sweets", amount: 8_000, mode: "Cheque",         reference: "CH-1012",   billNo: "HB-133" },
];

// ─── Expenses ─────────────────────────────────────────────────────────────────
export const EXPENSE_CATEGORIES = [
  "Vehicle fuel", "Vehicle maintenance", "Staff salary", "Cold storage rent",
  "Electricity", "Packaging material", "Office supplies", "Miscellaneous",
];

export const EXPENSES = [
  { id: "ex1", date: "2026-05-13", category: "Vehicle fuel",   amount: 3_500, notes: "2 vehicles" },
  { id: "ex2", date: "2026-05-12", category: "Staff salary",   amount: 22_000, notes: "April salary" },
  { id: "ex3", date: "2026-05-10", category: "Cold storage rent", amount: 15_000, notes: "Monthly" },
];

// ─── Daily cash (today) ───────────────────────────────────────────────────────
export const DAILY_CASH = {
  date: "2026-05-14",
  openingBalance:  8_200,
  cashSales:      12_400,
  cashReceipts:    5_000,
  cashPaidOut:     3_500,
  physicalCount:  22_100,   // filled in by user
  variance:           0,    // physicalCount - computed
};

// ─── Payment modes ────────────────────────────────────────────────────────────
export const PAYMENT_MODES = ["Cash", "eSewa", "Khalti", "FonePay", "Mobile banking", "Cheque"];

// ─── Capital & Assets (from day 1) ────────────────────────────────────────────
export type CapitalEntry = {
  id: string;
  date: string;
  category: "fixed_asset" | "inventory" | "deposit" | "owner_capital" | "loan";
  name: string;
  amount: number;
  currentValue: number; // depreciated / current market value
  notes: string;
};

export const CAPITAL_ENTRIES: CapitalEntry[] = [
  { id: "ca1", date: "2024-01-15", category: "owner_capital", name: "Owner initial capital",        amount: 500_000, currentValue: 500_000, notes: "Opening capital injected by owner" },
  { id: "ca2", date: "2024-01-20", category: "fixed_asset",   name: "Deep freezer (Haier 500L)",    amount: 85_000,  currentValue: 68_000,  notes: "2 units × NPR 42,500 — main depot" },
  { id: "ca3", date: "2024-01-20", category: "fixed_asset",   name: "Deep freezer (Haier 300L)",    amount: 55_000,  currentValue: 44_000,  notes: "1 unit — secondary storage" },
  { id: "ca4", date: "2024-02-01", category: "fixed_asset",   name: "Delivery vehicle (Mahindra)",  amount: 420_000, currentValue: 336_000, notes: "3-wheeler tempo for delivery" },
  { id: "ca5", date: "2024-02-01", category: "fixed_asset",   name: "Godown setup / renovation",    amount: 75_000,  currentValue: 60_000,  notes: "Flooring, shelving, electrical" },
  { id: "ca6", date: "2024-02-15", category: "deposit",       name: "Havmor security deposit",      amount: 72_000,  currentValue: 72_000,  notes: "Refundable freezer deposit to Havmor HO" },
  { id: "ca7", date: "2024-03-01", category: "inventory",     name: "Initial inventory purchase",   amount: 200_000, currentValue: 200_000, notes: "First stock order from Havmor" },
  { id: "ca8", date: "2025-06-01", category: "fixed_asset",   name: "Generator (5 KVA)",            amount: 65_000,  currentValue: 52_000,  notes: "Backup power for cold storage" },
  { id: "ca9", date: "2025-09-01", category: "loan",          name: "Bank loan (NMB)",              amount: 300_000, currentValue: 300_000, notes: "Business expansion loan — 12% p.a." },
];

export const CAPITAL_CATEGORIES = [
  { value: "fixed_asset",   label: "Fixed asset",     hint: "Freezer, vehicle, generator, godown" },
  { value: "inventory",     label: "Inventory",       hint: "Initial or bulk stock purchase" },
  { value: "deposit",       label: "Security deposit",hint: "Havmor deposit, godown advance etc." },
  { value: "owner_capital", label: "Owner capital",   hint: "Personal money put into business" },
  { value: "loan",          label: "Loan / borrowing",hint: "Bank loan, family loan etc." },
];

// ─── Company overview (computed from all data) ────────────────────────────────
const totalCapitalInvested = CAPITAL_ENTRIES
  .filter((c) => c.category !== "loan")
  .reduce((s, c) => s + c.amount, 0);

const totalLoans = CAPITAL_ENTRIES
  .filter((c) => c.category === "loan")
  .reduce((s, c) => s + c.amount, 0);

const fixedAssetsBook = CAPITAL_ENTRIES
  .filter((c) => c.category === "fixed_asset")
  .reduce((s, c) => s + c.currentValue, 0);

const deposits = CAPITAL_ENTRIES
  .filter((c) => c.category === "deposit")
  .reduce((s, c) => s + c.currentValue, 0);

// Stock current value = on-hand qty × cost price
const stockValue = 0; // computed in component from PRODUCTS

export const COMPANY_OVERVIEW = {
  businessStartDate:   "2024-01-15",
  totalCapitalInvested,           // what owner put in (excl. loans)
  totalLoans,                     // borrowed money
  fixedAssetsBookValue: fixedAssetsBook,
  deposits,
  stockValueAtCost:    287_640,   // Σ(product.on_hand × product.costPrice) — demo value
  cashInHand:            8_200,   // from daily cash
  bankBalance:          45_000,   // not tracked yet, manual entry
  customerOutstanding:  60_215,   // from CUSTOMERS total outstanding
  supplierPayable:     442_000,   // from SUPPLIERS total outstanding
  loanOutstanding:     285_000,   // remaining loan balance
  // P&L from inception
  lifetimeSales:     2_847_500,
  lifetimePurchases: 1_923_400,
  lifetimeExpenses:    387_200,
  lifetimeReturns:      42_800,
};

// ─── Damage reasons ───────────────────────────────────────────────────────────
export const DAMAGE_REASONS = ["Melted", "Broken packaging", "Expired", "Cold chain failure", "Transport damage", "Other"];

// ─────────────────────────────────────────────────────────────────────────────
// All mutations (commitSale, commitPayment, commitReturn, commitPurchase,
// getNextBillNo, resetToSeed) now live in src/store/appStore.ts
// which persists data to localStorage and provides reactive React hooks.
// ─────────────────────────────────────────────────────────────────────────────
