import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Pencil, Plus, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/app/PageShell";
import { FormPageHeader } from "@/components/app/patterns";
import { EmptyState } from "@/components/app/EmptyState";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MRP_STICKER_PRINT_ROOT_ID,
  MrpStickerSheet,
} from "@/components/app/MrpStickerSheet";
import {
  pagesNeeded,
  stickerSheetLayout,
  type MrpStickerDesign,
} from "@/lib/mrpSticker";
import {
  deleteMrpStickerDesignLive,
  fetchMrpStickerDesignsLive,
  markMrpStickerPrintedLive,
  upsertMrpStickerDesignLive,
} from "@/lib/live/domainLive";
import { printDocument } from "@/lib/printBill";
import { fmtDate } from "@/lib/utils";

export const MrpStickerListPage = () => {
  const navigate = useNavigate();
  const [designs, setDesigns] = useState<MrpStickerDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [printQueue, setPrintQueue] = useState<MrpStickerDesign[]>([]);
  const [deleting, setDeleting] = useState<MrpStickerDesign | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    void fetchMrpStickerDesignsLive()
      .then(setDesigns)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load designs"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  // Print after the off-screen sheet has rendered.
  useEffect(() => {
    if (!printQueue.length) return;
    const frame = requestAnimationFrame(() => {
      printDocument(MRP_STICKER_PRINT_ROOT_ID);
      void markMrpStickerPrintedLive(printQueue.map((d) => d.id)).catch(() => undefined);
      setPrintQueue([]);
    });
    return () => cancelAnimationFrame(frame);
  }, [printQueue]);

  const toggleSelect = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const printDesigns = (toPrint: MrpStickerDesign[]) => {
    if (!toPrint.length) return;
    setPrintQueue(toPrint);
    const pages = toPrint.reduce((s, d) => {
      const { perPage } = stickerSheetLayout(d.widthMm, d.heightMm);
      return s + pagesNeeded(d.qty, perPage);
    }, 0);
    toast.success(`Printing ${toPrint.length} design(s) — ${pages} page(s).`);
  };

  const handleDuplicate = async (design: MrpStickerDesign) => {
    setBusy(true);
    try {
      await upsertMrpStickerDesignLive({
        ...design,
        id: undefined,
        title: design.title,
      });
      toast.success("Design duplicated.");
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Duplicate failed");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await deleteMrpStickerDesignLive(deleting.id);
      setSelected((s) => {
        const next = new Set(s);
        next.delete(deleting.id);
        return next;
      });
      toast.success("Design deleted.");
      setDeleting(null);
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  const selectedDesigns = designs.filter((d) => selected.has(d.id));

  return (
    <PageShell>
      <FormPageHeader
        title="MRP stickers"
        subtitle="Design price labels once — print full A4 sheets and cut."
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => navigate("/app/mrp-stickers/new")}>
          <Plus size={14} /> New sticker
        </Button>
        {selectedDesigns.length > 0 && (
          <Button size="sm" variant="secondary" onClick={() => printDesigns(selectedDesigns)}>
            <Printer size={14} /> Print selected ({selectedDesigns.length})
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading designs…</p>
      ) : error ? (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-danger">{error}</p>
          </CardContent>
        </Card>
      ) : designs.length === 0 ? (
        <EmptyState
          title="No sticker designs yet"
          body="Create your first MRP sticker — title, lines, size — then print a full sheet."
          action={
            <Button size="sm" onClick={() => navigate("/app/mrp-stickers/new")}>
              New sticker
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {designs.map((design) => {
            const layout = stickerSheetLayout(design.widthMm, design.heightMm);
            const pages = pagesNeeded(design.qty, layout.perPage);
            return (
              <Card key={design.id}>
                <CardContent className="flex items-center gap-3 p-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 shrink-0 accent-teal-600"
                    checked={selected.has(design.id)}
                    onChange={() => toggleSelect(design.id)}
                    aria-label={`Select ${design.title}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {design.title}
                    </p>
                    <p className="text-[11px] text-muted">
                      {design.widthMm}×{design.heightMm} mm · {layout.perPage}/page · {pages} page
                      {pages > 1 ? "s" : ""} for {design.qty}
                      {design.lastPrintedAt
                        ? ` · printed ${fmtDate(design.lastPrintedAt.slice(0, 10))}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button type="button" variant="ghost" size="icon" title="Print"
                      disabled={busy} onClick={() => printDesigns([design])}>
                      <Printer size={15} />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" title="Edit"
                      disabled={busy}
                      onClick={() => navigate(`/app/mrp-stickers/edit/${design.id}`)}>
                      <Pencil size={15} />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" title="Duplicate"
                      disabled={busy} onClick={() => void handleDuplicate(design)}>
                      <Copy size={15} />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" title="Delete"
                      disabled={busy} onClick={() => setDeleting(design)}>
                      <Trash2 size={15} className="text-danger" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Off-screen sheet render for queued print */}
      {printQueue.length > 0 && (
        <div className="fixed -left-[9999px] top-0" aria-hidden>
          <MrpStickerSheet designs={printQueue} />
        </div>
      )}

      <ConfirmDialog
        open={deleting !== null}
        title="Delete sticker design?"
        description={deleting ? `"${deleting.title}" will be removed from history.` : undefined}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        loading={busy}
        onConfirm={() => void handleDelete()}
        onCancel={() => {
          if (!busy) setDeleting(null);
        }}
      />
    </PageShell>
  );
};
