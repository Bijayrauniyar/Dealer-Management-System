import { FormField } from "@/components/app/FormField";
import { DateDisplay } from "@/components/app/DateDisplay";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string;
  onChange: (iso: string) => void;
  required?: boolean;
  hint?: string;
  className?: string;
  inputClassName?: string;
  /** Tighter label + field for cards (e.g. balance due). */
  dense?: boolean;
};

/** Date picker (AD) with BS+AD on one line below — always visible after selection. */
export function DateFormField({
  label,
  value,
  onChange,
  required,
  hint,
  className,
  inputClassName,
  dense = false,
}: Props) {
  return (
    <FormField
      label={label}
      required={required}
      hint={hint}
      className={cn(dense && "space-y-1", className)}
    >
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full rounded-lg border border-border-subtle bg-white text-sm text-foreground",
          dense ? "h-10 px-2.5" : "h-11 px-3",
          "focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500",
          inputClassName,
        )}
      />
      {value ? (
        <p className={cn("text-[11px] leading-tight text-muted", dense ? "mt-0.5" : "mt-1")}>
          <DateDisplay iso={value} dual compact />
        </p>
      ) : null}
    </FormField>
  );
}
