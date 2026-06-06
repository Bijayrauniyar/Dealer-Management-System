import { useState } from "react";
import { Plus } from "lucide-react";
import { FormField } from "@/components/app/FormField";
import { Select } from "@/components/ui/select";
import { AddUnitSheet } from "@/components/app/AddUnitSheet";

type Props = {
  units: string[];
  value: string;
  onChange: (value: string) => void;
  onUnitsChange: (units: string[]) => void;
  label?: string;
  hint?: string;
};

function mergeUnitOptions(units: string[], selected: string): string[] {
  const out = units.length ? [...units] : ["PCS"];
  if (selected && !out.some((u) => u.toLowerCase() === selected.toLowerCase())) out.push(selected);
  return out;
}

/** Base unit select + “Add unit” sheet (UNITS-1 — same pattern as categories). */
export function ProductUnitField({
  units,
  value,
  onChange,
  onUnitsChange,
  label = "Base unit",
  hint,
}: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const options = mergeUnitOptions(units, value);

  return (
    <>
      <FormField label={label} hint={hint}>
        <Select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
          {options.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </Select>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="mt-2 flex items-center gap-1 text-sm font-semibold text-teal-600 hover:text-teal-700"
        >
          <Plus size={14} />
          Add unit
        </button>
      </FormField>
      <AddUnitSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        existing={options}
        onSaved={(name, next) => {
          onUnitsChange(next);
          onChange(name);
        }}
      />
    </>
  );
}
