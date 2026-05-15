import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & { error?: string };

export const Input = ({ className, error, ...props }: Props) => (
  <div className="w-full">
    <input
      className={cn(
        "h-11 w-full rounded-lg border border-border-subtle bg-white px-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500",
        "disabled:bg-slate-50 disabled:text-muted",
        error && "border-danger focus:ring-danger",
        className,
      )}
      {...props}
    />
    {error && <p className="mt-1 text-xs text-danger">{error}</p>}
  </div>
);
