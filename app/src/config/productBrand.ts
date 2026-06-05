/**
 * Product branding — single source of truth (https://bikrikhata.com).
 * Run build after edits — syncs index.html + PWA manifest via Vite.
 * Each shop's legal/trading name on bills comes from Settings (tenant_settings), not here.
 */

/** Public marketing site (docs, emails — not wired to auth redirects yet) */
export const PRODUCT_WEBSITE = "https://bikrikhata.com";

export const PRODUCT_DISPLAY_NAME = "BikriKhata";
export const PRODUCT_SHORT_NAME = PRODUCT_DISPLAY_NAME;

/** PWA / favicon (square app icon) */
export const BRAND_LOGO_SRC = "/icons/icon.png";

/** Full lockup with wordmark — marketing hero, login (1254×1254 master) */
export const BRAND_LOGO_LOCKUP_SRC = "/icons/logo-lockup.png";

/** Icon mark only (no wordmark) — nav beside product name */
export const BRAND_ICON_MARK_SRC = "/icons/icon-mark.png";

/** Retina nav icon (same crop as icon-mark.png) */
export const BRAND_ICON_MARK_SRC_2X = "/icons/icon-mark@2x.png";

/** Login / register — main tagline */
export const PRODUCT_TAGLINE =
  "Manage Stock, Sales, Credit & Customers in One Place";

/** Login / register — supporting line */
export const PRODUCT_TAGLINE_DETAIL =
  "Sales, purchase, stock and customer credit for Nepal distributors, dealers & stockists. Mobile-first in your browser — desktop optional.";

/** Browser tab title and PWA name */
export const BRAND_HTML_TITLE = PRODUCT_DISPLAY_NAME;

/** PWA install / manifest */
export const PWA_DESCRIPTION =
  "Sales, purchase, stock and credit — for Nepal distributors, dealers & stockists.";

/** App chrome (header, theme-color meta, PWA theme_color) — keep in sync */
export const BRAND_THEME_COLOR = "#0d9488";
