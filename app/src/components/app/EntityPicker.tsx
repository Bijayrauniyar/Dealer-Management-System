/**
 * EntityPicker – search + select a customer / product / supplier.
 *
 * - Filters the `options` list as you type.
 * - Shows "+ New {entity}" option to inline-create (calls onCreateNew).
 * - In demo mode wires to the dummy data arrays.
 *
 * Usage:
 *   <EntityPicker
 *     placeholder="Search customers"
 *     options={customers.map(c => ({ id: c.id, label: c.name, sub: c.area }))}
 *     value={selectedId}
 *     onChange={setSelectedId}
 *     entityLabel="customer"
 *     onCreateNew={() => navigate("/app/customers/new")}
 *   />
 */
import { useState, useRef } from "react";
import { Search, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export type PickerOption = {
  id: string;
  label: string;
  sub?: string;
};

type Props = {
  placeholder?: string;
  options: PickerOption[];
  value?: string;
  onChange: (id: string, option: PickerOption) => void;
  onClear?: () => void;
  entityLabel?: string;
  onCreateNew?: () => void;
  disabled?: boolean;
  className?: string;
};

export const EntityPicker = ({
  placeholder = "Search…",
  options,
  value,
  onChange,
  onClear,
  entityLabel = "item",
  onCreateNew,
  disabled,
  className,
}: Props) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.id === value);

  const filtered = query.trim()
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(query.toLowerCase()) ||
          o.sub?.toLowerCase().includes(query.toLowerCase()),
      )
    : options.slice(0, 20); // show first 20 when no query

  const handleSelect = (opt: PickerOption) => {
    onChange(opt.id, opt);
    setQuery("");
    setOpen(false);
  };

  const handleClear = () => {
    setQuery("");
    setOpen(false);
    onClear?.();
    inputRef.current?.focus();
  };

  if (selected && !open) {
    return (
      <div
        className={cn(
          "flex h-11 items-center justify-between rounded-lg border border-border-subtle bg-white px-3 text-sm",
          disabled ? "opacity-50" : "cursor-pointer hover:bg-slate-50",
          className,
        )}
        onClick={() => !disabled && setOpen(true)}
      >
        <span className="truncate font-medium text-foreground">{selected.label}</span>
        {!disabled && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleClear(); }}
            className="ml-2 rounded p-0.5 hover:bg-slate-100"
          >
            <X size={14} className="text-muted" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <div className="flex h-11 items-center gap-2 rounded-lg border border-border-subtle bg-white px-3 focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500">
        <Search size={14} className="shrink-0 text-muted" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-border-subtle bg-white shadow-card-md">
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.map((opt) => (
              <li key={opt.id}>
                <button
                  type="button"
                  className="flex w-full flex-col px-4 py-2.5 text-left hover:bg-slate-50 active:bg-slate-100"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(opt)}
                >
                  <span className="text-sm font-medium text-foreground">{opt.label}</span>
                  {opt.sub && <span className="text-xs text-muted">{opt.sub}</span>}
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-4 py-3 text-sm text-muted">No results</li>
            )}
          </ul>
          {onCreateNew && (
            <div className="border-t border-border-subtle p-1">
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-teal-700 hover:bg-teal-50"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { setOpen(false); onCreateNew(); }}
              >
                <Plus size={14} /> Add new {entityLabel}
              </button>
            </div>
          )}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}
    </div>
  );
};
