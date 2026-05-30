import { cn } from "@/lib/utils";

export type FilterSortOption = { value: string; label: string };

type Props = {
  label: string;
  value: string;
  options: FilterSortOption[];
  onChange: (value: string) => void;
};

/** Horizontal pill row — matches filter chips, not a full-width dropdown. */
export function FilterSortBar({ label, value, options, onChange }: Props) {
  return (
    <div className="mb-3">
      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted">{label}</p>
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "shrink-0 rounded-full border px-2.5 py-1.5 text-[11px] font-semibold transition-colors",
              value === opt.value
                ? "border-teal-600 bg-teal-600 text-white"
                : "border-border-subtle bg-white text-muted hover:border-teal-300",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
