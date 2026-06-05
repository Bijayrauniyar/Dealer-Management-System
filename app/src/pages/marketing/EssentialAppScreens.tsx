import { MARKETING_MOBILE_FIRST } from "@/config/marketingAudience";
import { ESSENTIAL_SCREENS, ESSENTIAL_SCREENS_SECTION } from "@/pages/marketing/landingContent";
import { LandingSection } from "@/pages/marketing/LandingSection";
import { MobileScreenshotFrame } from "@/pages/marketing/MobileScreenshotFrame";
import { marketingCard } from "@/pages/marketing/marketingUi";

export function EssentialAppScreens() {
  return (
    <LandingSection
      id="screens"
      eyebrow={ESSENTIAL_SCREENS_SECTION.eyebrow}
      title={ESSENTIAL_SCREENS_SECTION.title}
      subtitle={ESSENTIAL_SCREENS_SECTION.subtitle}
      className="border-y border-slate-200/80 bg-gradient-to-b from-slate-50/50 to-white"
    >
      <p
        className={`${marketingCard} mx-auto mb-10 max-w-3xl border-teal-100/80 bg-teal-50/50 px-4 py-3.5 text-center text-sm leading-relaxed text-teal-950 sm:px-6 sm:text-[15px]`}
      >
        {MARKETING_MOBILE_FIRST}
      </p>
      <ul className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {ESSENTIAL_SCREENS.map(({ id, label, caption, imageSrc, alt, imageFit }) => (
          <li key={id} className="flex flex-col items-center text-center">
            <MobileScreenshotFrame src={imageSrc} alt={alt} imageFit={imageFit} className="mx-auto" />
            <p className="mt-4 text-base font-semibold text-slate-900">{label}</p>
            <p className="mt-2 max-w-[16rem] text-sm leading-snug text-slate-600 sm:max-w-[11.5rem] lg:max-w-[13rem]">
              {caption}
            </p>
          </li>
        ))}
      </ul>
    </LandingSection>
  );
}
