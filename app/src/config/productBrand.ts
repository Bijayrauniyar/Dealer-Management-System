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

/** Landing hero eyebrow — who the product serves (Nepal distribution) */
export const PRODUCT_HERO_EYEBROW = "Billing for Nepal distribution";

/** Login / register / hero — main headline (audience-first) */
export const PRODUCT_TAGLINE = "Built for distributors, dealers & stockists";

/** Login / register / hero — phone wedge + offer (no NPR here; see #pricing) */
export const PRODUCT_TAGLINE_DETAIL =
  "Tax invoices, godown stock, and customer credit — from your phone. One affordable plan per company.";

/** Browser tab title and PWA name */
export const BRAND_HTML_TITLE = PRODUCT_DISPLAY_NAME;

/** PWA install / manifest */
export const PWA_DESCRIPTION =
  "Tax invoices, godown stock, and customer credit for Nepal distributors and dealers.";

/** App chrome (header, theme-color meta, PWA theme_color) — keep in sync */
export const BRAND_THEME_COLOR = "#0d9488";
