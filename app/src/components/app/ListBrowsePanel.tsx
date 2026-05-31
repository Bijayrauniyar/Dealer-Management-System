import { Download, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select } from "@/components/ui/select";
import type { FilterSortOption } from "@/components/app/FilterSortBar";

export type BrowseFilterOption = {
  value: string;
  label: string;
};

export type BrowseExtraFilter = {
  label: string;
  value: string;
  options: BrowseFilterOption[];
  onChange: (value: string) => void;
};

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  filterValue: string;
  filterOptions: BrowseFilterOption[];
  onFilterChange: (value: string) => void;
  filterLabel?: string;
  /** Second dimension — e.g. Area (customers) or Category (stock/products). */
  extraFilter?: BrowseExtraFilter;
  sortValue?: string;
  sortOptions?: FilterSortOption[];
  onSortChange?: (value: string) => void;
  summary?: string;
  /** Export full filtered list (all pages), not only rows visible on screen. */
  onExport?: () => void;
  /** Shown on export button, e.g. 34 → "Export all (34)". */
  exportCount?: number;
  exportDisabled?: boolean;
  className?: string;
};

function FilterField({
  label,
  value,
  options,
  onChange,
  ariaLabel,
}: {
  label: string;
  value: string;
  options: BrowseFilterOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted">
        {label}
      </label>
      <Select
        className="h-10 text-xs"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
    </div>
  );
}

/** Search + filter/sort dropdowns in one card — list + pagination sit below. */
export function ListBrowsePanel({
  search,
  onSearchChange,
  searchPlaceholder,
  filterValue,
  filterOptions,
  onFilterChange,
  filterLabel = "Filter",
  extraFilter,
  sortValue,
  sortOptions,
  onSortChange,
  summary,
  onExport,
  exportCount,
  exportDisabled,
  className,
}: Props) {
  const hasSort = sortOptions != null && sortOptions.length > 1 && sortValue != null && onSortChange;

  return (
    <div
      className={cn(
        "mb-4 overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-sm",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-border-subtle px-3 py-2.5 focus-within:ring-2 focus-within:ring-inset focus-within:ring-teal-500/40">
        <Search size={15} className="shrink-0 text-muted" aria-hidden />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted/60"
          aria-label="Search list"
        />
        {search ? (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="shrink-0 rounded-full p-1 text-muted hover:bg-slate-100 hover:text-foreground"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        ) : null}
      </div>

      <div className="space-y-2 px-3 py-3">
        <div
          className={cn(
            "grid gap-2",
            extraFilter ? "grid-cols-2" : hasSort ? "grid-cols-2" : "grid-cols-1",
          )}
        >
          <FilterField
            label={filterLabel}
            value={filterValue}
            options={filterOptions}
            onChange={onFilterChange}
            ariaLabel={filterLabel}
          />
          {extraFilter ? (
            <FilterField
              label={extraFilter.label}
              value={extraFilter.value}
              options={extraFilter.options}
              onChange={extraFilter.onChange}
              ariaLabel={extraFilter.label}
            />
          ) : hasSort ? (
            <FilterField
              label="Sort"
              value={sortValue}
              options={sortOptions}
              onChange={onSortChange}
              ariaLabel="Sort list"
            />
          ) : null}
        </div>
        {extraFilter && hasSort ? (
          <FilterField
            label="Sort"
            value={sortValue}
            options={sortOptions}
            onChange={onSortChange}
            ariaLabel="Sort list"
          />
        ) : null}
      </div>

      {summary || onExport ? (
        <div className="flex items-center justify-between gap-2 border-t border-border-subtle px-3 py-2">
          {summary ? (
            <p className="text-[11px] text-muted tabular-nums">{summary}</p>
          ) : (
            <span />
          )}
          {onExport ? (
            <button
              type="button"
              disabled={exportDisabled}
              onClick={onExport}
              className="flex shrink-0 items-center gap-1 rounded-lg border border-border-subtle px-2.5 py-1.5 text-[11px] font-semibold text-teal-600 hover:bg-teal-50 disabled:opacity-40"
            >
              <Download size={13} />
              {exportCount != null && exportCount > 0
                ? `Export all (${exportCount})`
                : "Export all"}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
