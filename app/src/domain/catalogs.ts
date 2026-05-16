import type { CapitalEntry } from "./types";

/** Expense category suggestions (DB stores free-text category). */
export const EXPENSE_CATEGORIES = [
  "Vehicle fuel",
  "Vehicle maintenance",
  "Staff salary",
  "Cold storage rent",
  "Electricity",
  "Packaging material",
  "Office supplies",
  "Miscellaneous",
] as const;

export const PAYMENT_MODES = ["Cash", "eSewa", "Khalti", "FonePay", "Mobile banking", "Cheque"];

export const DAMAGE_REASONS = [
  "Melted",
  "Broken packaging",
  "Expired",
  "Cold chain failure",
  "Transport damage",
  "Other",
];

export const CAPITAL_CATEGORIES: {
  value: CapitalEntry["category"];
  label: string;
  hint: string;
}[] = [
  { value: "fixed_asset", label: "Fixed asset", hint: "Freezer, vehicle, generator, godown" },
  { value: "inventory", label: "Inventory", hint: "Initial or bulk stock purchase" },
  { value: "deposit", label: "Security deposit", hint: "Havmor deposit, godown advance etc." },
  { value: "owner_capital", label: "Owner capital", hint: "Personal money put into business" },
  { value: "loan", label: "Loan / borrowing", hint: "Bank loan, family loan etc." },
];
