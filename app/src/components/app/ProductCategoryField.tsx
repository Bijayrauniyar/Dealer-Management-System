import { useState } from "react";
import { Plus } from "lucide-react";
import { FormField } from "@/components/app/FormField";
import { Select } from "@/components/ui/select";
import { AddCategorySheet } from "@/components/app/AddCategorySheet";

type Props = {
  categories: string[];
  value: string;
  onChange: (value: string) => void;
  onCategoriesChange: (categories: string[]) => void;
};

function mergeCategoryOptions(categories: string[], selected: string): string[] {
  const out = categories.length ? [...categories] : ["General"];
  if (selected && !out.includes(selected)) out.push(selected);
  return out;
}

/** Category select + “Add” opens bottom sheet (clean on mobile). */
export function ProductCategoryField({
  categories,
  value,
  onChange,
  onCategoriesChange,
}: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const options = mergeCategoryOptions(categories, value);

  return (
    <>
      <FormField label="Category">
        <Select value={value} onChange={(e) => onChange(e.target.value)} aria-label="Category">
          {options.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="mt-2 flex items-center gap-1 text-sm font-semibold text-teal-600 hover:text-teal-700"
        >
          <Plus size={14} />
          Add category
        </button>
      </FormField>
      <AddCategorySheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        existing={options}
        onSaved={(name, next) => {
          onCategoriesChange(next);
          onChange(name);
        }}
      />
    </>
  );
}
