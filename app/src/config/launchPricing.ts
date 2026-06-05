/**
 * Public launch pricing — single source for marketing, legal, FAQ, license gates.
 * Change `LAUNCH_PRICE_NPR_PER_YEAR` here only; UI uses formatLaunchPriceNpr() / helpers below.
 */
export const LAUNCH_PRICE_NPR_PER_YEAR = 2999;

/** New company trial length (marketing; enforcement: BACKLOG LIC-1). */
export const LAUNCH_TRIAL_DAYS = 7;

/** Contact form purpose + marketing headline for the free trial. */
export const LAUNCH_TRIAL_CTA_HEADLINE = "Start Your FREE 1-Week Trial Today";

export function formatLaunchPriceNpr(): string {
  return `NPR ${LAUNCH_PRICE_NPR_PER_YEAR.toLocaleString("en-NP")}`;
}

/** Subline on renew gates (license expired, etc.). */
export function launchAnnualPlanHint(): string {
  return `Annual plan ${formatLaunchPriceNpr()} per company · monthly on request`;
}

/** Marketing landing pricing section (works when signed in, including license expired). */
export const LAUNCH_PRICING_URL = "/#pricing";

export function formatLaunchTrialLabel(): string {
  return LAUNCH_TRIAL_CTA_HEADLINE;
}

/** Subtitle under annual price on landing pricing block. */
export const LAUNCH_PRICING_TAGLINE =
  "7-day free trial for each new company · annual subscription to keep your account active.";
