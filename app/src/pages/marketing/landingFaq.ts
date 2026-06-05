/** FAQ copy — BikriKhata only (wholesale billing). Not IRD e-billing. */

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
      "BikriKhata is billing and stock software for Nepal distributors, dealers, and stockists. You issue sales and purchase invoices, track stock in the godown, follow customer credit, and export month-end registers for your accountant — in one place instead of notebooks and spreadsheets.",
  },
  {
    question: "Who is BikriKhata for?",
    answer:
      "Businesses that buy and sell in bulk, often on credit, from a godown or counter — FMCG distributors, ice-cream dealers, stockists, and dealers who need accurate stock and clear balances per shop.",
  },
  {
    question: "What can I do with BikriKhata?",
    answer: "Core modules included in your subscription:",
    bullets: [
      "Sales invoices — create & edit, VAT, schemes, print, PDF, and share",
      "Purchase invoices — supplier bill reference, VAT, stock in",
      "Stock on hand — opening, sales, purchases, returns, damage, adjustments",
      "Customers — credit balance, overdue, aging, payments against bills",
      "Suppliers — invoices and supplier payments",
      "Returns, damage, expenses, daily cash, and capital entries",
      "Home dashboard, reports, and Settings export for your CA",
    ],
  },
  {
    question: "How does stock and customer credit work?",
    answer:
      "Every saved sales invoice reduces stock and updates the customer balance. When the customer pays, record a payment and allocate it to open bills. Example: you bill 15 shops in a week — each bill lowers on-hand quantity and adds to that shop’s due amount. Home shows who is overdue before the next dispatch.",
  },
  {
    question: "Can I customize tax invoices and bill layout?",
    answer:
      "Yes. In Settings you set your business name, address, PAN, and VAT details on bills. Choose tax or sales invoice layout. Customer PAN and VAT can print on B2B invoices where required.",
  },
  {
    question: "Can I use BikriKhata on my phone and computer?",
    answer:
      "Yes. Log in at bikrikhata.com/login on a phone browser or laptop — same company, same data. Many teams bill on the phone at the counter and review stock or reports on a larger screen at the office.",
  },
  {
    question: "How does my accountant get reports?",
    answer:
      "In the app, open Export (under Settings). Choose From/To dates, then download sales register, purchase register, stock snapshot, customer outstanding, and VAT period summary as CSV — or one backup ZIP with the main files bundled. Your accountant opens them in Excel for books and VAT prep. BikriKhata does not file with IRD for you.",
  },
  {
    question: "Does BikriKhata file taxes with IRD?",
    answer:
      "No. You print or share invoices from BikriKhata and send the export files to your accountant for IRD filing. BikriKhata is wholesale billing and stock software, not government e-billing submission.",
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
    answer: `Yes. ${LAUNCH_PRICING_TAGLINE} After we onboard your company from the contact form, you get a ${LAUNCH_TRIAL_DAYS}-day trial. When it ends, a paid annual subscription (${launchPrice} per company, on our Pricing page) is required to keep using the app. Contact us before the trial ends if you need help.`,
  },
  {
    question: "How do I get started?",
    answer:
      "On bikrikhata.com, open Pricing and submit the contact form for a free trial (or use Contact with Book a demo). We create your company login and send details. Then add products, customers, opening stock, and issue your first sales invoice.",
  },
];
