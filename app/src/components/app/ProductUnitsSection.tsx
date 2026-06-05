import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
type Props = {
  units: string[];
  onChange: (units: string[]) => void;
};

/** Settings: tenant product unit labels (UNITS-1). Saved with Settings → Save. */
export function ProductUnitsSection({ units, onChange }: Props) {
  const [draft, setDraft] = useState("");

  const addUnit = () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      toast.error("Enter a unit label.");
      return;
    }
    if (units.some((u) => u.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("That unit already exists.");
      return;
    }
    onChange([...units, trimmed]);
    setDraft("");
  };

  const handleRemove = (name: string) => {
    if (units.length <= 1) {
      toast.error("Keep at least one unit.");
      return;
    }
    onChange(units.filter((u) => u !== name));
  };

  return (
    <>
      <ul className="mb-3 space-y-1.5">
        {units.map((u) => (
          <li
            key={u}
            className="flex items-center justify-between gap-2 rounded-lg border border-border-subtle bg-white px-3 py-2.5"
          >
            <span className="text-sm font-medium text-foreground">{u}</span>
            {units.length > 1 && (
              <button
                type="button"
                className="rounded p-1.5 text-muted hover:bg-red-50 hover:text-danger disabled:opacity-40"
                aria-label={`Remove ${u}`}
                onClick={() => handleRemove(u)}
              >
                <Trash2 size={16} />
              </button>
            )}
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="e.g. Bag"
          className="h-10"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addUnit();
            }
          }}
        />
        <Button type="button" variant="outline" size="sm" className="shrink-0 gap-1" onClick={addUnit}>
          <Plus size={14} />
          Add
        </Button>
      </div>
    </>
  );
}
