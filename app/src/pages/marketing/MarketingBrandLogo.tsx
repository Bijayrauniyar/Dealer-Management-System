import { Link } from "react-router-dom";
import {
  BRAND_ICON_MARK_SRC,
  BRAND_ICON_MARK_SRC_2X,
  BRAND_LOGO_LOCKUP_SRC,
  PRODUCT_DISPLAY_NAME,
} from "@/config/productBrand";
import { useMarketingHomeNav } from "@/pages/marketing/useMarketingHashScroll";

type Props = {
  /** Nav/footer: full logo image. Hero: larger lockup (legacy marketing pages). */
  variant?: "nav" | "hero" | "footer";
};

export function MarketingBrandLogo({ variant = "nav" }: Props) {
  const onHomeNav = useMarketingHomeNav();

  if (variant === "hero") {
    return (
      <div className="mb-4 flex w-full justify-center sm:mb-5 lg:mb-6 lg:justify-start">
        <img
          src={BRAND_LOGO_LOCKUP_SRC}
          alt={PRODUCT_DISPLAY_NAME}
          width={480}
          height={480}
          decoding="async"
          className="h-40 w-auto max-w-[min(100%,20rem)] sm:h-48 sm:max-w-[24rem] lg:h-56 lg:max-w-[28rem] object-contain"
        />
      </div>
    );
  }

  const compact = variant === "footer";

  if (variant === "nav") {
    return (
      <Link
        to="/"
        onClick={onHomeNav}
        className="inline-flex shrink-0 items-center gap-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-600"
        aria-label={PRODUCT_DISPLAY_NAME}
      >
        <img
          src={BRAND_ICON_MARK_SRC}
          srcSet={`${BRAND_ICON_MARK_SRC} 1x, ${BRAND_ICON_MARK_SRC_2X} 2x`}
          alt=""
          width={32}
          height={32}
          decoding="async"
          className="h-8 w-8 shrink-0 object-contain"
        />
        <span className="text-base font-semibold tracking-tight text-slate-900 sm:text-[17px]">
          {PRODUCT_DISPLAY_NAME}
        </span>
      </Link>
    );
  }

  return (
    <Link
      to="/"
      onClick={onHomeNav}
      className="inline-flex shrink-0 items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-600 rounded-lg"
      aria-label={PRODUCT_DISPLAY_NAME}
    >
      <img
        src={BRAND_LOGO_LOCKUP_SRC}
        alt={PRODUCT_DISPLAY_NAME}
        width={compact ? 200 : 240}
        height={compact ? 80 : 96}
        decoding="async"
        className={
          compact
            ? "h-10 w-auto max-w-[10rem] object-contain object-left"
            : "h-10 w-auto max-w-[10rem] object-contain object-left"
        }
      />
    </Link>
  );
}
