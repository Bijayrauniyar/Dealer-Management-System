import { Link } from "react-router-dom";
import { MARKETING_VALUE_LINE } from "@/config/marketingAudience";
import { PUBLIC_NAV_TRIAL_LABEL, PUBLIC_TRIAL_CTA_PATH } from "@/config/publicSignup";
import { PRODUCT_DISPLAY_NAME } from "@/config/productBrand";
import { LANDING_NAV } from "@/pages/marketing/landingContent";
import { MarketingBrandLogo } from "@/pages/marketing/MarketingBrandLogo";
import { MarketingSessionControl } from "@/pages/marketing/MarketingSessionControl";
import { marketingContainer } from "@/pages/marketing/marketingUi";

export function MarketingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className={`${marketingContainer} py-10 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:py-14`}>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <MarketingBrandLogo variant="footer" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-600">
              {MARKETING_VALUE_LINE}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:col-span-1 lg:col-span-7 lg:grid-cols-2 lg:justify-items-end">
            <div>
              <p className="text-sm font-semibold text-slate-900">Explore</p>
              <nav className="mt-3 flex flex-col gap-2.5 text-sm text-slate-600">
                {LANDING_NAV.map((item) => (
                  <a key={item.href} href={item.href} className="hover:text-teal-700 transition-colors">
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Account & legal</p>
              <nav className="mt-3 flex flex-col gap-2.5 text-sm text-slate-600">
                <MarketingSessionControl variant="footer" />
                <Link to={PUBLIC_TRIAL_CTA_PATH} className="hover:text-teal-700 transition-colors">
                  {PUBLIC_NAV_TRIAL_LABEL}
                </Link>
                <Link to="/privacy" className="hover:text-teal-700 transition-colors">
                  Privacy
                </Link>
                <Link to="/terms" className="hover:text-teal-700 transition-colors">
                  Terms
                </Link>
              </nav>
            </div>
          </div>
        </div>
        <p className="mt-10 border-t border-slate-100 pt-8 text-center text-xs text-slate-400 sm:text-left">
          © {new Date().getFullYear()} {PRODUCT_DISPLAY_NAME}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
