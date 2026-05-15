import { cn } from "@/lib/utils";
import type { LabelHTMLAttributes } from "react";

export const Label = ({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={cn("block text-sm font-medium text-foreground", className)} {...props} />
);
