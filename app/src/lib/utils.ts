import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merges Tailwind classes safely — use everywhere instead of raw string concat. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const nprAmountFormat = { minimumFractionDigits: 0, maximumFractionDigits: 2 };

/** Format a number as NPR currency (up to 2 decimal places / paisa). */
export const npr = (value: number | null | undefined) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "NPR",
    ...nprAmountFormat,
  }).format(value ?? 0);

/** Format just the number part (no currency symbol). */
export const nprNum = (value: number | null | undefined) =>
  new Intl.NumberFormat("en-IN", nprAmountFormat).format(value ?? 0);

/** ISO date string → readable date e.g. "14 May 2026". */
export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

/** Returns "YYYY-MM-DD" for today or a given date. */
export const toDateInput = (d = new Date()) => d.toISOString().slice(0, 10);

// ── Bikram Sambat (Miti) conversion ──────────────────────────────────────────
// AD start date of BS Baisakh 1 for key years.
// Source: Nepal calendar. Use 'bikram-sambat' npm package in production.
const BS_YEAR_START: Record<number, string> = {
  2081: "2024-04-13",
  2082: "2025-04-13",
  2083: "2026-04-14",
  2084: "2027-04-14",
  2085: "2028-04-12",
};
// Typical BS month lengths (days) — may vary 1 day per year; good enough for display.
const BS_MONTH_LENGTHS = [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30];

/** Convert ISO date string to Miti string e.g. "23/01/2083". */
export function toMiti(isoDate: string): string {
  const target = new Date(isoDate);
  let bsYear = 0;
  let yearStart = new Date(0);
  for (const [y, s] of Object.entries(BS_YEAR_START)) {
    const sd = new Date(s);
    if (target >= sd) { bsYear = Number(y); yearStart = sd; }
  }
  if (!bsYear) return isoDate;
  let rem = Math.floor((target.getTime() - yearStart.getTime()) / 86_400_000);
  let bsMonth = 1;
  for (let i = 0; i < 12; i++) {
    if (rem < BS_MONTH_LENGTHS[i]) { bsMonth = i + 1; break; }
    rem -= BS_MONTH_LENGTHS[i];
  }
  return `${String(rem + 1).padStart(2, "0")}/${String(bsMonth).padStart(2, "0")}/${bsYear}`;
}

/** English date + Bikram Sambat in brackets, e.g. "31 May 2026 (17/02/2083)". */
export function fmtDateDual(iso: string): string {
  const bs = toMiti(iso);
  if (bs === iso) return fmtDate(iso);
  return `${fmtDate(iso)} (${bs})`;
}

// ── Amount in Words (NPR) ─────────────────────────────────────────────────────
const _ONES = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine",
  "Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
const _TENS = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];

function _toW(n: number): string {
  if (n === 0) return "";
  if (n < 20)     return _ONES[n];
  if (n < 100)    return _TENS[Math.floor(n / 10)] + (n % 10 ? " " + _ONES[n % 10] : "");
  if (n < 1_000)  return _ONES[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + _toW(n % 100) : "");
  if (n < 1_00_000)  return _toW(Math.floor(n / 1_000))   + " Thousand" + (n % 1_000   ? " " + _toW(n % 1_000)   : "");
  if (n < 1_00_00_000) return _toW(Math.floor(n / 1_00_000)) + " Lakh"   + (n % 1_00_000  ? " " + _toW(n % 1_00_000)  : "");
  return _toW(Math.floor(n / 1_00_00_000)) + " Crore" + (n % 1_00_00_000 ? " " + _toW(n % 1_00_00_000) : "");
}

/** "Rs. Thirteen Thousand Four Hundred Forty-One and Twenty-One Paisa only" */
export function amountInWords(amount: number): string {
  const rupees = Math.floor(amount);
  const paisa  = Math.round((amount - rupees) * 100);
  const rWords = rupees === 0 ? "Zero" : _toW(rupees);
  let out = `Rs. ${rWords} Rupees`;
  if (paisa > 0) out += ` and ${_toW(paisa)} Paisa`;
  return out + " Only";
}
