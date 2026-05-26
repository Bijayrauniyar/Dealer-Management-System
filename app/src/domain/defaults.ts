import type { BusinessSettings } from "./types";

export type DashboardPeriodTotals = {
  totalPurchase: number;
  totalExpenses: number;
  returnsCredit: number;
  damageQty: number;
};

export function emptyDashboardPeriodTotals(): DashboardPeriodTotals {
  return {
    totalPurchase: 0,
    totalExpenses: 0,
    returnsCredit: 0,
    damageQty: 0,
  };
}

/** Defaults for mapTenantSettingsRow fallbacks and missing rows. */
export const DEFAULT_BUSINESS_SETTINGS: BusinessSettings = {
  name: "",
  legalName: "",
  region: "",
  currency: "NPR",
  invoicePrefix: "INV",
  phone: "",
  mobile: "",
  email: "",
  addressLine1: "",
  addressLine2: "",
  district: "",
  province: "",
  country: "Nepal",
  panNumber: "",
  vatRegistered: false,
  vatNumber: "",
  defaultVatPct: 13,
  billFooter: "",
  overdueDays: 7,
  dueSoonDays: 3,
  defaultMarkupPct: 15,
  defaultMinQty: 20,
  defaultMinPackQty: 2,
};
