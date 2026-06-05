import type { LucideIcon } from "lucide-react";
import { BarChart3, FileDown, Package, Receipt, UserRound, Users } from "lucide-react";
import { LAUNCH_TRIAL_CTA_HEADLINE } from "@/config/launchPricing";

export const LANDING_NAV = [
  { label: "Features", href: "/#product" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Pricing", href: "/#pricing" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/#contact" },
] as const;

export const LANDING_PAIN_SECTION = {
  eyebrow: "Why businesses switch",
  title: "Three problems we hear every week",
} as const;

/** Pain cards (#why) — Nepali headline + English detail; link to product section. */
export const LANDING_PAIN_POINTS: {
  title: string;
  detail: string;
  href: string;
  icon: LucideIcon;
}[] = [
  {
    title: "गोदाम र हिसाब मिल्दैन",
    detail:
      "Your godown count stays in one place. Every sale, purchase, return, and damage updates the same stock automatically.",
    icon: Package,
    href: "#product",
  },
  {
    title: "कुन ग्राहकको कति बाँकी?",
    detail:
      "See every customer’s balance and overdue days in one list, so you know who to follow up before the next dispatch.",
    icon: Users,
    href: "#product",
  },
  {
    title: "बिल बन्यो, स्टक मिलेन",
    detail:
      "Issue PAN/VAT bills from the app. When you save a bill, stock, schemes, and returns stay matched without extra entry.",
    icon: Receipt,
    href: "#product",
  },
];

export const HOW_IT_WORKS_SECTION = {
  eyebrow: "How it works",
  title: "Get started in 4 easy steps",
  subtitle: "We set up your company login, you add products and customers, then bill and track stock from your phone.",
} as const;

export const HOW_IT_WORKS_STEPS: { step: string; title: string; detail: string }[] = [
  {
    step: "1",
    title: "Start your free week",
    detail: "Open Pricing and send the contact form — we set up your shop and send login details.",
  },
  {
    step: "2",
    title: "Set up shop",
    detail: "Add products, customers, suppliers, and opening godown stock.",
  },
  {
    step: "3",
    title: "Manage daily",
    detail: "Record sales, purchases, customer payments, returns, and damage.",
  },
  {
    step: "4",
    title: "Review & grow",
    detail: "Check overdue customers and download registers from Settings when you close the month or need figures for audit.",
  },
];

export type KeyFeatureRow = {
  id: string;
  title: string;
  detail: string;
  bullets: string[];
  imageSrc: string;
  alt: string;
  imageFit?: "cover" | "contain";
};

/** MeroDokan-style feature rows — screenshot + story + bullets. */
export const KEY_FEATURES_SECTION = {
  eyebrow: "Key features",
  title: "Inventory, billing, and credit in one place",
  subtitle: "Built for Nepal distributors and dealers — godown stock, PAN/VAT bills, and dealer udhar.",
  trustLine: "Bills, stock, and credit in one workspace — export CSV from Settings when you need a copy.",
} as const;

export const KEY_FEATURES: KeyFeatureRow[] = [
  {
    id: "sales",
    title: "Effortless sales and purchase tracking",
    detail:
      "Log every sale and supplier bill in seconds. Generate PAN/VAT tax invoices, track dealer orders, and keep supplier details in one place.",
    bullets: [
      "Quickly record sales and purchases",
      "Tax invoices — print, PDF, or share",
      "Manage customer and supplier details",
    ],
    imageSrc: "/marketing/mobile-bill.png",
    alt: "Sales tax bill with share print and PDF on mobile",
    imageFit: "contain",
  },
  {
    id: "stock",
    title: "Godown stock at your fingertips",
    detail:
      "Track on-hand qty in real time. See what is in the godown, what is low, and what changed after each sale, purchase, return, or damage entry.",
    bullets: [
      "Live stock updates after every movement",
      "Products with pack/PCS and pricing",
      "Returns, damage, and stock adjustments",
    ],
    imageSrc: "/marketing/mobile-inventory.png",
    alt: "Godown stock list on mobile",
  },
  {
    id: "credit",
    title: "Dealer credit and business reports",
    detail:
      "See who owes what before the next dispatch. Record payments against open bills and download registers from Settings when you need them.",
    bullets: [
      "Customer balance and overdue list",
      "Payments against open bills",
      "Export sales, purchase, and stock CSV",
    ],
    imageSrc: "/marketing/mobile-customers.png",
    alt: "Customer credit list on mobile",
  },
];

/** Why distributors pick BikriKhata over generic POS / notebooks. */
export const DISTRIBUTOR_OFFERS: { title: string; detail: string }[] = [
  {
    title: "Godown stock, not shelf-only",
    detail: "On-hand updates from purchases, sales, returns, and damage — one number for loading the van.",
  },
  {
    title: "Customer credit & aging",
    detail: "Per-dealer balance, overdue bills, and limits before you dispatch the next truckload.",
  },
  {
    title: "Pack / PCS & schemes",
    detail: "Box and piece pricing plus scheme discounts on lines — how FMCG and ice-cream distributors sell.",
  },
  {
    title: "Purchase & supplier pay",
    detail: "Supplier bills with VAT, payments against purchases, and purchase cost on stock.",
  },
  {
    title: "B2B tax invoices",
    detail: "PAN/VAT on bills, printable tax invoice layout, and share with the buyer.",
  },
  {
    title: "Works on phone & laptop",
    detail: "Same login in the browser — bill at the counter, review stock or reports on a bigger screen.",
  },
];

export type EssentialScreen = {
  id: string;
  /** Short title under the phone (2–4 words). */
  label: string;
  /** One line — what the screenshot shows happening in the app. */
  caption: string;
  imageSrc: string;
  alt: string;
  imageFit?: "cover" | "contain";
};

/** Section copy for screenshot row (English). Hero above shows finished tax bill. */
export const ESSENTIAL_SCREENS_SECTION = {
  eyebrow: "See the app",
  title: "Billing, stock, purchase, and dealer credit",
  subtitle:
    "Four everyday screens — create the bill, check godown, buy from supplier, chase udhar. Finished tax invoice is in the hero above.",
} as const;

/**
 * Four combined workflows (see docs/MARKETING_SCREENSHOTS_PLAN.md).
 * Hero = printable tax bill; this row = live screens for each module.
 */
export const ESSENTIAL_SCREENS: EssentialScreen[] = [
  {
    id: "billing",
    label: "Sales billing",
    caption: "Create a sales invoice — pick customer, add lines, VAT, discount, then save.",
    imageSrc: "/marketing/mobile-sales-new.png",
    alt: "New sales invoice on mobile",
  },
  {
    id: "stock",
    label: "Godown stock",
    caption: "On-hand qty by SKU — updates after every sale, purchase, return, and damage.",
    imageSrc: "/marketing/mobile-inventory.png",
    alt: "Stock on hand list on mobile",
  },
  {
    id: "purchase",
    label: "Purchase & supplier",
    caption: "Supplier bill with VAT — stock in and balance due on the same purchase.",
    imageSrc: "/marketing/mobile-purchase.png",
    alt: "Purchase invoice with VAT on mobile",
    imageFit: "contain",
  },
  {
    id: "credit",
    label: "Customers & credit",
    caption: "Each shop’s balance and overdue days — record payment against open bills.",
    imageSrc: "/marketing/mobile-customers.png",
    alt: "Customer list with credit balance on mobile",
  },
];

export type FeaturePillar = {
  icon: LucideIcon;
  id: string;
  /** Outcome headline — benefit, not a module name. */
  name: string;
  /** One-sentence outcome under the headline. */
  detail: string;
  /** Proof points — shown as bullets on Features; full list on Pricing. */
  highlights: string[];
};

/** Features section header (#product) — B2B positioning once; price on #pricing. */
export const FEATURE_SECTION = {
  eyebrow: "Features",
  title: "What BikriKhata does for your business",
  subtitle:
    "Purchase, stock, billing, and customer credit in one place. Fits any business that buys stock, generates bills, gives credit, and works with salesmen — especially distributors and dealers.",
} as const;

/** Feature cards (#product) — not sequential steps; onboarding steps live under How it works. */
export const FEATURE_PILLARS: FeaturePillar[] = [
  {
    id: "invoices",
    icon: Receipt,
    name: "Issue tax invoices",
    detail:
      "Turn godown and counter sales into PAN/VAT bills with discounts and schemes — print, PDF, or share from your phone.",
    highlights: [
      "Tax and sales invoice layouts",
      "Line discounts, schemes, credit-limit warning",
      "Print, PDF, or share with the buyer",
    ],
  },
  {
    id: "stock",
    icon: Package,
    name: "Keep stock accurate",
    detail:
      "Purchases stock in; sales, returns, and damage stock out — one on-hand number per product after every movement.",
    highlights: [
      "Supplier bills with VAT and payments",
      "Categories and units you set per product",
      "Returns, damage, and adjustments",
    ],
  },
  {
    id: "credit",
    icon: Users,
    name: "Track customer credit",
    detail:
      "Per-customer balance, payments against open bills, and aging — see who is overdue before the next dispatch.",
    highlights: [
      "Customer ledger with tax IDs on file",
      "Allocate receipts to open bills",
      "Overdue list and aging buckets",
    ],
  },
  {
    id: "audit",
    icon: FileDown,
    name: "Help at audit & month-end",
    detail:
      "Download registers and backup when you need figures for audit, accounts, or month-end reconciliation.",
    highlights: [
      "Sales, purchase, and stock registers by date",
      "Outstanding and VAT summary exports",
      "Backup ZIP for your records",
    ],
  },
  {
    id: "salesman",
    icon: UserRound,
    name: "Salesman & field orders",
    detail:
      "For businesses with salesmen who take orders in the field. Owner sees who sold what and which bills were created.",
    highlights: [
      "Salesman on each sales invoice",
      "Sales orders before billing",
      "Sales by salesman and open orders",
      "Each salesman signs in on their phone",
    ],
  },
  {
    id: "analytics",
    icon: BarChart3,
    name: "Reports and analytics",
    detail:
      "See how the business is doing — today’s sales and collections, outstanding, and trends over a date range.",
    highlights: [
      "Home dashboard with today KPIs",
      "Company overview and outstanding bills",
      "Top products and period totals",
    ],
  },
];

/** Full plan checklist on pricing only — single source for “included now”. */
export const PLAN_INCLUDES: string[] = [
  "Sales invoices — create & edit, VAT & discount, schemes, credit-limit alert",
  "Purchase invoices — supplier bill no., VAT, create & edit, stock in",
  "Products & pricing — your categories, multiple units per product, purchase and sell prices",
  "Customers & suppliers — tax IDs on parties, credit limits, contact details",
  "Godown stock — live qty from opening, sales, purchases, returns & damage",
  "Stock adjustment — manual qty correction when enabled in Settings",
  "Customer credit — balance, overdue list, aging, payments to open bills",
  "Supplier payables — amount due and payments against purchase bills",
  "Returns & damage — updates customer credit and godown stock",
  "Schemes — buy-X-get-Y tracker linked to products",
  "Expenses & cash book — shop expenses, daily cash, capital entries",
  "Dashboard & analytics — today KPIs, outstanding bills, company overview, top products",
  "Salesman & field orders — salesman on bills, orders before billing, sales by salesman",
  "Bill output — print, PDF download, and Share on sales invoices",
  "Settings export — period registers, stock, outstanding, VAT summary, backup ZIP for audit & accounts",
  "Phone-first — same login on laptop; one company account",
];

export const LANDING_AUDIENCE = [
  "Distributors & dealers",
  "Stockists & wholesalers",
  "Godown + counter businesses",
  "B2B on credit",
];

export const INQUIRY_PURPOSES = [
  LAUNCH_TRIAL_CTA_HEADLINE,
  "Subscription renewal",
  "Request access",
  "Book a demo",
  "Pricing question",
  "Product question",
  "Support",
  "General message",
] as const;

export type InquiryPurpose = (typeof INQUIRY_PURPOSES)[number];
