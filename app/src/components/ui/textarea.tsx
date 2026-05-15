import { cn } from "@/lib/utils";
import type { TextareaHTMLAttributes } from "react";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string };

export const Textarea = ({ className, error, ...props }: Props) => (
  <div className="w-full">
    <textarea
      rows={3}
      className={cn(
        "w-full rounded-lg border border-border-subtle bg-white px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors resize-none",
        "focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500",
        error && "border-danger",
        className,
      )}
      {...props}
    />
    {error && <p className="mt-1 text-xs text-danger">{error}</p>}
  </div>
);
