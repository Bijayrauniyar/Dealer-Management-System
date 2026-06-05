import { Link } from "react-router-dom";
import { LANDING_FAQ } from "@/pages/marketing/landingFaq";
import { FaqAccordionList } from "@/pages/marketing/FaqAccordionList";
import {
  marketingBtnOutline,
  marketingBtnPrimary,
  marketingContainer,
  marketingContentColumn,
  marketingEyebrow,
  marketingH2,
  marketingScrollMt,
  marketingSectionY,
  marketingSectionYAnchor,
} from "@/pages/marketing/marketingUi";

type Props = {
  /** Landing anchor `/#faq` vs dedicated `/faq` page */
  variant?: "landing" | "page";
};

export function FaqSection({ variant = "landing" }: Props) {
  const isPage = variant === "page";

  return (
    <section
      id={isPage ? undefined : "faq"}
      className={`border-t border-slate-200 bg-white ${isPage ? marketingSectionY : `${marketingScrollMt} ${marketingSectionYAnchor}`}`}
    >
      <div className={marketingContainer}>
        <div className={isPage ? "mx-auto max-w-4xl" : marketingContentColumn}>
          <header className="text-center">
            <p className={marketingEyebrow}>Support center</p>
            {isPage ? (
              <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                Frequently asked questions
              </h1>
            ) : (
              <h2 className={`mt-2 sm:mt-3 ${marketingH2}`}>Frequently asked questions</h2>
            )}
            <p className="mx-auto mt-3 max-w-2xl text-pretty text-base leading-relaxed text-slate-600 sm:mt-4 sm:text-lg">
              Everything you need to know about BikriKhata for your business. Can&apos;t find the answer?{" "}
              <Link to="/?#contact" className="font-semibold text-teal-700 hover:underline">
                Contact us
              </Link>{" "}
              or{" "}
              <Link to="/?intent=trial#contact" className="font-semibold text-teal-700 hover:underline">
                start a free trial
              </Link>
              .
            </p>
          </header>

          <div className="mt-8 sm:mt-10">
            <FaqAccordionList items={LANDING_FAQ} variant={isPage ? "page" : "landing"} />
          </div>

          <div className="mt-10 rounded-2xl border border-teal-100 bg-teal-50/40 px-6 py-8 text-center sm:mt-12 sm:px-8">
            <p className="text-lg font-semibold text-slate-900">Ready to try BikriKhata?</p>
            <p className="mt-2 text-pretty text-sm text-slate-600">
              Submit the contact form for a free trial — we set up your company account and send login details. Or book a
              short walkthrough with our team.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link to="/?intent=trial#contact" className={`${marketingBtnPrimary} min-h-11 px-6`}>
                Start free trial
              </Link>
              <Link to="/?intent=demo#contact" className={`${marketingBtnOutline} min-h-11 px-6`}>
                Book a demo
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
