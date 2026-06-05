import { Check } from "lucide-react";
import { PLAN_INCLUDES } from "@/pages/marketing/landingContent";

type Props = {
  className?: string;
};

/** Full plan checklist — always visible on pricing (two columns). */
export function PlanIncludesList({ className = "" }: Props) {
  return (
    <ul className={`mt-5 grid gap-3 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-3.5 ${className}`}>
      {PLAN_INCLUDES.map((line) => (
        <li key={line} className="flex gap-3 text-sm leading-snug text-slate-700 sm:text-[15px]">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-600 text-white">
            <Check size={12} strokeWidth={3} aria-hidden />
          </span>
          <span>{line}</span>
        </li>
      ))}
    </ul>
  );
}
