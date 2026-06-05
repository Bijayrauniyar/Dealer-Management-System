import { Check } from "lucide-react";
import { FEATURE_PILLARS, FEATURE_SECTION } from "@/pages/marketing/landingContent";
import { marketingCard } from "@/pages/marketing/marketingUi";

export function ProductModuleGrid() {
  return (
    <div>
      <p className="mb-6 text-center text-sm font-medium text-slate-600 sm:mb-8">
        {FEATURE_SECTION.workflowLabel}
      </p>
      <ol className="mb-8 hidden justify-center gap-2 sm:flex sm:flex-wrap sm:gap-3">
        {FEATURE_PILLARS.map(({ step, name }) => (
          <li
            key={step}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-[10px] font-bold text-white">
              {step}
            </span>
            <span className="max-w-[10rem] truncate sm:max-w-none">{name}</span>
          </li>
        ))}
      </ol>
      <ul className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:gap-7">
        {FEATURE_PILLARS.map(({ step, icon: Icon, name, detail, highlights }) => (
          <li
            key={step}
            className={`${marketingCard} flex h-full flex-col p-5 sm:p-6 transition-all duration-200 hover:border-teal-200/80 hover:shadow-md hover:shadow-teal-900/5`}
          >
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 ring-1 ring-teal-100">
                <Icon size={22} strokeWidth={2} aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                  Step {step}
                </p>
                <h3 className="mt-0.5 text-base font-semibold leading-snug text-slate-900 sm:text-lg">
                  {name}
                </h3>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-[15px]">{detail}</p>
            <ul className="mt-4 flex-1 space-y-2.5 border-t border-slate-100 pt-4">
              {highlights.map((line) => (
                <li key={line} className="flex gap-2.5 text-sm leading-snug text-slate-700">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-600 text-white"
                    aria-hidden
                  >
                    <Check size={12} strokeWidth={3} />
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-center text-sm text-slate-600">
        <a
          href="/#screens"
          className="font-medium text-teal-700 underline-offset-2 hover:text-teal-800 hover:underline"
        >
          See app screenshots
        </a>
        <span className="text-slate-400"> · </span>
        <a
          href="/#how-it-works"
          className="font-medium text-teal-700 underline-offset-2 hover:text-teal-800 hover:underline"
        >
          How it works
        </a>
      </p>
    </div>
  );
}
