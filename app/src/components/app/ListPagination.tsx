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

/** Prev / next controls below a list (hidden when everything fits on one page). */
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

  return (
    <div
      className={cn(
        "mt-3 flex flex-col gap-2 rounded-xl border border-border-subtle bg-white px-3 py-2.5",
        className,
      )}
    >
      <p className="text-center text-[11px] text-muted tabular-nums">
        {showingLabel ?? `Page ${page} of ${totalPages}`}
      </p>
      {multiPage ? (
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onPrev}
            disabled={!hasPrev}
            className={cn(
              "flex flex-1 items-center justify-center gap-1 rounded-lg border py-2 text-sm font-medium transition-colors",
              hasPrev
                ? "border-border-subtle text-teal-600 hover:bg-teal-50"
                : "border-transparent text-muted/40 cursor-not-allowed",
            )}
          >
            <ChevronLeft size={16} /> Previous
          </button>
          <span className="shrink-0 px-2 text-xs font-semibold text-muted tabular-nums">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={onNext}
            disabled={!hasNext}
            className={cn(
              "flex flex-1 items-center justify-center gap-1 rounded-lg border py-2 text-sm font-medium transition-colors",
              hasNext
                ? "border-border-subtle text-teal-600 hover:bg-teal-50"
                : "border-transparent text-muted/40 cursor-not-allowed",
            )}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
