import type { BusinessSettings, SaleLine } from "@/domain/types";
import { isFocSaleLine } from "@/lib/billFoc";
import { billLineRateColumnValue } from "@/lib/saleLineMath";
import { nprNum } from "@/lib/utils";

export type SalesBillPriceMode = "mrp" | "selling_price";
export type PurchaseBillPriceMode = "rate_excl" | "rate_incl";

export function parseSalesBillPriceMode(raw: unknown): SalesBillPriceMode {
  return raw === "selling_price" ? "selling_price" : "mrp";
}

export function parsePurchaseBillPriceMode(raw: unknown): PurchaseBillPriceMode {
  return raw === "rate_incl" ? "rate_incl" : "rate_excl";
}

/** Bill table column — always **Rate** (standard invoice layout). */
export function salesBillUnitPriceHeader(
  _mode?: Pick<BusinessSettings, "salesBillPriceMode">,
): string {
  return "Rate";
}

/** Short title for bill/PDF table. */
export function salesBillUnitPriceHeaderPrint(
  _mode?: Pick<BusinessSettings, "salesBillPriceMode">,
): string {
  return "Rate";
}

/**
 * Rate column value on printed bill.
 * Settings picks the number: label MRP (Disc% when set) or catalog sell price.
 * Invariant: Rate × Qty (× (1−Disc%) for MRP billing + disc) = Amt.
 */
export function billLineUnitPriceDisplay(line: SaleLine, mode: SalesBillPriceMode): string {
  if (isFocSaleLine(line)) return "FOC";
  const unit = billLineRateColumnValue(line, mode);
  return unit > 0 ? nprNum(unit) : "—";
}

export function purchaseBillRateHeader(
  mode: Pick<BusinessSettings, "purchaseBillPriceMode">,
  vatPct: number,
): string {
  if (mode.purchaseBillPriceMode === "rate_incl" && vatPct > 0) {
    return "Rate incl VAT";
  }
  return "Rate excl";
}

export function hasSalesBillQrImage(
  business: Pick<BusinessSettings, "salesBillQrObjectPath" | "salesBillQrImageUrl">,
): boolean {
  return Boolean(
    business.salesBillQrObjectPath?.trim() || business.salesBillQrImageUrl?.trim(),
  );
}

export function showsSalesBillPaymentQr(
  business: Pick<
    BusinessSettings,
    "salesBillQrEnabled" | "salesBillQrObjectPath" | "salesBillQrImageUrl"
  >,
  balance: number,
): boolean {
  if (!business.salesBillQrEnabled) return false;
  if (balance <= 0) return false;
  return hasSalesBillQrImage(business);
}
