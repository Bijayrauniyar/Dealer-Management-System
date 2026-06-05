/** Shared layout + button classes for public marketing pages. */

/** Sticky nav clearance — keep in sync with `.marketing-site` scroll-padding in index.css. */
export function marketingHashScrollOffsetPx(): number {
  if (typeof window === "undefined") return 72;
  return window.innerWidth >= 640 ? 68 : 72;
}

/** Anchor scroll margin under sticky nav. */
export const marketingScrollMt = "scroll-mt-[4.5rem] sm:scroll-mt-[4.25rem]";

export const marketingContainer =
  "mx-auto w-full min-w-0 max-w-7xl px-4 sm:px-6 lg:px-8 [padding-left:max(1rem,env(safe-area-inset-left))] [padding-right:max(1rem,env(safe-area-inset-right))]";

/** Default section rhythm (tighter than before — avoids “title only” on hash jump). */
export const marketingSectionY = "py-10 sm:py-14 lg:py-16";

/** Sections with `id` anchors — less top padding so nav jump shows headline + body. */
export const marketingSectionYAnchor = "pt-8 pb-10 sm:pt-10 sm:pb-14 lg:pt-12 lg:pb-16";

/** Centered content column (FAQ, pricing, contact headers). */
export const marketingContentColumn = "mx-auto w-full min-w-0 max-w-3xl";

export const marketingEyebrow =
  "text-xs font-semibold uppercase tracking-[0.12em] text-teal-700 sm:text-sm";

export const marketingH2 =
  "text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl lg:leading-tight";

export const marketingLead =
  "mt-3 text-[15px] leading-relaxed text-slate-600 sm:mt-4 sm:text-base sm:leading-relaxed lg:text-lg";

export const marketingCard =
  "rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/40";

const marketingBtnBase =
  "inline-flex min-h-11 max-w-full items-center justify-center rounded-xl px-4 py-2.5 text-center text-sm font-semibold sm:px-6 sm:text-base";

export const marketingBtnPrimary = `${marketingBtnBase} bg-teal-600 text-white shadow-sm shadow-teal-900/10 transition-colors hover:bg-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 active:bg-teal-800`;

export const marketingBtnSecondary = `${marketingBtnBase} border border-slate-200 bg-white text-slate-800 shadow-sm transition-colors hover:border-teal-200 hover:bg-teal-50/80 hover:text-teal-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600`;

/** Paired with primary — same green brand, outline style. */
export const marketingBtnOutline = `${marketingBtnBase} border-2 border-teal-600 bg-teal-50 text-teal-900 shadow-sm transition-colors hover:bg-teal-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600`;

export const marketingBtnOnDark = `${marketingBtnBase} bg-white text-teal-800 shadow-sm transition-colors hover:bg-teal-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white`;

export const marketingBtnGhostOnDark = `${marketingBtnBase} border border-teal-400/80 text-white transition-colors hover:border-teal-300 hover:bg-teal-600/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white`;
