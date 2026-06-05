/**
 * Product branding — single source of truth (https://bikrikhata.com).
 * Run build after edits — syncs index.html + PWA manifest via Vite.
 * Each shop's legal/trading name on bills comes from Settings (tenant_settings), not here.
 */
/** Public marketing site (docs, emails — not wired to auth redirects yet) */
export declare const PRODUCT_WEBSITE = "https://bikrikhata.com";
export declare const PRODUCT_DISPLAY_NAME = "BikriKhata";
export declare const PRODUCT_SHORT_NAME = "BikriKhata";
/** PWA / favicon (square app icon) */
export declare const BRAND_LOGO_SRC = "/icons/icon.png";
/** Full lockup with wordmark — marketing hero, login (1254×1254 master) */
export declare const BRAND_LOGO_LOCKUP_SRC = "/icons/logo-lockup.png";
/** Icon mark only (no wordmark) — nav beside product name */
export declare const BRAND_ICON_MARK_SRC = "/icons/icon-mark.png";
/** Retina nav icon (same crop as icon-mark.png) */
export declare const BRAND_ICON_MARK_SRC_2X = "/icons/icon-mark@2x.png";
/** Login / register / hero — main tagline */
export declare const PRODUCT_TAGLINE = "Billing, stock & credit \u2014 built for your phone";
/** Login / register / hero — supporting line (B2B positioning lives here once) */
export declare const PRODUCT_TAGLINE_DETAIL = "B2B software for Nepal businesses that purchase, manage stock, bill customers, and track credit. Especially popular with distributors and dealers. One affordable plan per company.";
/** Browser tab title and PWA name */
export declare const BRAND_HTML_TITLE = "BikriKhata";
/** PWA install / manifest */
export declare const PWA_DESCRIPTION = "Billing, stock, and customer credit for Nepal businesses \u2014 built for your phone.";
/** App chrome (header, theme-color meta, PWA theme_color) — keep in sync */
export declare const BRAND_THEME_COLOR = "#0d9488";
