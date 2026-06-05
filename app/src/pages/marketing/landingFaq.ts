/** FAQ copy — BikriKhata only (B2B billing). Not IRD e-billing. */

import {
  LAUNCH_TRIAL_DAYS,
  LAUNCH_PRICING_TAGLINE,
  formatLaunchPriceNpr,
} from "@/config/launchPricing";

const launchPrice = formatLaunchPriceNpr();

export type LandingFaqItem = {
  question: string;
  /** Lead paragraph (optional if bullets only). */
  answer?: string;
  bullets?: string[];
};

export const LANDING_FAQ: LandingFaqItem[] = [
  {
    question: "What is BikriKhata?",
    answer:
      "BikriKhata is B2B billing and stock software for Nepal businesses that buy and sell in bulk on credit. You issue sales and purchase invoices, track godown stock, follow customer balances, and download registers when audit or accounts need figures — in one workspace instead of notebooks and spreadsheets.",
  },
  {
    question: "Who is BikriKhata for?",
    answer:
      "Small and mid-size B2B businesses — distributors, dealers, stockists, and godown-led traders that purchase, manage stock, bill customers, and track credit. We help you set up categories and units to match how your business trades.",
  },
  {
    question: "Is this B2B software or a retail POS?",
    answer:
      "B2B. BikriKhata is for bulk buying and selling, godown stock, customer credit, and tax invoices — not a kirana-style counter POS.",
  },
  {
    question: "What can I do with BikriKhata today?",
    answer: "Included in your subscription now:",
    bullets: [
      "Sales and purchase invoices with VAT, print, PDF, and share",
      "Products with your categories and units, purchase and sell prices",
      "Godown stock — opening, sales, purchases, returns, damage, adjustments",
      "Customer credit — balance, overdue, aging, payments against bills",
      "Suppliers — invoices and supplier payments",
      "Returns, damage, expenses, daily cash, and capital entries",
      "Export registers and backup ZIP from Settings for audit and accounts",
    ],
  },
  {
    question: "Can salesmen take orders on the phone?",
    answer:
      "Yes — salesman on bills, field orders, and sales by salesman are part of BikriKhata. Contact us if you want help setting up salesman logins on phone.",
  },
  {
    question: "How does stock and customer credit work?",
    answer:
      "Every saved sales invoice reduces stock and updates the customer balance. When the customer pays, record a payment and allocate it to open bills. Home shows who is overdue before the next dispatch.",
  },
  {
    question: "Can I customize tax invoices and bill layout?",
    answer:
      "Yes. In Settings you set your business name, address, PAN, and VAT details on bills. Choose tax or sales invoice layout. Customer tax IDs can print on B2B invoices where required.",
  },
  {
    question: "Do I need a computer?",
    answer:
      "No. Use BikriKhata on your phone for daily billing and stock. Sign in on a laptop with the same account when you want a bigger screen.",
  },
  {
    question: "How do I get data for audit or accounts?",
    answer:
      "Open Export under Settings. Pick a date range and download sales, purchase, stock, outstanding, and VAT summary registers as CSV, or a backup ZIP with the main files. BikriKhata does not file with IRD for you.",
  },
  {
    question: "Does BikriKhata file taxes with IRD?",
    answer:
      "No. You print or share invoices from BikriKhata and use exports for your books and IRD filing. BikriKhata is billing and stock software, not government e-billing submission.",
  },
  {
    question: "How is pricing calculated?",
    answer: `One annual subscription per company (${launchPrice} at launch) — not per salesman seat. ${LAUNCH_PRICING_TAGLINE}`,
  },
  {
    question: "Is my business data secure?",
    answer:
      "Your data is stored in secure cloud infrastructure with access limited to your company account. Export backups regularly for your own records. Use a strong password and only share login with people you trust.",
  },
  {
    question: "Can I sign up on the website by myself?",
    answer:
      "Yes — create an account at bikrikhata.com/register. Your workspace stays pending until we activate it; your 7-day free trial starts on activation (call, WhatsApp, or the contact form). Log in at bikrikhata.com/login after we confirm.",
  },
  {
    question: "Is there a free trial?",
    answer: `Yes. ${LAUNCH_PRICING_TAGLINE} After we onboard your company from the contact form, you get a ${LAUNCH_TRIAL_DAYS}-day trial. When it ends, a paid annual subscription (${launchPrice} per company) is required to keep using the app.`,
  },
  {
    question: "How do I get started?",
    answer:
      "Open Pricing and submit the contact form for a free trial, or book a demo. We create your company login and send details. Then add products, customers, opening stock, and issue your first sales invoice.",
  },
];
