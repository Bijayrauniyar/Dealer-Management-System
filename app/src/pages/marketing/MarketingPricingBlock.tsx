import { Link } from "react-router-dom";
import { formatLaunchPriceNpr, LAUNCH_PRICING_TAGLINE } from "@/config/launchPricing";
import { PublicSignupCta } from "@/pages/marketing/PublicSignupCta";
import { platformSupportContacts, telUrl } from "@/config/supportContacts";
import { PlanIncludesList } from "@/pages/marketing/PlanIncludesList";
import {
  marketingBtnOutline,
  marketingBtnPrimary,
  marketingCard,
  marketingContainer,
  marketingEyebrow,
  marketingScrollMt,
  marketingSectionYAnchor,
} from "@/pages/marketing/marketingUi";

export function MarketingPricingBlock() {
  const support = platformSupportContacts();
  const tel = telUrl(support.phone);

  return (
    <section
      id="pricing"
      className={`${marketingScrollMt} border-t border-slate-200 bg-white ${marketingSectionYAnchor}`}
    >
      <div className={`${marketingContainer} mx-auto max-w-2xl`}>
        <div className="text-center">
          <p className={marketingEyebrow}>Pricing</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            {formatLaunchPriceNpr()}
          </p>
          <p className="mx-auto mt-2 max-w-md text-pretty text-sm leading-relaxed text-slate-600 sm:max-w-lg sm:text-base">
            {LAUNCH_PRICING_TAGLINE}
          </p>
        </div>
        <div className={`mt-6 sm:mt-10 ${marketingCard} border-teal-100/80 bg-gradient-to-b from-teal-50/40 to-white p-5 sm:p-8 lg:p-10`}>
          <p className="text-sm font-semibold text-slate-900 sm:text-base">What&apos;s included</p>
          <PlanIncludesList />
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row">
          <PublicSignupCta trial className={`${marketingBtnPrimary} w-full sm:flex-1`} />
          <Link to="/?intent=demo#contact" className={`${marketingBtnOutline} w-full sm:flex-1`}>
            Book a demo
          </Link>
        </div>
        {tel ? (
          <p className="mt-5 text-center text-sm text-slate-600">
            Questions?{" "}
            <a href={tel} className="font-semibold text-teal-700 hover:underline">
              {support.phone}
            </a>
          </p>
        ) : null}
      </div>
    </section>
  );
}
