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
  onClick?: () => void;
  className?: string;
};

export const KpiCard = ({ label, value, sub, variant = "default", onClick, className }: Props) => {
  const s = styles[variant];
  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
      className={cn(
        "rounded-xl p-4 shadow-card transition-transform",
        s.bg,
        onClick && "cursor-pointer hover:scale-[1.01] active:scale-100",
        className,
      )}
    >
      <div className={cn("mb-1 text-xs font-medium", s.label)}>{label}</div>
      <div className={cn("flex items-end justify-between gap-1")}>
        <span className={cn("text-xl font-semibold leading-tight", s.value)}>{value}</span>
        {onClick && <ChevronRight size={14} className={cn("mb-0.5 shrink-0", s.label)} />}
      </div>
      {sub && <div className={cn("mt-1 text-xs", s.label)}>{sub}</div>}
    </div>
  );
};
