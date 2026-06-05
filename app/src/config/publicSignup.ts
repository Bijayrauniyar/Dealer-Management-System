import { LAUNCH_TRIAL_CTA_HEADLINE } from "@/config/launchPricing";

/**
 * Pilot launch: self-service /register is off — we create accounts after contact form.
 * Set PUBLIC_SIGNUP_ENABLED = true when opening public registration.
 */
/** Self-service /register; workspace stays pending until super_admin approve_tenant (7-day trial on activate). */
export const PUBLIC_SIGNUP_ENABLED = true;

/** Contact section with trial purpose pre-selected. */
export const PUBLIC_TRIAL_CTA_PATH = "/?intent=trial#contact";

/** Contact section with Request access purpose (login footer, etc.). */
export const PUBLIC_SIGNUP_CTA_PATH = "/?intent=signup#contact";

export const PUBLIC_SIGNUP_CTA_LABEL = "Request access";

/** Hero / pricing trial CTA — same headline as contact form purpose. */
export const PUBLIC_TRIAL_CTA_LABEL = LAUNCH_TRIAL_CTA_HEADLINE;

/** Shorter label for narrow screens (same destination as trial CTA). */
export const PUBLIC_TRIAL_CTA_LABEL_SHORT = "Start free 1-week trial";

/** Compact label for nav (same contact destination as trial). */
export const PUBLIC_NAV_TRIAL_LABEL = "Free trial";
