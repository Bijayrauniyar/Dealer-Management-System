import { LAUNCH_TRIAL_DAYS } from "@/config/launchPricing";
import { PRODUCT_DISPLAY_NAME } from "@/config/productBrand";

export type TenantPlan = "trial" | "monthly" | "annual" | null;

export type TenantLicenseSnapshot = {
  status: "pending" | "active" | "suspended" | "rejected" | null;
  plan: TenantPlan;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
};

/** Show banner, notification, and daily reminder when this many days or fewer remain. */
export const LICENSE_RENEWAL_WARN_DAYS = 30;

/** Active tenant with a valid trial or paid period. */
export function isTenantLicenseValid(
  profile: Pick<TenantLicenseSnapshot, "status" | "trialEndsAt" | "subscriptionEndsAt">,
): boolean {
  if (profile.status !== "active") return false;
  const now = Date.now();
  if (profile.subscriptionEndsAt) {
    if (new Date(profile.subscriptionEndsAt).getTime() > now) return true;
  }
  if (profile.trialEndsAt) {
    if (new Date(profile.trialEndsAt).getTime() > now) return true;
  }
  return false;
}

export function daysUntilEnd(endIso: string | null): number | null {
  if (!endIso) return null;
  const ms = new Date(endIso).getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

/** End date for the active plan (trial vs paid column). */
export function tenantLicenseEndAt(
  profile: Pick<TenantLicenseSnapshot, "plan" | "trialEndsAt" | "subscriptionEndsAt">,
): string | null {
  const { plan, trialEndsAt, subscriptionEndsAt } = profile;
  if (plan === "monthly" || plan === "annual") return subscriptionEndsAt;
  if (plan === "trial") return trialEndsAt;
  return subscriptionEndsAt ?? trialEndsAt;
}

export function tenantLicenseDaysRemaining(
  profile: Pick<TenantLicenseSnapshot, "plan" | "trialEndsAt" | "subscriptionEndsAt">,
): number | null {
  return daysUntilEnd(tenantLicenseEndAt(profile));
}

export function formatTenantPlanLabel(plan: TenantPlan): string {
  switch (plan) {
    case "trial":
      return "Free trial";
    case "monthly":
      return "Monthly subscription";
    case "annual":
      return "Annual subscription";
    default:
      return "Subscription";
  }
}

export function formatLicenseEndDate(endIso: string | null): string | null {
  if (!endIso) return null;
  try {
    return new Date(endIso).toLocaleDateString(undefined, { dateStyle: "medium" });
  } catch {
    return null;
  }
}

export function shouldWarnLicenseRenewal(days: number | null): boolean {
  return days !== null && days > 0 && days <= LICENSE_RENEWAL_WARN_DAYS;
}

export function licenseRenewalUrgent(days: number | null): boolean {
  return days !== null && days <= 3;
}

export function licenseRenewalWhatsappPrefill(plan: TenantPlan): string {
  const kind = plan === "trial" ? "trial" : "subscription";
  return `Hi, my ${PRODUCT_DISPLAY_NAME} ${kind} is ending soon. I would like to renew.`;
}

export function trialDaysRemaining(trialEndsAt: string | null): number | null {
  return daysUntilEnd(trialEndsAt);
}

export function formatTrialEndsLabel(trialEndsAt: string | null): string | null {
  const days = trialDaysRemaining(trialEndsAt);
  if (days === null) return null;
  if (days === 0) return "Trial ends today";
  if (days === 1) return "1 day left in trial";
  return `${days} days left in trial`;
}

export function formatPaidSubscriptionDaysLabel(plan: TenantPlan, days: number | null): string | null {
  if (days === null || plan === "trial" || plan === null) return null;
  const noun = plan === "monthly" ? "monthly subscription" : "annual subscription";
  if (days === 0) return `Your ${noun} ends today`;
  if (days === 1) return `1 day left on your ${noun}`;
  return `${days} days left on your ${noun}`;
}

export const DEFAULT_TRIAL_DAYS = LAUNCH_TRIAL_DAYS;

/** Copy for /license-expired — short, one-screen gate. */
export function licenseExpiredCopy(
  plan: TenantPlan,
  trialEndsAt: string | null,
  subscriptionEndsAt: string | null,
): { statusLabel: string; detail: string } {
  const endedOn = (iso: string | null) => {
    if (!iso) return null;
    try {
      return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });
    } catch {
      return null;
    }
  };

  if (plan === "trial") {
    const d = endedOn(trialEndsAt);
    return {
      statusLabel: "Trial ended",
      detail: d
        ? `Your free trial ended on ${d}.`
        : "Your free trial period has ended.",
    };
  }
  if (plan === "monthly") {
    const d = endedOn(subscriptionEndsAt);
    return {
      statusLabel: "Subscription ended",
      detail: d ? `Your monthly plan ended on ${d}.` : "Your monthly subscription has ended.",
    };
  }
  if (plan === "annual") {
    const d = endedOn(subscriptionEndsAt);
    return {
      statusLabel: "Subscription ended",
      detail: d ? `Your annual plan ended on ${d}.` : "Your annual subscription has ended.",
    };
  }
  return {
    statusLabel: "Access inactive",
    detail: "Your BikriKhata plan is no longer active.",
  };
}
