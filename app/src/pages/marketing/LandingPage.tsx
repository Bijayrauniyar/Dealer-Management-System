import { Link } from "react-router-dom";
import { useMarketingHashScroll } from "@/pages/marketing/useMarketingHashScroll";
import {
  PRODUCT_HERO_EYEBROW,
  PRODUCT_TAGLINE,
  PRODUCT_TAGLINE_DETAIL,
} from "@/config/productBrand";
import { ContactInquiryForm } from "@/pages/marketing/ContactInquiryForm";
import { ContactSupportChannels } from "@/pages/marketing/ContactSupportChannels";
import { HeroMarketingScreenshot } from "@/pages/marketing/HeroMarketingScreenshot";
import { ProductModuleGrid } from "@/pages/marketing/ProductModuleGrid";
import { FEATURE_SECTION } from "@/pages/marketing/landingContent";
import { LandingHowItWorks } from "@/pages/marketing/LandingHowItWorks";
import { LandingPainPoints } from "@/pages/marketing/LandingPainPoints";
import { MarketingShell } from "@/pages/marketing/MarketingShell";
import { MarketingFaq } from "@/pages/marketing/MarketingFaq";
import { MarketingCtaBand } from "@/pages/marketing/MarketingCtaBand";
import { MarketingPricingBlock } from "@/pages/marketing/MarketingPricingBlock";
import { LandingSection } from "@/pages/marketing/LandingSection";
import { PublicSignupCta } from "@/pages/marketing/PublicSignupCta";
import {
  marketingBtnOutline,
  marketingBtnPrimary,
  marketingContainer,
  marketingEyebrow,
  marketingLead,
  marketingScrollMt,
  marketingSectionYAnchor,
} from "@/pages/marketing/marketingUi";

export function LandingPage() {
  useMarketingHashScroll();

  return (
    <MarketingShell>
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-teal-50/60 via-white to-white">
        <div
          className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-teal-200/30 blur-3xl sm:h-96 sm:w-96"
          aria-hidden
        />
        <div className={`${marketingContainer} relative py-8 sm:py-14 lg:py-16`}>
          <div className="mx-auto flex max-w-3xl min-w-0 flex-col items-center text-center">
            <p className={marketingEyebrow}>{PRODUCT_HERO_EYEBROW}</p>
            <h1 className="mt-3 max-w-xl text-[1.65rem] font-bold leading-tight tracking-tight text-slate-900 min-[380px]:text-3xl sm:mt-4 sm:text-4xl sm:leading-[1.2] lg:text-[2.65rem] lg:leading-[1.15]">
              {PRODUCT_TAGLINE}
            </h1>
            <p className={`${marketingLead} mx-auto mt-4 max-w-lg lg:mt-5`}>{PRODUCT_TAGLINE_DETAIL}</p>
            <div className="mt-8 flex w-full max-w-md flex-col items-center gap-3 sm:max-w-none sm:flex-row sm:flex-wrap sm:justify-center">
              <PublicSignupCta trial className={`${marketingBtnPrimary} w-full sm:w-auto sm:max-w-full`} />
              <Link to="/?intent=demo#contact" className={`${marketingBtnOutline} w-full sm:w-auto`}>
                Book a demo
              </Link>
            </div>
            <p className="mt-3 flex flex-col items-center gap-1 text-sm text-slate-600 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-3 sm:gap-y-1">
              <a href="#pricing" className="font-medium text-teal-700 hover:underline">
                See pricing
              </a>
              <span className="hidden text-slate-300 sm:inline" aria-hidden>
                ·
              </span>
              <a
                href="#product"
                className="font-medium text-teal-700 underline-offset-2 hover:underline"
              >
                See features ↓
              </a>
            </p>
          </div>

          <div className="mt-8 w-full min-w-0 sm:mt-12 lg:mt-14">
            <HeroMarketingScreenshot />
          </div>
        </div>
      </section>

      <section
        id="why"
        className={`${marketingScrollMt} border-b border-slate-200/80 bg-slate-50/50 ${marketingSectionYAnchor}`}
      >
        <div className={marketingContainer}>
          <LandingPainPoints />
        </div>
      </section>

      <LandingSection
        id="product"
        centered
        eyebrow={FEATURE_SECTION.eyebrow}
        title={FEATURE_SECTION.title}
        subtitle={FEATURE_SECTION.subtitle}
        className="border-b border-slate-200/80 bg-slate-50/40"
      >
        <ProductModuleGrid />
      </LandingSection>

      <LandingHowItWorks />

      <MarketingPricingBlock />

      <MarketingFaq />

      <LandingSection
        id="contact"
        centered
        eyebrow="Contact"
        title="Get in touch"
        subtitle="Call, WhatsApp, email, or send a message below."
        className="border-t border-slate-200/80 bg-white"
      >
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-10 lg:items-stretch xl:gap-12">
          <ContactSupportChannels />
          <ContactInquiryForm />
        </div>
      </LandingSection>

      <MarketingCtaBand />
    </MarketingShell>
  );
}
