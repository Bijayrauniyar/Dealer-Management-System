/**
 * KpiCard – dashboard metric tile.
 *
 * variant:
 *   default  → white
 *   success  → green tint  (positive profit, paid)
 *   warning  → orange tint (pending / customer due)
 *   danger   → red tint    (damage, negative profit)
 *   info     → blue tint   (supplier payable)
 */
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

type Variant = "default" | "success" | "warning" | "danger" | "info";

const styles: Record<Variant, { bg: string; label: string; value: string }> = {
  default: {
    bg:    "bg-white border border-border-subtle",
    label: "text-muted",
    value: "text-foreground",
  },
  success: {
    bg:    "bg-success-light border border-success/20",
    label: "text-success-foreground/70",
    value: "text-success-foreground",
  },
  warning: {
    bg:    "bg-warning-light border border-warning/20",
    label: "text-warning-foreground/70",
    value: "text-warning-foreground",
  },
  danger: {
    bg:    "bg-danger-light border border-danger/20",
    label: "text-danger-foreground/70",
    value: "text-danger-foreground",
  },
  info: {
    bg:    "bg-info-light border border-info/20",
    label: "text-info-foreground/70",
    value: "text-info-foreground",
  },
};

type Props = {
  label: string;
  value: string | number;
  sub?: string | ReactNode;
  variant?: Variant;
  size?: "default" | "compact";
  onClick?: () => void;
  className?: string;
};

export const KpiCard = ({
  label,
  value,
  sub,
  variant = "default",
  size = "default",
  onClick,
  className,
}: Props) => {
  const s = styles[variant];
  const compact = size === "compact";
  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
      className={cn(
        "min-w-0 rounded-xl shadow-card transition-transform",
        compact ? "p-2" : "p-3 sm:p-4",
        s.bg,
        onClick && "cursor-pointer hover:scale-[1.01] active:scale-100",
        className,
      )}
    >
      <div
        className={cn(
          "font-medium leading-none",
          compact ? "text-[9px]" : "mb-0.5 text-[10px] sm:mb-1 sm:text-xs",
          s.label,
        )}
      >
        {label}
      </div>
      <div className="flex items-end justify-between gap-0.5">
        <span
          className={cn(
            "truncate font-semibold leading-tight tabular-nums",
            compact ? "text-xs" : "text-base sm:text-xl",
            s.value,
          )}
          title={typeof value === "string" ? value : String(value)}
        >
          {value}
        </span>
        {onClick && <ChevronRight size={compact ? 12 : 14} className={cn("mb-0.5 shrink-0", s.label)} />}
      </div>
      {sub && (
        <div className={cn("mt-0.5 truncate leading-tight", compact ? "text-[9px]" : "mt-1 text-xs", s.label)}>
          {sub}
        </div>
      )}
    </div>
  );
};
