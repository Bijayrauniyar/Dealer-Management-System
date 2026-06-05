import { HOW_IT_WORKS_SECTION, HOW_IT_WORKS_STEPS } from "@/pages/marketing/landingContent";
import { LandingSection } from "@/pages/marketing/LandingSection";
import { marketingCard } from "@/pages/marketing/marketingUi";

export function LandingHowItWorks() {
  return (
    <LandingSection
      id="how-it-works"
      centered
      eyebrow={HOW_IT_WORKS_SECTION.eyebrow}
      title={HOW_IT_WORKS_SECTION.title}
      subtitle={HOW_IT_WORKS_SECTION.subtitle}
      className="bg-slate-50/60"
    >
      <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
        {HOW_IT_WORKS_STEPS.map((item) => (
          <li
            key={item.step}
            className={`${marketingCard} flex flex-col items-center px-4 py-6 text-center sm:px-5 sm:py-8`}
          >
            <span
              className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-600 text-lg font-bold text-white shadow-sm"
              aria-hidden
            >
              {item.step}
            </span>
            <h3 className="mt-4 text-base font-bold text-slate-900 sm:text-lg">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.detail}</p>
          </li>
        ))}
      </ol>

      <p
        className={`${marketingCard} mx-auto mt-8 max-w-2xl border-teal-100/80 bg-teal-50/50 px-4 py-3.5 text-pretty text-center text-sm leading-relaxed text-teal-950 sm:mt-10 sm:px-6`}
      >
        {HOW_IT_WORKS_SECTION.trialNote}
      </p>

    </LandingSection>
  );
}
