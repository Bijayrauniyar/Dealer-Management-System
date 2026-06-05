import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  page: number;
  totalPages: number;
  total: number;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  showingLabel?: string;
  className?: string;
};

/** Compact prev / next below lists (hidden when everything fits on one page). */
export function ListPagination({
  page,
  totalPages,
  total,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  showingLabel,
  className,
}: Props) {
  if (total === 0) return null;

  const multiPage = totalPages > 1;
  if (!multiPage && !showingLabel) return null;

  return (
    <div
      className={cn(
        "mt-2 flex items-center justify-between gap-2 px-1 py-1 text-[11px] text-muted",
        className,
      )}
    >
      {multiPage ? (
        <button
          type="button"
          onClick={onPrev}
          disabled={!hasPrev}
          aria-label="Previous page"
          className={cn(
            "inline-flex items-center gap-0.5 rounded-md px-1.5 py-1 font-medium transition-colors",
            hasPrev ? "text-teal-600 hover:bg-teal-50" : "cursor-not-allowed opacity-35",
          )}
        >
          <ChevronLeft size={14} />
          Prev
        </button>
      ) : (
        <span />
      )}

      <span className="shrink-0 tabular-nums">
        {showingLabel ?? (multiPage ? `${page} / ${totalPages}` : null)}
      </span>

      {multiPage ? (
        <button
          type="button"
          onClick={onNext}
          disabled={!hasNext}
          aria-label="Next page"
          className={cn(
            "inline-flex items-center gap-0.5 rounded-md px-1.5 py-1 font-medium transition-colors",
            hasNext ? "text-teal-600 hover:bg-teal-50" : "cursor-not-allowed opacity-35",
          )}
        >
          Next
          <ChevronRight size={14} />
        </button>
      ) : (
        <span />
      )}
    </div>
  );
}
