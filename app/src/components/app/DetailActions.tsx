import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DetailActionItem = {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  /** Primary = teal filled; default = outline row with chevron */
  variant?: "primary" | "outline";
};

type Props = {
  actions: DetailActionItem[];
  className?: string;
};

/**
 * Stacked full-width actions on entity detail screens (product, customer, …).
 * Primary action first, then secondary — same pattern as Product detail.
 */
export function DetailActions({ actions, className }: Props) {
  if (actions.length === 0) return null;
  return (
    <div className={cn("space-y-2", className)}>
      {actions.map((action, i) => {
        const isPrimary = action.variant === "primary";
        return (
          <Button
            key={`${action.label}-${i}`}
            type="button"
            variant={isPrimary ? "primary" : "outline"}
            className="h-11 w-full justify-between px-4"
            onClick={action.onClick}
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <action.icon size={16} />
              {action.label}
            </span>
            <ChevronRight size={16} className="opacity-70" />
          </Button>
        );
      })}
    </div>
  );
}
