import {
  BRAND_LOGO_SRC,
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
        src={BRAND_LOGO_SRC}
        alt=""
        width={64}
        height={64}
        className="mx-auto h-16 w-16 rounded-2xl shadow-sm"
      />
      <h1 className="mt-4 text-2xl font-bold text-teal-600">{PRODUCT_DISPLAY_NAME}</h1>
      <p className="mt-3 text-sm font-medium leading-snug text-foreground">
        {PRODUCT_TAGLINE}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-muted">{PRODUCT_TAGLINE_DETAIL}</p>
      {footer ? <p className="mt-4 text-sm text-muted">{footer}</p> : null}
    </div>
  );
}
