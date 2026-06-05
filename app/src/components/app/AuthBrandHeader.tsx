import {
  BRAND_LOGO_LOCKUP_SRC,
  PRODUCT_DISPLAY_NAME,
  PRODUCT_TAGLINE,
  PRODUCT_TAGLINE_DETAIL,
} from "@/config/productBrand";

type AuthBrandHeaderProps = {
  /** Extra line under description (e.g. register CTA hint) */
  footer?: string;
};

export function AuthBrandHeader({ footer }: AuthBrandHeaderProps) {
  return (
    <div className="mb-8 text-center max-w-sm mx-auto">
      <img
        src={BRAND_LOGO_LOCKUP_SRC}
        alt={PRODUCT_DISPLAY_NAME}
        width={400}
        height={400}
        decoding="async"
        className="mx-auto h-40 w-auto max-w-[min(100%,18rem)] sm:h-44 sm:max-w-[20rem] object-contain"
      />
      <h1 className="sr-only">{PRODUCT_DISPLAY_NAME}</h1>
      <p className="mt-4 text-sm font-medium leading-snug text-foreground">
        {PRODUCT_TAGLINE}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-muted">{PRODUCT_TAGLINE_DETAIL}</p>
      {footer ? <p className="mt-4 text-sm text-muted">{footer}</p> : null}
    </div>
  );
}
