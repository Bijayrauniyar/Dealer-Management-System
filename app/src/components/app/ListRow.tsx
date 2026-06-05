/**
 * ListRow – compact tappable row for transactions, reports, period lists.
 */
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Props = {
  left: ReactNode;
  right?: ReactNode;
  sub?: ReactNode;
  onClick?: () => void;
  className?: string;
  divider?: boolean;
};

export const ListRow = ({ left, right, sub, onClick, className, divider = true }: Props) => (
  <div
    role={onClick ? "button" : undefined}
    tabIndex={onClick ? 0 : undefined}
    onClick={onClick}
    onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
    className={cn(
      "flex items-center justify-between gap-2 py-2.5",
      divider && "border-b border-border-subtle last:border-0",
      onClick && "cursor-pointer active:bg-slate-50 transition-colors",
      className,
    )}
  >
    <div className="min-w-0 flex-1">
      <div className="truncate text-[13px] font-semibold leading-tight text-foreground">{left}</div>
      {sub ? <div className="mt-0.5 truncate text-[11px] leading-snug text-muted">{sub}</div> : null}
    </div>
    <div className="flex shrink-0 items-center gap-1">
      {right}
      {onClick ? <ChevronRight size={13} className="text-muted" /> : null}
    </div>
  </div>
);
