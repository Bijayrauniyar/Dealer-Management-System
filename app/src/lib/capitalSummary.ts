import type { CapitalEntry } from "@/domain/types";

export function summarizeCapital(entries: CapitalEntry[]) {
  return {
    totalCapitalInvested: entries
      .filter((e) => e.category !== "loan")
      .reduce((s, e) => s + e.amount, 0),
    totalLoans: entries
      .filter((e) => e.category === "loan")
      .reduce((s, e) => s + e.amount, 0),
    fixedAssetsBookValue: entries
      .filter((e) => e.category === "fixed_asset")
      .reduce((s, e) => s + e.currentValue, 0),
    deposits: entries
      .filter((e) => e.category === "deposit")
      .reduce((s, e) => s + e.currentValue, 0),
    loanOutstanding: entries
      .filter((e) => e.category === "loan")
      .reduce((s, e) => s + e.currentValue, 0),
    ownerCapitalInvested: entries
      .filter((e) => e.category === "owner_capital")
      .reduce((s, e) => s + e.amount, 0),
  };
}
