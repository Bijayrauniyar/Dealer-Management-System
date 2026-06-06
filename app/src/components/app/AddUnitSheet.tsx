import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BottomSheet } from "@/components/app/BottomSheet";
import { FormField } from "@/components/app/FormField";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { commitAppendProductUnit } from "@/store/domain";

type Props = {
  open: boolean;
  onClose: () => void;
  existing: string[];
  onSaved: (name: string, units: string[]) => void;
};

export function AddUnitSheet({ open, onClose, existing, onSaved }: Props) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setName("");
  }, [open]);

  const handleSave = async () => {
    const v = name.trim();
    if (!v) {
      toast.error("Enter a unit label.");
      return;
    }
    const exists = existing.some((u) => u.toLowerCase() === v.toLowerCase());
    if (exists) {
      onSaved(v, existing);
      onClose();
      return;
    }
    setSaving(true);
    try {
      const next = await commitAppendProductUnit(v);
      onSaved(v, next);
      onClose();
      toast.success("Unit added.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet open={open} title="Add unit" onClose={onClose}>
      <FormField label="Label" required hint="Short name — e.g. Bag, Drum, Piece">
        <Input
          autoFocus
          placeholder="e.g. Bag"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleSave();
            }
          }}
        />
      </FormField>
      <Button
        type="button"
        size="full"
        className="mt-4"
        onClick={() => void handleSave()}
        loading={saving}
        disabled={!name.trim()}
      >
        Save
      </Button>
    </BottomSheet>
  );
}
