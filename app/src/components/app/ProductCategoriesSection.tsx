import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AddCategorySheet } from "@/components/app/AddCategorySheet";
import { Button } from "@/components/ui/button";
import { commitRemoveProductCategory } from "@/store/domain";

type Props = {
  categories: string[];
  onChange: (categories: string[]) => void;
};

/** Settings: list categories, add via sheet, remove unused labels. */
export function ProductCategoriesSection({ categories, onChange }: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const handleRemove = async (name: string) => {
    setRemoving(name);
    try {
      const next = await commitRemoveProductCategory(name);
      onChange(next);
      toast.success(`Removed “${name}”.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not remove");
    } finally {
      setRemoving(null);
    }
  };

  return (
    <>
      <ul className="mb-3 space-y-1.5">
        {categories.map((c) => (
          <li
            key={c}
            className="flex items-center justify-between gap-2 rounded-lg border border-border-subtle bg-white px-3 py-2.5"
          >
            <span className="text-sm font-medium text-foreground">{c}</span>
            {categories.length > 1 && (
              <button
                type="button"
                className="rounded p-1.5 text-muted hover:bg-red-50 hover:text-danger disabled:opacity-40"
                aria-label={`Remove ${c}`}
                disabled={removing === c}
                onClick={() => void handleRemove(c)}
              >
                <Trash2 size={16} />
              </button>
            )}
          </li>
        ))}
      </ul>
      <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => setSheetOpen(true)}>
        <Plus size={14} />
        Add category
      </Button>
      <AddCategorySheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        existing={categories}
        onSaved={(_name, next) => onChange(next)}
      />
    </>
  );
}
