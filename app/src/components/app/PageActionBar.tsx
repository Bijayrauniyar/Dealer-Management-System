/**
 * Fixed bottom action rows for detail screens (bill, etc.) — above bottom tabs.
 * Uses shared Button variants so primary/secondary match forms and lists.
 */
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PageAction = {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  /** Default `secondary` — same outline style for every action on the bar. */
  variant?: "primary" | "secondary" | "icon";
  disabled?: boolean;
  title?: string;
  /** Optional wider flex slot (layout only). */
  wide?: boolean;
  className?: string;
};

type Props = {
  rows: PageAction[][];
  disabled?: boolean;
  className?: string;
};

export function PageActionBar({ rows, disabled, className }: Props) {
  return (
    <div
      data-no-print
      className={cn(
        "fixed bottom-16 left-0 right-0 z-30 mx-auto max-w-xl border-t border-border-subtle bg-white/95 px-3 py-2 shadow-card-md backdrop-blur",
        className,
      )}
    >
      {rows.map((row, rowIdx) => (
        <div key={rowIdx} className={cn("flex gap-2", rowIdx > 0 && "mt-2")}>
          {row.map((action, i) => {
            const Icon = action.icon;
            const isIcon = action.variant === "icon";
            const variant =
              action.variant === "primary" ? "primary" : "secondary";

            return (
              <Button
                key={`${action.label}-${i}`}
                type="button"
                variant={variant}
                size={isIcon ? "icon" : "md"}
                disabled={disabled || action.disabled}
                onClick={action.onClick}
                title={action.title ?? action.label}
                aria-label={isIcon ? action.label : undefined}
                className={cn(
                  isIcon ? "shrink-0" : "flex-1 gap-1.5 py-2.5 text-xs font-semibold sm:text-sm",
                  action.wide && !isIcon && "flex-[1.4]",
                  action.className,
                )}
              >
                {Icon ? <Icon size={isIcon ? 14 : 16} className="shrink-0" aria-hidden /> : null}
                {!isIcon ? action.label : null}
              </Button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
