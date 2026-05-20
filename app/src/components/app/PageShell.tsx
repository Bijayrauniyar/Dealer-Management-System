/**
 * PageShell – wraps every page with consistent padding + bottom space
 * so content doesn't hide behind the fixed tab bar.
 */
import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  /** Extra bottom padding when a StickyBar is present */
  stickyBar?: boolean;
};

export const PageShell = ({ className, stickyBar, ...props }: Props) => (
  <div
    className={cn(
      "mx-auto w-full max-w-xl px-4 pt-4",
      stickyBar ? "pb-32" : "pb-28",
      className,
    )}
    {...props}
  />
);
