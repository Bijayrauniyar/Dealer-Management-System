import {
  LAUNCH_PRICE_NPR_PER_YEAR,
  LAUNCH_TRIAL_DAYS,
  formatLaunchPriceNpr,
} from "@/config/launchPricing";

const launchPriceLabel = formatLaunchPriceNpr();

export const PRIVACY_SECTIONS: { title: string; body: string }[] = [
  {
    title: "Who we are",
    body: "BikriKhata provides billing and stock software for wholesalers and dealers in Nepal. This policy explains how we handle your information when you use our website and app.",
  },
  {
    title: "What we collect",
    body: "Account and contact details you provide on our website contact form or during onboarding, business records you enter in the app (products, customers, suppliers, invoices, payments, stock), and technical data needed to operate the service securely.",
  },
  {
    title: "Where data is stored",
    body: "Data is stored in secure cloud infrastructure. Access is limited to your company and users you authorize. We do not sell your business data.",
  },
  {
    title: "Your responsibilities",
    body: "You are responsible for the accuracy of invoices and tax information you issue. Customer and supplier records should comply with applicable law.",
  },
  {
    title: "Contact",
    body: "For privacy questions, use the Contact section on bikrikhata.com or the support email and phone listed there.",
  },
];

export const TERMS_SECTIONS: { title: string; body: string }[] = [
  {
    title: "Service",
    body: "BikriKhata is software for managing sales, purchases, godown stock, customer credit, and related business records for one company account.",
  },
  {
    title: "Accounts",
    body: "Company accounts are created by BikriKhata after you submit our website contact form (free trial or access request) or as otherwise agreed with us. Provide accurate business and contact details. You are responsible for your password and all activity under your account.",
  },
  {
    title: "Trial and subscription",
    body: `Each company may receive a ${LAUNCH_TRIAL_DAYS}-day free trial after onboarding. When the trial ends, a paid annual subscription is required to continue using the app for that company. Current pricing is ${launchPriceLabel} per year (shown on the Pricing section of bikrikhata.com). Fees may change; the price on our website at the time you subscribe applies.`,
  },
  {
    title: "Acceptable use",
    body: "Do not misuse the service or use it for unlawful purposes. We may suspend accounts that breach these terms.",
  },
  {
    title: "Data and backups",
    body: "Export your data regularly from Settings when you need copies for your records. You remain responsible for business records and regulatory compliance.",
  },
  {
    title: "Disclaimer",
    body: "The service is provided as available. Confirm tax and invoice requirements with your accountant or adviser. BikriKhata does not file taxes with IRD on your behalf.",
  },
  {
    title: "Changes",
    body: "We may update these terms. Continued use means you accept the updated terms.",
  },
];

/** For tests/docs — price referenced in terms copy. */
export const TERMS_LAUNCH_PRICE_NPR = LAUNCH_PRICE_NPR_PER_YEAR;
