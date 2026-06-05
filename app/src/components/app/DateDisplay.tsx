import { fmtDate, toMiti } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Props = {
  /** ISO date YYYY-MM-DD */
  iso: string;
  /** Show Bikram Sambat primary with AD in brackets */
  dual?: boolean;
  /** Tighter single-line style for lists and inline fields */
  compact?: boolean;
  className?: string;
  size?: "sm" | "md";
  /** Light text on teal/dark headers */
  variant?: "default" | "onDark";
};

/** Central date display — BS primary when dual, AD in muted brackets. */
export function DateDisplay({
  iso,
  dual = false,
  compact = false,
  className,
  size = "sm",
  variant = "default",
}: Props) {
  const bs = toMiti(iso);
  const ad = fmtDate(iso);
  const text = compact ? "text-[11px]" : size === "sm" ? "text-xs" : "text-sm";
  const primary = variant === "onDark" ? "text-white" : "text-foreground";
  const muted = variant === "onDark" ? "text-white/75" : "text-muted";

  if (!dual || bs === iso) {
    return <span className={cn(text, muted, className)}>{ad}</span>;
  }

  if (compact) {
    return (
      <span className={cn(text, "whitespace-nowrap", className)}>
        <span className={primary}>{bs}</span>
        <span className={muted}> ({ad})</span>
      </span>
    );
  }

  return (
    <span className={cn(text, className)}>
      <span className={cn("font-semibold", primary)}>{bs}</span>
      <span className={muted}> ({ad})</span>
    </span>
  );
}
