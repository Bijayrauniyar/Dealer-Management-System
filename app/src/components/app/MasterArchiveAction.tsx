import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";

type Props = {
  entityLabel: string;
  isActive: boolean;
  onSetActive: (active: boolean) => Promise<void>;
  blockArchiveReason?: string;
  /** Called after a successful archive (not restore). e.g. navigate back to the list. */
  onArchived?: () => void;
};

/** DEL-1: Archive / Restore on master detail screens (no hard delete). */
export function MasterArchiveAction({
  entityLabel,
  isActive,
  onSetActive,
  blockArchiveReason,
  onArchived,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const archiving = isActive;
  const title = archiving ? `Archive ${entityLabel}?` : `Restore ${entityLabel}?`;
  const description = archiving
    ? `This ${entityLabel} will be hidden from billing and pickers. You can restore it anytime from More → Archives.`
    : `This ${entityLabel} will appear on active lists and pickers again.`;

  const run = async () => {
    setBusy(true);
    try {
      await onSetActive(!isActive);
      setConfirmOpen(false);
      toast.success(archiving ? "Archived." : "Restored.");
      if (archiving) onArchived?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : archiving ? "Could not archive." : "Could not restore.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={busy}
        onClick={() => {
          if (archiving && blockArchiveReason) {
            toast.error(blockArchiveReason);
            return;
          }
          setConfirmOpen(true);
        }}
      >
        {isActive ? `Archive ${entityLabel}` : `Restore ${entityLabel}`}
      </Button>

      <ConfirmDialog
        open={confirmOpen}
        title={title}
        description={description}
        confirmLabel={archiving ? "Archive" : "Restore"}
        cancelLabel="Cancel"
        confirmVariant={archiving ? "danger" : "primary"}
        loading={busy}
        onConfirm={() => void run()}
        onCancel={() => {
          if (!busy) setConfirmOpen(false);
        }}
      />
    </>
  );
}
