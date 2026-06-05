import { Plus } from "lucide-react";
import type { LandingFaqItem } from "@/pages/marketing/landingFaq";

type Props = {
  items: LandingFaqItem[];
  /** `page` = full /faq layout width */
  variant?: "landing" | "page";
};

export function FaqAccordionList({ items, variant = "landing" }: Props) {
  return (
    <ul className="w-full space-y-3">
      {items.map((item) => (
        <li key={item.question}>
          <details className="group rounded-xl border border-slate-200 bg-white transition-colors open:border-slate-300 open:shadow-sm">
            <summary className="flex cursor-pointer list-none items-start gap-3 px-3 py-3.5 text-left sm:items-center sm:gap-4 sm:px-5 sm:py-5 [&::-webkit-details-marker]:hidden">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 transition-colors group-open:border-teal-200 group-open:bg-teal-50 group-open:text-teal-800"
                aria-hidden
              >
                <Plus
                  size={18}
                  strokeWidth={2}
                  className="transition-transform duration-200 group-open:rotate-45"
                />
              </span>
              <span className="min-w-0 flex-1 text-[15px] font-medium leading-snug text-slate-900 sm:text-base sm:leading-normal lg:text-lg">
                {item.question}
              </span>
            </summary>
            <div className="border-t border-slate-100 px-3 pb-4 pt-1 sm:px-5 sm:pb-6 sm:pl-[4.25rem]">
              {item.answer ? (
                <p className="pt-3 text-sm leading-relaxed text-slate-600 sm:text-[15px]">{item.answer}</p>
              ) : null}
              {item.bullets?.length ? (
                <ul
                  className={`space-y-2 text-sm leading-relaxed text-slate-600 sm:text-[15px] ${item.answer ? "mt-3 list-disc pl-5" : "mt-3 list-disc pl-5"}`}
                >
                  {item.bullets.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </details>
        </li>
      ))}
    </ul>
  );
}
