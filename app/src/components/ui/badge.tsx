import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default:  "bg-slate-100 text-slate-700",
        teal:     "bg-teal-50   text-teal-700",
        success:  "bg-success-light  text-success-foreground",
        warning:  "bg-warning-light  text-warning-foreground",
        danger:   "bg-danger-light   text-danger-foreground",
        info:     "bg-info-light     text-info-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

type Props = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export const Badge = ({ className, variant, ...props }: Props) => (
  <span className={cn(badgeVariants({ variant }), className)} {...props} />
);
