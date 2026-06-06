import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type RowProps = {
  title: string;
  /** One muted meta line (stock, area, dates, …) */
  subtitle?: string;
  badge?: ReactNode;
  trailing?: ReactNode;
  accent?: "teal" | "danger" | "none";
  onClick: () => void;
  className?: string;
};

/** Compact tappable row — 2 lines max, mobile-friendly density. */
export function EntityListCard({
  title,
  subtitle,
  badge,
  trailing,
  accent = "teal",
  onClick,
  className,
}: RowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 border-b border-border-subtle py-2.5 text-left last:border-0",
        "active:bg-slate-50 transition-colors",
        className,
      )}
    >
      {accent !== "none" ? (
        <div
          className={cn(
            "w-0.5 shrink-0 self-stretch rounded-full min-h-[2rem]",
            accent === "danger" ? "bg-red-400" : "bg-teal-400",
          )}
        />
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-[13px] font-semibold leading-tight text-foreground">{title}</p>
          {badge}
        </div>
        {subtitle ? (
          <p className="mt-0.5 truncate text-[11px] leading-snug text-muted">{subtitle}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {trailing}
        <ChevronRight size={13} className="text-muted" />
      </div>
    </button>
  );
}

/** Single card wrapper — divided rows (saves vertical space vs separate cards). */
export function EntityList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Card className={cn("shadow-sm", className)}>
      <CardContent className="px-3 py-0">{children}</CardContent>
    </Card>
  );
}
