import { ArrowRight } from "lucide-react";
import { LANDING_PAIN_POINTS, LANDING_PAIN_SECTION } from "@/pages/marketing/landingContent";
import { marketingEyebrow, marketingH2 } from "@/pages/marketing/marketingUi";

export function LandingPainPoints() {
  return (
    <div>
      <p className={`${marketingEyebrow} text-center`}>{LANDING_PAIN_SECTION.eyebrow}</p>
      <h2 className={`${marketingH2} mt-2 text-center`}>{LANDING_PAIN_SECTION.title}</h2>

      <ul className="mt-10 grid items-stretch gap-4 sm:mt-12 sm:grid-cols-3 sm:gap-5 lg:gap-6">
        {LANDING_PAIN_POINTS.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.title}>
              <a
                href={item.href}
                className="group flex h-full flex-col rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm shadow-slate-200/30 transition-all duration-200 hover:-translate-y-1 hover:border-teal-200 hover:shadow-lg hover:shadow-teal-900/10 sm:p-6"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700 transition-colors group-hover:bg-teal-600 group-hover:text-white">
                  <Icon size={22} strokeWidth={2} aria-hidden />
                </span>
                <h3 className="mt-4 break-words text-base font-semibold leading-snug text-slate-900 sm:text-[17px]">
                  {item.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{item.detail}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-teal-700 transition-colors group-hover:text-teal-800">
                  See features
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
