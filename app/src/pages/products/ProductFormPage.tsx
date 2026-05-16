/**
 * ProductFormPage — create or edit a product.
 *
 * Pricing model:
 *   MRP          = price on product label (shown on bill, reference only)
 *   Buy price    = cost from Havmor (private — never shown on bills)
 *   Markup %     = configurable % over buy price → auto-calculates sell price
 *   Sell price   = buy price × (1 + markup/100) — what we charge, excl. VAT
 *   Sell incl. VAT = sell price × 1.13 — shown as reference when VAT is on
 *
 *   Auto-link: changing buy price or markup % recalculates sell price.
 *              Manually typing sell price updates markup % to match.
 *
 * Defaults (from Settings):
 *   - markup %     → BUSINESS.defaultMarkupPct
 *   - low stock    → BUSINESS.defaultMinQty
 */
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Info, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/app/PageShell";
import { FormField } from "@/components/app/FormField";
import { StickyBar } from "@/components/app/StickyBar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useBusinessSettings, useProducts, upsertProductLive } from "@/store/domain";
import { supabase } from "@/lib/supabase";
import { npr } from "@/lib/utils";

const UOM_OPTIONS = ["PCS", "Box", "Ltr", "Kg", "Pkt", "Ctn", "Doz"];
const CAT_OPTIONS = ["Ice Cream", "Bar", "Party", "Candy", "Cone", "Other"];
const VAT_RATE    = 13;

const Section = ({ label }: { label: string }) => (
  <p className="mb-3 mt-6 text-xs font-bold uppercase tracking-wider text-teal-600 first:mt-0">{label}</p>
);

export const ProductFormPage = () => {
  const navigate      = useNavigate();
  const { productId } = useParams<{ productId?: string }>();
  const PRODUCTS      = useProducts();
  const business      = useBusinessSettings();
  const existing      = productId ? PRODUCTS.find((p) => p.id === productId) : undefined;
  const isEdit        = Boolean(existing);

  // ── Basic info ────────────────────────────────────────────────────────────
  const [name,        setName]        = useState(existing?.name        ?? "");
  const [category,    setCategory]    = useState(existing?.category    ?? "Ice Cream");
  const [uom,         setUom]         = useState(existing?.uom         ?? "PCS");
  const [description, setDescription] = useState(existing?.description ?? "");

  // ── Pricing ───────────────────────────────────────────────────────────────
  const [mrp,       setMrp]       = useState(existing?.mrp       ?? 0);
  const [buyPrice,  setBuyPrice]  = useState(existing?.costPrice  ?? 0);

  // Markup % — defaults from Settings, overridable per product
  const defaultMarkup = business.defaultMarkupPct;
  const [markupPct, setMarkupPct] = useState(
    existing
      ? existing.costPrice > 0
        ? Math.round(((existing.sellingPrice - existing.costPrice) / existing.costPrice) * 100)
        : defaultMarkup
      : defaultMarkup,
  );

  // Sell price is derived from buy × (1 + markup/100), but can be overridden
  const [sellPrice, setSellPrice] = useState(
    existing?.sellingPrice ?? (buyPrice > 0 ? Math.round(buyPrice * (1 + markupPct / 100)) : 0),
  );

  const [discountPct,   setDiscountPct]   = useState(existing?.discountPct   ?? 0);
  const [vatApplicable, setVat]           = useState(existing?.vatApplicable ?? false);

  // ── Stock threshold (defaults from Settings) ──────────────────────────────
  const [minQty, setMinQty] = useState(existing?.minQty ?? business.defaultMinQty);

  const [saving, setSaving] = useState(false);

  // ── Linked price calculations ─────────────────────────────────────────────
  const recalcSellFromMarkup = (buy: number, markup: number) => {
    if (buy > 0) setSellPrice(Math.round(buy * (1 + markup / 100)));
  };

  const handleBuyChange = (v: number) => {
    setBuyPrice(v);
    recalcSellFromMarkup(v, markupPct);
  };

  const handleMarkupChange = (v: number) => {
    setMarkupPct(v);
    recalcSellFromMarkup(buyPrice, v);
  };

  // If sell price is typed manually, back-calculate markup %
  const handleSellChange = (v: number) => {
    setSellPrice(v);
    if (buyPrice > 0 && v > 0) {
      setMarkupPct(Math.round(((v - buyPrice) / buyPrice) * 100));
    }
  };

  // Reset sell price from current buy + markup
  const resetSellFromMarkup = () => {
    if (buyPrice > 0) setSellPrice(Math.round(buyPrice * (1 + markupPct / 100)));
  };

  // ── Derived preview ───────────────────────────────────────────────────────
  const effectiveSell   = sellPrice * (1 - discountPct / 100);
  const vatAmount       = vatApplicable ? Math.round(effectiveSell * VAT_RATE / 100) : 0;
  const sellInclVat     = effectiveSell + vatAmount;
  const margin          = buyPrice > 0 ? Math.round(((effectiveSell - buyPrice) / buyPrice) * 100) : 0;
  const marginNpr       = effectiveSell - buyPrice;

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!name.trim())   { toast.error("Product name is required."); return; }
    if (sellPrice <= 0) { toast.error("Sell price must be greater than 0."); return; }
    if (buyPrice <= 0)  { toast.error("Buy price must be greater than 0."); return; }
    setSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 200));
      let code = `P-${Date.now().toString(36).toUpperCase()}`;
      if (isEdit && existing) {
        const { data: row } = await supabase.from("products").select("code").eq("id", existing.id).maybeSingle();
        if (row?.code) code = row.code as string;
      }
      await upsertProductLive({
        id: isEdit ? existing?.id : undefined,
        code,
        name: name.trim(),
        category,
        unit: uom,
        purchase_price: buyPrice,
        sale_price: sellPrice,
        mrp,
        discount_pct: discountPct,
        vat_applicable: vatApplicable,
        min_qty: minQty,
      });
      toast.success(isEdit ? `${name} updated.` : `${name} added.`);
      navigate("/app/products");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell stickyBar>
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm font-medium text-teal-600">
        <ArrowLeft size={16} /> Back
      </button>
      <h1 className="mb-1 text-lg font-bold">{isEdit ? `Edit ${existing?.name}` : "New product"}</h1>
      <p className="mb-5 text-sm text-muted">
        {isEdit ? "Update product details and pricing." : "Add a product to your catalogue."}
      </p>

      <div className="space-y-1">

        {/* ── Basic info ── */}
        <Section label="Basic info" />
        <div className="space-y-4">
          <FormField label="Product name" required>
            <Input placeholder="e.g. Havmor Vanilla 500ml" value={name}
              onChange={(e) => setName(e.target.value)} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Category">
              <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                {CAT_OPTIONS.map((c) => <option key={c}>{c}</option>)}
              </Select>
            </FormField>
            <FormField label="Unit (UOM)">
              <Select value={uom} onChange={(e) => setUom(e.target.value)}>
                {UOM_OPTIONS.map((u) => <option key={u}>{u}</option>)}
              </Select>
            </FormField>
          </div>
          <FormField label="Description (optional)">
            <Input placeholder="Flavour, size, pack details…" value={description}
              onChange={(e) => setDescription(e.target.value)} />
          </FormField>
        </div>

        {/* ── Pricing ── */}
        <Section label="Pricing" />

        <div className="mb-4 flex items-start gap-2 rounded-xl bg-teal-50 border border-teal-200 px-3 py-3">
          <Info size={14} className="mt-0.5 shrink-0 text-teal-600" />
          <div className="text-xs text-teal-700 space-y-1">
            <p><strong>MRP</strong> — printed on product. Shown on bill as reference only.</p>
            <p><strong>Buy price</strong> — what you pay Havmor. Private, never shown on bills.</p>
            <p><strong>Markup %</strong> — auto-calculates sell price. Default from Settings ({defaultMarkup}%). Override per product.</p>
            <p><strong>Sell price</strong> — charged to your customer, <em>excl. VAT</em>. Editable; updating it recalculates markup %.</p>
          </div>
        </div>

        <div className="space-y-4">
          <FormField label="MRP (NPR)" hint="Price on the product label — shown on bill for customer reference">
            <Input type="number" min={0} value={mrp || ""} placeholder="0"
              onChange={(e) => setMrp(Number(e.target.value))} />
          </FormField>

          {/* Buy price */}
          <FormField label="Buy price (NPR)" hint="Your cost from Havmor — private, for profit calc only">
            <Input type="number" min={0} value={buyPrice || ""} placeholder="0"
              onChange={(e) => handleBuyChange(Number(e.target.value))}
              className="border-amber-300 focus:ring-amber-400" />
          </FormField>

          {/* Markup + sell price — linked row */}
          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="Markup (%)"
              hint={`Default: ${defaultMarkup}% (from Settings)`}
            >
              <Input type="number" min={0} max={500} value={markupPct || ""}
                placeholder={String(defaultMarkup)}
                onChange={(e) => handleMarkupChange(Number(e.target.value))} />
            </FormField>

            <FormField
              label="Sell price excl. VAT (NPR)"
              hint="Auto-calculated. Type to override."
              required
            >
              <div className="relative">
                <Input type="number" min={0} value={sellPrice || ""} placeholder="0"
                  onChange={(e) => handleSellChange(Number(e.target.value))} />
                {/* Reset button — recalculate from buy × markup */}
                {buyPrice > 0 && (
                  <button
                    type="button"
                    onClick={resetSellFromMarkup}
                    title="Recalculate from buy price × markup"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-teal-600"
                  >
                    <RefreshCw size={13} />
                  </button>
                )}
              </div>
            </FormField>
          </div>

          {/* Sell price incl. VAT — shown when VAT is on, read-only reference */}
          {vatApplicable && sellPrice > 0 && (
            <FormField
              label="Sell price incl. VAT (NPR)"
              hint={`Reference only: sell price + ${VAT_RATE}% VAT. This is NOT a separate field — VAT is added at bill footer.`}
            >
              <div className="flex h-11 items-center rounded-lg bg-teal-50 border border-teal-200 px-3 text-sm font-semibold text-teal-700">
                {npr(Math.round(sellPrice * (1 + VAT_RATE / 100)))}
                <span className="ml-2 text-xs font-normal text-teal-500">(excl. {npr(sellPrice)} + VAT {npr(Math.round(sellPrice * VAT_RATE / 100))})</span>
              </div>
            </FormField>
          )}

          <FormField label="Standard discount (%)" hint="Auto-filled on new bills — 0 if none">
            <Input type="number" min={0} max={100} value={discountPct || ""} placeholder="0"
              onChange={(e) => setDiscountPct(Math.min(100, Number(e.target.value)))} />
          </FormField>
        </div>

        {/* ── VAT ── */}
        <Section label="VAT" />
        <FormField
          label="VAT applicable on this product?"
          hint="When Yes, 13% VAT is added at bill total — sell price above is excl. VAT."
        >
          <div className="flex gap-3">
            {[true, false].map((v) => (
              <button key={String(v)} onClick={() => setVat(v)}
                className={`flex-1 rounded-lg border py-2.5 text-sm font-semibold transition-colors ${vatApplicable === v ? "border-teal-600 bg-teal-600 text-white" : "border-border-subtle bg-surface-card text-muted"}`}>
                {v ? "Yes — add VAT on bill" : "No — price inclusive"}
              </button>
            ))}
          </div>
        </FormField>

        {/* ── Pricing summary card ── */}
        {sellPrice > 0 && buyPrice > 0 && (
          <Card className="mt-2">
            <CardContent className="p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">
                Pricing summary (per {uom})
              </p>
              <div className="space-y-2">
                <SummaryRow label="MRP (on product)"     value={npr(mrp)}          note="reference" dim />
                <SummaryRow label="Buy price"            value={npr(buyPrice)}      note="private" dim />
                <SummaryRow label="Markup"               value={`${markupPct}%`} />
                <SummaryRow label="Sell price (excl. VAT)" value={npr(sellPrice)} />
                {discountPct > 0 && (
                  <SummaryRow label={`After ${discountPct}% discount`} value={npr(effectiveSell)} />
                )}
                {vatApplicable && (
                  <SummaryRow label={`+ VAT ${VAT_RATE}%`}           value={`+ ${npr(vatAmount)}`} />
                )}
                <div className="border-t border-dashed border-gray-200 pt-2">
                  <SummaryRow label="Customer pays"      value={npr(sellInclVat)}  bold />
                </div>
                <div className="border-t border-dashed border-gray-200 pt-2">
                  <SummaryRow
                    label="Your profit / unit"
                    value={`${npr(marginNpr)} (${margin}%)`}
                    bold
                    colored={margin < 5 ? "text-danger" : margin < 15 ? "text-warning-foreground" : "text-success-foreground"}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Stock alert threshold ── */}
        <Section label="Stock alert" />
        <FormField
          label="Low stock threshold (min qty)"
          hint={`Default from Settings: ${business.defaultMinQty} ${uom}. Decrease here if this product needs a lower alert.`}
        >
          <Input type="number" min={0} value={minQty}
            onChange={(e) => setMinQty(Number(e.target.value))} />
        </FormField>
        {existing && (
          <p className="text-xs text-muted">
            Currently on hand: <strong>{existing.onHand} {uom}</strong>.{" "}
            {existing.onHand <= minQty
              ? <span className="text-danger font-semibold">Below threshold — shows as Low.</span>
              : <span className="text-success-foreground">{existing.onHand - minQty} {uom} above threshold.</span>}
          </p>
        )}

      </div>

      <StickyBar
        rows={sellPrice > 0 ? [
          ["Sell price", npr(sellPrice)],
          ...(vatApplicable ? [["Incl. VAT", npr(sellInclVat)] as [string, string]] : []),
          ...(buyPrice > 0  ? [["Margin", `${margin}%`]         as [string, string]] : []),
        ] : undefined}
        action={isEdit ? "Update product" : "Add product"}
        onAction={handleSave}
        loading={saving}
        disabled={!name.trim() || sellPrice <= 0}
      />
    </PageShell>
  );
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const SummaryRow = ({
  label, value, note, bold, dim, colored,
}: { label: string; value: string; note?: string; bold?: boolean; dim?: boolean; colored?: string }) => (
  <div className={`flex items-center justify-between text-sm ${dim ? "opacity-55" : ""}`}>
    <span className="text-muted">
      {label}
      {note && <span className="ml-1 text-[10px] opacity-70">({note})</span>}
    </span>
    <span className={colored ?? (bold ? "font-bold text-foreground" : "font-medium text-foreground")}>
      {value}
    </span>
  </div>
);
