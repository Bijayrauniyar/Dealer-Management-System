import { KEY_FEATURES, KEY_FEATURES_SECTION } from "@/pages/marketing/landingContent";
import { LandingSection } from "@/pages/marketing/LandingSection";
import { MobileScreenshotFrame } from "@/pages/marketing/MobileScreenshotFrame";
import { marketingCard } from "@/pages/marketing/marketingUi";

export function KeyFeaturesSection() {
  return (
    <LandingSection
      id="product"
      centered
      eyebrow={KEY_FEATURES_SECTION.eyebrow}
      title={KEY_FEATURES_SECTION.title}
      subtitle={KEY_FEATURES_SECTION.subtitle}
    >
      <div className="space-y-12 sm:space-y-16 lg:space-y-20">
        {KEY_FEATURES.map((row, index) => {
          const imageFirst = index % 2 === 1;
          return (
            <article
              key={row.id}
              className={`grid items-center gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-16 ${
                imageFirst ? "lg:[&>div:first-child]:order-2" : ""
              }`}
            >
              <div className={imageFirst ? "lg:order-2" : ""}>
                <h3 className="text-lg font-bold text-teal-800 sm:text-xl lg:text-2xl">{row.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">{row.detail}</p>
                <ul className="mt-5 space-y-2.5">
                  {row.bullets.map((line) => (
                    <li key={line} className="flex gap-2.5 text-sm text-slate-700 sm:text-[15px]">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-600" aria-hidden />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className={`flex justify-center ${imageFirst ? "lg:order-1" : ""}`}>
                <MobileScreenshotFrame
                  src={row.imageSrc}
                  alt={row.alt}
                  imageFit={row.imageFit}
                  className="w-full max-w-[min(100%,17.5rem)] sm:max-w-[300px]"
                />
              </div>
            </article>
          );
        })}
      </div>

      <p
        className={`${marketingCard} mx-auto mt-12 max-w-2xl border-slate-200/80 bg-slate-50/80 px-4 py-3.5 text-center text-sm text-slate-700 sm:mt-14 sm:px-6`}
      >
        {KEY_FEATURES_SECTION.trustLine}
      </p>

      <p className="mx-auto mt-8 max-w-md text-pretty text-center text-sm text-slate-600 sm:mt-10">
        7-day free trial ·{" "}
        <a href="#pricing" className="font-medium text-teal-700 hover:underline">
          See pricing &amp; start trial
        </a>
      </p>
    </LandingSection>
  );
}
