import { cn } from "@/lib/utils";
import type { SelectHTMLAttributes } from "react";

type Props = SelectHTMLAttributes<HTMLSelectElement> & { error?: string };

export const Select = ({ className, error, children, ...props }: Props) => (
  <div className="w-full">
    <select
      className={cn(
        "h-11 w-full appearance-none rounded-lg border border-border-subtle bg-white px-3 pr-8 text-sm text-foreground transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500",
        "disabled:bg-slate-50",
        error && "border-danger",
        className,
      )}
      {...props}
    >
      {children}
    </select>
    {error && <p className="mt-1 text-xs text-danger">{error}</p>}
  </div>
);
