import { DISTRIBUTOR_OFFERS, LANDING_AUDIENCE } from "@/pages/marketing/landingContent";
import { LandingSection } from "@/pages/marketing/LandingSection";
import { marketingCard } from "@/pages/marketing/marketingUi";

/** What BikriKhata adds for wholesalers / dealers beyond generic billing apps. */
export function DistributorOfferSection() {
  return (
    <LandingSection
      id="for-distributors"
      eyebrow="For distribution businesses"
      title="Built for godown, counter, and credit — not retail POS"
      subtitle="Generic billing apps stop at the counter. BikriKhata ties together purchase, stock, wholesale billing, and dealer credit the way Nepal distribution teams work."
      className="bg-white"
    >
      <ul className="mb-10 flex flex-wrap justify-center gap-2.5 sm:gap-3">
        {LANDING_AUDIENCE.map((line) => (
          <li
            key={line}
            className="rounded-full border border-teal-100 bg-teal-50/60 px-4 py-2 text-sm font-medium text-slate-800 sm:px-5 sm:py-2.5"
          >
            {line}
          </li>
        ))}
      </ul>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
        {DISTRIBUTOR_OFFERS.map(({ title, detail }) => (
          <li key={title} className={`${marketingCard} p-5 sm:p-6`}>
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{detail}</p>
          </li>
        ))}
      </ul>
    </LandingSection>
  );
}
