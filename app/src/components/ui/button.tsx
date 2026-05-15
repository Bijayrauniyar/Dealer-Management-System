import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 disabled:opacity-50 disabled:pointer-events-none select-none",
  {
    variants: {
      variant: {
        primary:   "bg-teal-600 text-white hover:bg-teal-700 active:bg-teal-800",
        secondary: "bg-white border border-border-subtle text-foreground hover:bg-slate-50 active:bg-slate-100",
        ghost:     "text-teal-700 hover:bg-teal-50 active:bg-teal-100",
        danger:    "bg-danger text-white hover:bg-red-700 active:bg-red-800",
        outline:   "border border-teal-600 text-teal-700 hover:bg-teal-50",
      },
      size: {
        sm:   "h-8  px-3 text-xs",
        md:   "h-10 px-4 text-sm",
        lg:   "h-12 px-5 text-base",
        full: "h-12 w-full px-5 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type Props = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants> & {
  loading?: boolean;
};

export const Button = ({ className, variant, size, loading, children, disabled, ...props }: Props) => (
  <button
    className={cn(buttonVariants({ variant, size }), className)}
    disabled={disabled || loading}
    {...props}
  >
    {loading && (
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
    )}
    {children}
  </button>
);
