/**
 * SectionHeader – section title + optional "See all →" link.
 * Usage: <SectionHeader title="Top customers" onSeeAll={() => navigate(...)} />
 */
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  onSeeAll?: () => void;
  className?: string;
};

export const SectionHeader = ({ title, onSeeAll, className }: Props) => (
  <div className={cn("flex items-center justify-between", className)}>
    <h2 className="text-sm font-semibold text-foreground">{title}</h2>
    {onSeeAll && (
      <button
        onClick={onSeeAll}
        className="flex items-center gap-0.5 text-xs font-medium text-teal-600 hover:text-teal-700"
      >
        See all <ChevronRight size={13} />
      </button>
    )}
  </div>
);
