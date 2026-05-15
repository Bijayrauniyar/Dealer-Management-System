/**
 * ListRow – a tappable row for lists (customers, products, transactions …).
 * Pass `onClick` to make it a navigate-to action.
 */
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Props = {
  left: ReactNode;       // main content (name, date, …)
  right?: ReactNode;     // amount / badge on the right
  sub?: ReactNode;       // muted sub-line below left
  onClick?: () => void;
  className?: string;
  /** Show a divider below the row */
  divider?: boolean;
};

export const ListRow = ({ left, right, sub, onClick, className, divider = true }: Props) => (
  <div
    role={onClick ? "button" : undefined}
    tabIndex={onClick ? 0 : undefined}
    onClick={onClick}
    onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
    className={cn(
      "flex items-center justify-between gap-3 py-3",
      divider && "border-b border-border-subtle last:border-0",
      onClick && "cursor-pointer hover:bg-slate-50 active:bg-slate-100 -mx-4 px-4 rounded-lg transition-colors",
      className,
    )}
  >
    <div className="min-w-0 flex-1">
      <div className="truncate text-sm font-medium text-foreground">{left}</div>
      {sub && <div className="mt-0.5 truncate text-xs text-muted">{sub}</div>}
    </div>
    <div className="flex shrink-0 items-center gap-1">
      {right && <span className="text-sm font-semibold text-foreground">{right}</span>}
      {onClick && <ChevronRight size={14} className="text-muted-foreground" />}
    </div>
  </div>
);
