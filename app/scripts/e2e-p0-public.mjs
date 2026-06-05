/**
 * P0 public marketing routes — landing, legal, pricing, router fallback.
 *
 * Usage: npm run e2e:p0-public
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createE2eReporter } from "./lib/e2e-helpers.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(__dirname, "../src");
const r = createE2eReporter("P0 public routes");

function readSrc(rel) {
  const p = resolve(SRC, rel);
  if (!existsSync(p)) {
    r.fail(`file ${rel}`, "missing");
    return "";
  }
  return readFileSync(p, "utf8");
}

const router = readSrc("routes/AppRouter.tsx");
if (router) {
  for (const [label, needle] of [
    ["route /", 'path="/"'],
    ["route /privacy", 'path="/privacy"'],
    ["route /terms", 'path="/terms"'],
    ["route /faq", 'path="/faq"'],
    ["PublicHomeGate", "PublicHomeGate"],
    ["fallback to /", 'Navigate to="/"'],
  ]) {
    if (router.includes(needle)) r.pass(`AppRouter ${label}`);
    else r.fail(`AppRouter ${label}`, "missing");
  }
  if (!router.includes('Navigate to="/login" replace')) {
    r.pass("AppRouter * no longer sends unknown paths to /login");
  } else {
    r.fail("AppRouter fallback", "still redirects * to /login");
  }
}

const landing = readSrc("pages/marketing/LandingPage.tsx");
if (landing) {
  const pricingBlock = readSrc("pages/marketing/MarketingPricingBlock.tsx");
  if (pricingBlock && pricingBlock.includes("formatLaunchPriceNpr")) {
    r.pass("MarketingPricingBlock shows launch price");
  } else {
    r.fail("MarketingPricingBlock", "missing formatLaunchPriceNpr");
  }
  if (!landing.includes("formatLaunchPriceNpr")) {
    r.pass("LandingPage does not duplicate price in hero");
  } else {
    r.fail("LandingPage hero", "price should only be in pricing section");
  }
  if (landing.includes("LandingHowItWorks")) {
    r.pass("LandingPage includes how-it-works section");
  } else {
    r.fail("LandingPage how-it-works", "missing LandingHowItWorks");
  }
  if (landing.includes("Book a demo")) r.pass("LandingPage book a demo CTA");
  else r.fail("LandingPage demo CTA", "missing");
  if (landing.includes("MarketingFaq")) r.pass("LandingPage renders MarketingFaq");
  else r.fail("LandingPage FAQ", "missing MarketingFaq");
  if (landing.includes("ProductModuleGrid") && landing.includes('id="product"')) {
    r.pass("Landing section product (feature pillars)");
  } else {
    r.fail("Landing section product", "missing ProductModuleGrid / #product");
  }
  if (!landing.includes("LandingAudienceRoadmap")) r.pass("Landing without separate who/roadmap band");
  else r.fail("Landing audience", "remove LandingAudienceRoadmap — positioning in Features");
  if (landing.includes("MarketingPricingBlock")) r.pass("Landing pricing block");
  const pricing = readSrc("pages/marketing/MarketingPricingBlock.tsx");
  if (pricing && pricing.includes("PlanIncludesList") && !pricing.includes("<details")) {
    r.pass("Pricing checklist (no dropdown)");
  } else if (pricing) {
    r.fail("Pricing checklist", "expected PlanIncludesList without details dropdown");
  }
  const heroShot = readSrc("pages/marketing/HeroMarketingScreenshot.tsx");
  if (
    landing.includes("HeroMarketingScreenshot") &&
    heroShot.includes("desktop-dashboard.png") &&
    heroShot.includes("mobile-dashboard.png")
  ) {
    r.pass("Landing hero responsive screenshots (mobile + desktop)");
  } else {
    r.fail(
      "Landing hero screenshot",
      "expected HeroMarketingScreenshot with mobile-dashboard.png and desktop-dashboard.png",
    );
  }
  if (!landing.includes("heroAside") && !landing.includes('MarketingBrandLogo')) {
    r.pass("Landing hero without duplicate logo lockup");
  } else {
    r.fail("Landing hero", "remove MarketingBrandLogo from hero — logo stays in nav only");
  }
  if (landing.includes('id="why"') && landing.includes("LandingPainPoints")) {
    r.pass("Landing pain cards in own section");
  } else {
    r.fail("Landing pain section", "expected #why section with LandingPainPoints");
  }
  const shots = [
    "desktop-dashboard.png",
    "mobile-dashboard.png",
    "mobile-bill.png",
    "mobile-sales-new.png",
    "mobile-inventory.png",
    "mobile-purchase.png",
    "mobile-customers.png",
  ];
  const pub = resolve(__dirname, "../public/marketing");
  const missing = shots.filter((f) => !existsSync(resolve(pub, f)));
  if (missing.length === 0) r.pass("Marketing PNG screenshots present");
  else r.fail("Marketing screenshots", `missing: ${missing.join(", ")} — run npm run capture:marketing`);
  if (!landing.includes("KeyFeaturesSection")) r.pass("Landing without heavy KeyFeaturesSection");
  else r.fail("Landing features", "remove KeyFeaturesSection — use ProductModuleGrid");
  const landingContent = readSrc("pages/marketing/landingContent.ts");
  if (
    landing.includes("PRODUCT_TAGLINE") &&
    landingContent.includes("FEATURE_PILLARS") &&
    landingContent.includes("Salesman & field orders") &&
    landingContent.includes("Reports and analytics")
  ) {
    r.pass("Landing FEATURE_PILLARS incl. salesman + analytics cards");
  } else {
    r.fail("landingContent", "missing FEATURE_PILLARS, salesman, or analytics pillar");
  }
  if (
    landingContent.includes("Salesman & field orders — salesman on bills") &&
    landingContent.includes("Dashboard & analytics")
  ) {
    r.pass("PLAN_INCLUDES salesman + analytics lines");
  } else {
    r.fail("PLAN_INCLUDES", "missing salesman or dashboard/analytics in pricing checklist");
  }
  if (!landing.includes("EssentialAppScreens") && !landing.includes("DistributorOfferSection")) {
    r.pass("Landing without duplicate screen/distributor sections");
  } else {
    r.fail("Landing simplify", "remove EssentialAppScreens and DistributorOfferSection from page");
  }
  const productGrid = readSrc("pages/marketing/ProductModuleGrid.tsx");
  const howItWorks = readSrc("pages/marketing/LandingHowItWorks.tsx");
  const ctaBand = readSrc("pages/marketing/MarketingCtaBand.tsx");
  if (landing.includes("PublicSignupCta") && landing.includes('trial className')) {
    r.pass("Landing hero trial CTA");
  } else {
    r.fail("Landing hero trial", "missing PublicSignupCta trial");
  }
  if (pricing && pricing.includes("PublicSignupCta") && pricing.includes("trial")) {
    r.pass("Pricing section trial CTA");
  } else {
    r.fail("Pricing trial CTA", "missing");
  }
  if (productGrid && !productGrid.includes("PublicSignupCta")) {
    r.pass("Product grid without duplicate trial button");
  } else if (productGrid) {
    r.fail("ProductModuleGrid", "remove duplicate PublicSignupCta trial");
  }
  if (productGrid && !productGrid.includes("Step ") && productGrid.includes("See pricing") && !productGrid.includes("formatLaunchPriceNpr")) {
    r.pass("Product grid links See pricing without duplicating NPR amount");
  } else if (productGrid) {
    r.fail("ProductModuleGrid", "no Step labels; See pricing link only (price on #pricing section)");
  }
  if (howItWorks && !howItWorks.includes("PublicSignupCta") && !howItWorks.includes("trialNote")) {
    r.pass("How-it-works without duplicate trial button or trial note box");
  } else if (howItWorks) {
    r.fail("LandingHowItWorks", "remove duplicate PublicSignupCta trial and trial note box");
  }
  if (ctaBand && !ctaBand.includes("PublicSignupCta")) {
    r.pass("CTA band without duplicate trial button");
  } else if (ctaBand) {
    r.fail("MarketingCtaBand", "remove duplicate PublicSignupCta trial");
  }
  if (landingContent.includes("HOW_IT_WORKS_SECTION")) {
    r.pass("HOW_IT_WORKS_SECTION present");
  } else {
    r.fail("landingContent", "missing HOW_IT_WORKS_SECTION");
  }
  const launchPricing = readSrc("config/launchPricing.ts");
  if (launchPricing && launchPricing.includes("Start Your FREE 1-Week Trial Today")) {
    r.pass("LAUNCH_TRIAL_CTA_HEADLINE");
  } else {
    r.fail("launchPricing.ts", "missing trial headline");
  }
  if (!landing.includes("DeviceShowcaseSection")) r.pass("Landing without desktop showcase");
  else r.fail("Landing desktop showcase", "remove DeviceShowcaseSection");
  if (
    landing.includes('id="contact"') &&
    landing.includes("ContactInquiryForm") &&
    landing.includes("ContactSupportChannels")
  ) {
    r.pass("Landing contact form + support channels");
  } else {
    r.fail("Landing contact", "missing form or support channels");
  }
  const contactForm = readSrc("pages/marketing/ContactInquiryForm.tsx");
  if (
    contactForm &&
    contactForm.includes("setSentWhatsappPrefill") &&
    contactForm.includes("For a faster reply, WhatsApp us")
  ) {
    r.pass("Contact form sets WhatsApp prefill on success");
  } else if (contactForm) {
    r.fail("ContactInquiryForm", "missing setSentWhatsappPrefill or faster-reply WhatsApp CTA");
  }
  if (!landing.includes("all users in your shop")) {
    r.pass("Landing pricing without awkward shop-users copy");
  } else {
    r.fail("Landing pricing copy", "still has all users in your shop");
  }
}

const nav = readSrc("pages/marketing/MarketingNav.tsx");
if (nav && nav.includes("LANDING_NAV")) r.pass("MarketingNav with section links");
else if (nav) r.fail("MarketingNav", "missing LANDING_NAV");
if (nav && !nav.includes("PublicSignupCta")) {
  r.pass("MarketingNav without trial/access menu button");
} else if (nav) {
  r.fail("MarketingNav", "remove Free trial / Request access from header menu");
}

const content = readSrc("pages/marketing/landingContent.ts");
if (content && content.includes("PLAN_INCLUDES") && content.includes("ESSENTIAL_SCREENS")) {
  r.pass("landingContent plan + essential screens");
} else {
  r.fail("landingContent", "missing PLAN_INCLUDES or ESSENTIAL_SCREENS");
}
if (content && content.includes("DISTRIBUTOR_OFFERS")) {
  r.pass("landingContent distributor offers");
} else {
  r.fail("landingContent", "missing DISTRIBUTOR_OFFERS");
}
if (
  content &&
  content.includes("FEATURE_PILLARS") &&
  content.includes("FEATURE_SECTION") &&
  !content.includes("PRODUCT_MODULES")
) {
  r.pass("landingContent FEATURE_PILLARS + FEATURE_SECTION");
} else {
  r.fail("landingContent pillars", "expected FEATURE_PILLARS + FEATURE_SECTION");
}
if (content && !content.includes("workflowLabel") && content.includes('id: "invoices"')) {
  r.pass("landingContent feature cards without fake step labels");
} else if (content) {
  r.fail("landingContent workflow", "remove step/workflow labels from FEATURE_PILLARS — steps live in How it works");
}
if (content && content.includes("highlights:") && !content.includes("FEATURE_SETTINGS_NOTE")) {
  r.pass("landingContent pillar highlights (no settings footnote)");
} else {
  r.fail("landingContent", "missing highlights or still has FEATURE_SETTINGS_NOTE");
}
if (content && content.includes('label: "Contact"') && content.includes("#contact")) {
  r.pass("Nav includes Contact");
} else {
  r.fail("Nav Contact", "missing");
}
if (content && content.includes('label: "Features"') && content.includes("How it works")) {
  r.pass("Nav: Features / How it works / Pricing");
} else {
  r.fail("Nav labels", "expected Features, How it works, Pricing");
}
if (content && !content.includes("your whole team")) {
  r.pass("Pricing copy avoids your whole team");
} else {
  r.fail("landingContent", "still has your whole team");
}
if (content && !/\broute\b/i.test(content)) {
  r.pass("landingContent without route jargon");
} else if (content) {
  r.fail("landingContent", 'remove word "route" from marketing copy');
}
const distributor = readSrc("pages/marketing/DistributorOfferSection.tsx");
if (distributor && !/\broute\b/i.test(distributor)) {
  r.pass("DistributorOfferSection without route jargon");
} else if (distributor) {
  r.fail("DistributorOfferSection", 'remove word "route" from marketing copy');
}
const landingFaq = readSrc("pages/marketing/landingFaq.ts");
if (landingFaq && !/\broute\b/i.test(landingFaq)) {
  r.pass("landingFaq without route jargon");
} else if (landingFaq) {
  r.fail("landingFaq", 'remove word "route" from FAQ copy');
}

const inquiryLib = readSrc("lib/submitPlatformInquiry.ts");
if (inquiryLib && inquiryLib.includes("submit_platform_inquiry")) {
  r.pass("submitPlatformInquiry uses RPC with insert fallback");
} else {
  r.fail("submitPlatformInquiry", "missing RPC");
}
if (inquiryLib && inquiryLib.includes("inquiry_purpose")) {
  r.pass("submitPlatformInquiry sends inquiry_purpose");
} else {
  r.fail("submitPlatformInquiry", "missing inquiry_purpose");
}

const mig27 = resolve(__dirname, "../supabase/migrations/0027_platform_inquiries.sql");
if (existsSync(mig27)) r.pass("migration 0027_platform_inquiries.sql");
else r.fail("migration 0027", "missing");

const pricing = readSrc("config/launchPricing.ts");
if (pricing && pricing.includes("LAUNCH_PRICE_NPR_PER_YEAR")) {
  const m = pricing.match(/LAUNCH_PRICE_NPR_PER_YEAR\s*=\s*(\d+)/);
  if (m) r.pass(`launchPricing.ts NPR ${m[1]}/year`);
  else r.fail("launchPricing.ts", "missing LAUNCH_PRICE_NPR_PER_YEAR value");
} else r.fail("launchPricing.ts", "missing LAUNCH_PRICE_NPR_PER_YEAR");

const domainLive = readSrc("lib/live/domainLive.ts");
if (
  domainLive?.includes('DOMAIN_QUERY_KEY = ["domain", "v2"]') &&
  domainLive.includes("getTenantIdForCurrentUser")
) {
  const tenantEq = (domainLive.match(/\.eq\("tenant_id",/g) || []).length;
  if (tenantEq >= 30) r.pass(`domainLive.ts tenant_id scope (${tenantEq} filters)`);
  else r.fail("domainLive.ts", `expected >=30 .eq("tenant_id") — got ${tenantEq}`);
} else {
  r.fail("domainLive.ts", "missing DOMAIN_QUERY_KEY v2 or getTenantIdForCurrentUser");
}

const sessionCtrl = readSrc("pages/marketing/MarketingSessionControl.tsx");
if (sessionCtrl?.includes("Log out") && sessionCtrl.includes("signOut")) {
  r.pass("MarketingSessionControl log out when logged in");
} else {
  r.fail("MarketingSessionControl", "missing session-aware log out");
}

const publicHomeGate = readSrc("pages/marketing/PublicHomeGate.tsx");
if (
  publicHomeGate?.includes("licenseValid") &&
  publicHomeGate.includes("shouldEnterApp") &&
  !publicHomeGate.includes("routeForTenantProfile")
) {
  r.pass("PublicHomeGate: marketing for expired license, app only when valid");
} else {
  r.fail("PublicHomeGate", "expected licenseValid gate without redirecting expired users from /");
}

const publicSignup = readSrc("config/publicSignup.ts");
if (publicSignup && publicSignup.includes("PUBLIC_SIGNUP_ENABLED = true")) {
  r.pass("public self-service signup enabled");
} else {
  r.fail("publicSignup.ts", "expected PUBLIC_SIGNUP_ENABLED = true");
}
if (readSrc("pages/PendingApprovalPage.tsx")?.includes("Activate your workspace")) {
  r.pass("PendingApprovalPage trial activation copy");
} else {
  r.fail("PendingApprovalPage", "expected trial activation messaging");
}
const mig30 = resolve(__dirname, "../supabase/migrations/0030_tenant_license.sql");
if (existsSync(mig30)) r.pass("migration 0030_tenant_license.sql");
else r.fail("migration 0030", "missing");
const mig31 = resolve(__dirname, "../supabase/migrations/0031_tenant_license_days.sql");
if (existsSync(mig31)) r.pass("migration 0031_tenant_license_days.sql");
else r.fail("migration 0031", "missing");
const licenseUi = readSrc("pages/settings/SubscriptionSection.tsx");
if (licenseUi?.includes("Subscription") && licenseUi.includes("tenantLicenseDaysRemaining")) {
  r.pass("Settings SubscriptionSection");
} else {
  r.fail("SubscriptionSection", "missing plan/days UI");
}
if (readSrc("lib/tenantLicense.ts")?.includes("LICENSE_RENEWAL_WARN_DAYS = 30")) {
  r.pass("license renewal warn threshold 30 days");
} else {
  r.fail("tenantLicense.ts", "missing LICENSE_RENEWAL_WARN_DAYS");
}
if (readSrc("components/app/LicenseRenewalBanner.tsx")?.includes("shouldWarnLicenseRenewal")) {
  r.pass("LicenseRenewalBanner");
} else {
  r.fail("LicenseRenewalBanner", "missing");
}
if (readSrc("components/app/LicenseRenewalDailyReminder.tsx")?.includes("licenseReminderShownToday")) {
  r.pass("LicenseRenewalDailyReminder once per day");
} else {
  r.fail("LicenseRenewalDailyReminder", "missing daily storage");
}
if (readSrc("components/app/NotificationPanel.tsx")?.includes("buildLicenseRenewalNotif")) {
  r.pass("notification panel license renewal alert");
} else {
  r.fail("NotificationPanel", "missing buildLicenseRenewalNotif");
}
const registerGate = readSrc("pages/RegisterGate.tsx");
if (registerGate && registerGate.includes("RegisterPage") && publicSignup?.includes("PUBLIC_SIGNUP_ENABLED = true")) {
  r.pass("RegisterGate shows RegisterPage when signup on");
} else if (registerGate) {
  r.fail("RegisterGate", "expected RegisterPage when PUBLIC_SIGNUP_ENABLED");
}
for (const [rel, label] of [
  ["pages/marketing/MarketingNav.tsx", "MarketingNav"],
  ["pages/marketing/MarketingFooter.tsx", "MarketingFooter"],
  ["pages/marketing/LandingPage.tsx", "LandingPage"],
]) {
  const src = readSrc(rel);
  if (src && !src.includes('to="/register"')) r.pass(`${label} no /register link`);
  else if (src) r.fail(`${label} /register`, "should use PublicSignupCta or contact path");
}
const loginPage = readSrc("pages/LoginPage.tsx");
if (loginPage && loginPage.includes('to="/register"') && loginPage.includes("PUBLIC_SIGNUP_ENABLED")) {
  r.pass("LoginPage links to /register when signup on");
} else if (loginPage) {
  r.fail("LoginPage", "expected /register link when signup enabled");
}
if (readSrc("pages/marketing/PublicSignupCta.tsx")) r.pass("PublicSignupCta component");
else r.fail("PublicSignupCta", "missing");

const register = readSrc("pages/RegisterPage.tsx");
if (register && register.includes('/terms') && register.includes('/privacy')) {
  r.pass("RegisterPage links to terms + privacy");
} else {
  r.fail("RegisterPage legal links", "missing");
}

for (const page of ["PrivacyPage.tsx", "TermsPage.tsx", "legalContent.ts", "landingFaq.ts", "MarketingFaq.tsx"]) {
  if (existsSync(resolve(SRC, "pages/marketing", page))) r.pass(`marketing/${page}`);
  else r.fail(`marketing/${page}`, "missing");
}

const faq = readSrc("pages/marketing/landingFaq.ts");
if (faq && faq.includes("What is BikriKhata?")) {
  r.pass("FAQ opens with What is BikriKhata");
} else {
  r.fail("landing FAQ", "missing What is BikriKhata");
}
if (existsSync(resolve(SRC, "pages/marketing/FaqAccordionList.tsx"))) {
  r.pass("FaqAccordionList plus-icon pattern");
} else {
  r.fail("FaqAccordionList", "missing");
}
if (faq && !faq.includes("first launch")) {
  r.pass("FAQ avoids first launch jargon");
} else {
  r.fail("landing FAQ", "contains first launch wording");
}

const legal = readSrc("pages/marketing/legalContent.ts");
if (legal && legal.includes("contact form") && legal.includes("LAUNCH_TRIAL_DAYS")) {
  r.pass("Terms/Privacy use launch trial + contact onboarding");
} else if (legal) {
  r.fail("legalContent", "expected contact form + LAUNCH_TRIAL_DAYS in terms/privacy");
}
if (legal && !legal.includes("agreed at signup")) {
  r.pass("Terms without stale signup-only subscription line");
} else if (legal) {
  r.fail("legalContent", 'remove "agreed at signup" — use website pricing + contact form');
}
if (faq && faq.includes("/register") && faq.includes("launchPricing")) {
  r.pass("FAQ self-signup + pricing from launchPricing");
} else if (faq) {
  r.fail("landing FAQ", "expected /register + launchPricing import");
}
if (faq && faq.includes("Can I sign up on the website by myself?")) {
  r.pass("FAQ explains no self-service signup");
} else if (faq) {
  r.fail("landing FAQ", "missing self-signup FAQ entry");
}

const fails = r.summary();
process.exit(fails > 0 ? 1 : 0);
