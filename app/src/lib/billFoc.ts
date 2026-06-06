import type { SaleLine } from "@/domain/types";
import { billLineAmount, saleLineDisplayMrp } from "@/lib/saleLineMath";

/** Strip old UI suffix from product name when re-saving or reprinting. */
export function stripFocSuffixFromName(name: string): string {
  return name.replace(/\s*\(free\s*[—-]\s*[^)]+\)\s*$/i, "").trim();
}

/** Scheme / FOC line: zero rate and zero line amount (second row on bill). */
export function isFocSaleLine(line: Pick<SaleLine, "rate" | "qty" | "amount" | "isFoc">): boolean {
  if (line.isFoc) return true;
  const qty = Number(line.qty) || 0;
  const rate = Number(line.rate) || 0;
  if (qty <= 0) return false;
  if (rate !== 0) return false;
  const amt = line.amount != null ? Number(line.amount) : billLineAmount(line);
  return amt === 0;
}

export function billLineParticulars(line: SaleLine): { title: string; subtitle?: string } {
  const title = stripFocSuffixFromName(line.productName);
  if (!isFocSaleLine(line)) {
    return { title };
  }
  const note = line.focNote?.trim() || "FOC";
  return { title, subtitle: note };
}

/** MRP column on printed bill. */
export function billLineMrpDisplay(line: SaleLine): string {
  if (isFocSaleLine(line)) {
    const mrp = saleLineDisplayMrp(line);
    return mrp > 0 ? String(mrp) : "FOC";
  }
  const mrp = saleLineDisplayMrp(line);
  return mrp > 0 ? String(mrp) : "—";
}

/** Disc% column — show FOC instead of percent for free scheme lines. */
export function billLineDiscDisplay(
  line: SaleLine,
  lineDiscPct: (l: SaleLine) => number,
): string {
  if (isFocSaleLine(line)) return "FOC";
  const pct = lineDiscPct(line);
  return pct > 0 ? `${pct}%` : "—";
}
