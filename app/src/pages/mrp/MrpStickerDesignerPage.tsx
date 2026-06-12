import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/app/PageShell";
import { FormPageHeader } from "@/components/app/patterns";
import { FormField } from "@/components/app/FormField";
import { NumericInput } from "@/components/app/NumericInput";
import { StickyBar } from "@/components/app/StickyBar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  MRP_STICKER_PRINT_ROOT_ID,
  MrpStickerLabel,
  MrpStickerSheet,
} from "@/components/app/MrpStickerSheet";
import {
  DEFAULT_STICKER_DRAFT,
  pagesNeeded,
  presetForSize,
  STICKER_PRESETS,
  stickerSheetLayout,
  suggestedFontSizes,
  type MrpStickerAlign,
  type MrpStickerDraft,
  type StickerPresetId,
} from "@/lib/mrpSticker";
import {
  fetchMrpStickerDesignsLive,
  markMrpStickerPrintedLive,
  upsertMrpStickerDesignLive,
} from "@/lib/live/domainLive";
import { printDocument } from "@/lib/printBill";

export const MrpStickerDesignerPage = () => {
  const navigate = useNavigate();
  const { designId } = useParams<{ designId?: string }>();
  const isEdit = Boolean(designId);

  const [draft, setDraft] = useState<MrpStickerDraft>({ ...DEFAULT_STICKER_DRAFT, lines: [""] });
  const [fontsTouched, setFontsTouched] = useState(false);
  const [qtyTouched, setQtyTouched] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit || !designId) return;
    let cancelled = false;
    void fetchMrpStickerDesignsLive()
      .then((designs) => {
        if (cancelled) return;
        const found = designs.find((d) => d.id === designId);
        if (!found) {
          setLoadError("Sticker design not found.");
          return;
        }
        setDraft({ ...found, lines: found.lines.length ? found.lines : [""] });
        setFontsTouched(true);
        setQtyTouched(true);
      })
      .catch((e) => {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Could not load design");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isEdit, designId]);

  const patch = (p: Partial<MrpStickerDraft>) => setDraft((d) => ({ ...d, ...p }));

  const applySize = (widthMm: number, heightMm: number) => {
    // Auto-suggest fonts and one-full-page qty until the user sets them manually.
    const fonts = fontsTouched ? {} : suggestedFontSizes(widthMm, heightMm);
    const qty = qtyTouched ? {} : { qty: stickerSheetLayout(widthMm, heightMm).perPage };
    patch({ widthMm, heightMm, ...fonts, ...qty });
  };

  const handlePreset = (id: StickerPresetId) => {
    if (id === "custom") return;
    const preset = STICKER_PRESETS.find((p) => p.id === id);
    if (preset) applySize(preset.widthMm, preset.heightMm);
  };

  const setLine = (i: number, value: string) =>
    patch({ lines: draft.lines.map((l, idx) => (idx === i ? value : l)) });
  const addLine = () => patch({ lines: [...draft.lines, ""] });
  const removeLine = (i: number) => patch({ lines: draft.lines.filter((_, idx) => idx !== i) });
  const moveLine = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= draft.lines.length) return;
    const next = [...draft.lines];
    [next[i], next[j]] = [next[j], next[i]];
    patch({ lines: next });
  };

  const layout = useMemo(
    () => stickerSheetLayout(draft.widthMm, draft.heightMm),
    [draft.widthMm, draft.heightMm],
  );
  const pages = pagesNeeded(draft.qty, layout.perPage);
  const preset = presetForSize(draft.widthMm, draft.heightMm);

  const validate = (): boolean => {
    if (!draft.title.trim()) {
      toast.error("Enter a sticker title, e.g. MRP NRS 95/-");
      return false;
    }
    return true;
  };

  const save = async (): Promise<string | null> => {
    if (!validate()) return null;
    setSaving(true);
    try {
      const id = await upsertMrpStickerDesignLive(draft);
      if (!draft.id) patch({ id });
      return id;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save design");
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    const id = await save();
    if (id) {
      toast.success("Sticker design saved.");
      navigate("/app/mrp-stickers", { replace: true });
    }
  };

  const handlePrint = async () => {
    const id = await save();
    if (!id) return;
    printDocument(MRP_STICKER_PRINT_ROOT_ID);
    void markMrpStickerPrintedLive([id]).catch(() => undefined);
    toast.success(`Printing ${pages} page(s) — ${layout.perPage} stickers per page.`);
  };

  if (loading) {
    return (
      <PageShell>
        <p className="text-sm text-muted">Loading design…</p>
      </PageShell>
    );
  }

  if (loadError) {
    return (
      <PageShell>
        <FormPageHeader backTo="/app/mrp-stickers" backLabel="MRP stickers" title="Sticker design" />
        <p className="text-sm text-danger">{loadError}</p>
      </PageShell>
    );
  }

  return (
    <PageShell stickyBar>
      <FormPageHeader
        backTo="/app/mrp-stickers"
        backLabel="MRP stickers"
        title={isEdit ? "Edit MRP sticker" : "New MRP sticker"}
        subtitle="Design once — prints as a full A4 sheet to cut."
      />

      <div className="space-y-4">
        <FormField label="Sticker title" required hint="e.g. MRP NRS 95/- or SALE PRICE NRS 150/-">
          <Input
            value={draft.title}
            placeholder="MRP NRS 95/-"
            onChange={(e) => patch({ title: e.target.value })}
          />
        </FormField>

        <Card>
          <CardContent className="space-y-2 p-4">
            <p className="text-sm font-medium text-foreground">Description lines (optional)</p>
            <p className="text-xs text-muted">
              Importer, company, Exim code, batch no., made in — any lines you need.
            </p>
            {draft.lines.map((line, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <Input
                  className="h-9 flex-1 text-sm"
                  value={line}
                  placeholder={i === 0 ? "Imported & Distributed By:" : `Line ${i + 1}`}
                  onChange={(e) => setLine(i, e.target.value)}
                />
                <Button type="button" variant="ghost" size="icon" aria-label="Move up"
                  disabled={i === 0} onClick={() => moveLine(i, -1)}>
                  <ArrowUp size={14} />
                </Button>
                <Button type="button" variant="ghost" size="icon" aria-label="Move down"
                  disabled={i === draft.lines.length - 1} onClick={() => moveLine(i, 1)}>
                  <ArrowDown size={14} />
                </Button>
                <Button type="button" variant="ghost" size="icon" aria-label="Remove line"
                  onClick={() => removeLine(i)}>
                  <Trash2 size={14} className="text-danger" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="ghost" size="sm" onClick={addLine}>
              <Plus size={14} /> Add line
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-4">
            <p className="text-sm font-medium text-foreground">Size & style</p>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Sticker size">
                <Select
                  value={preset}
                  onChange={(e) => handlePreset(e.target.value as StickerPresetId)}
                >
                  {STICKER_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                  <option value="custom">Custom (mm)</option>
                </Select>
              </FormField>
              <FormField label="Border">
                <Select
                  value={draft.border ? "yes" : "no"}
                  onChange={(e) => patch({ border: e.target.value === "yes" })}
                >
                  <option value="yes">Border (easy cutting)</option>
                  <option value="no">No border</option>
                </Select>
              </FormField>
              <FormField label="Width (mm)">
                <NumericInput min={10} max={186} allowDecimal decimalPlaces={1} value={draft.widthMm}
                  onChange={(v) => applySize(v || 10, draft.heightMm)} />
              </FormField>
              <FormField label="Height (mm)">
                <NumericInput min={6} max={263} allowDecimal decimalPlaces={1} value={draft.heightMm}
                  onChange={(v) => applySize(draft.widthMm, v || 6)} />
              </FormField>
              <FormField label="Title font (pt)">
                <NumericInput min={5} max={60} allowDecimal decimalPlaces={1} value={draft.titleSize}
                  onChange={(v) => { setFontsTouched(true); patch({ titleSize: v || 5 }); }} />
              </FormField>
              <FormField label="Lines font (pt)">
                <NumericInput min={4} max={30} allowDecimal decimalPlaces={1} value={draft.lineSize}
                  onChange={(v) => { setFontsTouched(true); patch({ lineSize: v || 4 }); }} />
              </FormField>
              <FormField label="Title weight">
                <Select
                  value={draft.titleBold ? "bold" : "normal"}
                  onChange={(e) => patch({ titleBold: e.target.value === "bold" })}
                >
                  <option value="bold">Bold</option>
                  <option value="normal">Normal</option>
                </Select>
              </FormField>
              <FormField label="Text align">
                <Select
                  value={draft.align}
                  onChange={(e) => patch({ align: e.target.value as MrpStickerAlign })}
                >
                  <option value="center">Middle</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </Select>
              </FormField>
              <FormField label="Stickers needed">
                <NumericInput min={1} max={10000} value={draft.qty}
                  onChange={(v) => { setQtyTouched(true); patch({ qty: Math.max(1, Math.round(v || 1)) }); }} />
              </FormField>
            </div>
            {!fontsTouched && (
              <p className="text-[11px] text-muted">
                Font sizes auto-fit to the sticker size — change them to take control.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-dashed border-teal-200/80 bg-teal-50/30">
          <CardContent className="space-y-2 p-4">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm font-medium text-foreground">Live preview</p>
              <p className="text-xs font-semibold text-teal-800">
                {layout.perPage} stickers/page ({layout.cols} × {layout.rows}) · {pages} page
                {pages > 1 ? "s" : ""} for {draft.qty}
              </p>
            </div>
            <div className="flex justify-center overflow-x-auto rounded-lg bg-white p-3">
              <MrpStickerLabel design={draft} />
            </div>
            <p className="text-[11px] text-muted">
              Shown at real size — the print sheet repeats this {layout.perPage} times per A4 page.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Off-screen full-sheet render used by Print */}
      <div className="fixed -left-[9999px] top-0" aria-hidden>
        <MrpStickerSheet designs={[draft]} />
      </div>

      <StickyBar
        compact
        rows={[["Pages", `${pages} × A4 (${layout.perPage}/page)`]]}
        action={isEdit ? "Update design" : "Save design"}
        actionIcon={Save}
        onAction={() => void handleSave()}
        secondaryAction="Save & print"
        onSecondaryAction={() => void handlePrint()}
        loading={saving}
        disabled={!draft.title.trim()}
      />
    </PageShell>
  );
};
