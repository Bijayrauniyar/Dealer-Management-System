/**
 * Product branding — single source of truth (https://bikrikhata.com).
 * Run build after edits — syncs index.html + PWA manifest via Vite.
 * Each shop's legal/trading name on bills comes from Settings (tenant_settings), not here.
 */

/** Public marketing site (docs, emails — not wired to auth redirects yet) */
export const PRODUCT_WEBSITE = "https://bikrikhata.com";

export const PRODUCT_DISPLAY_NAME = "BikriKhata";
export const PRODUCT_SHORT_NAME = PRODUCT_DISPLAY_NAME;

/** PWA / favicon (public/) */
export const BRAND_LOGO_SRC = "/icons/icon.svg";

/** Login / register — main tagline */
export const PRODUCT_TAGLINE =
  "Manage Stock, Sales, Credit & Customers in One Place";

/** Login / register — supporting line */
export const PRODUCT_TAGLINE_DETAIL =
  "Built for distributors, wholesalers and growing businesses.";

/** Browser tab title and PWA name */
export const BRAND_HTML_TITLE = PRODUCT_DISPLAY_NAME;

/** PWA install / manifest */
export const PWA_DESCRIPTION =
  "Manage stock, sales, credit and customers — for Nepal distributors and wholesalers.";

/** App chrome (header, theme-color meta, PWA theme_color) — keep in sync */
export const BRAND_THEME_COLOR = "#0d9488";
