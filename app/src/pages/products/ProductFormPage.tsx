/**
 * ProductFormPage — create or edit a product.
 *
 * Pricing model:
 *   MRP          = price on product label (shown on bill, reference only)
 *   Buy price    = cost from Havmor (private — never shown on bills)
 *   Markup %     = configurable % over buy price → auto-calculates sell price
 *   Sell price   = buy price × (1 + markup/100) — what we charge on bills
 *   VAT on bills = from tenant Settings (not per product)
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
import { ArrowLeft, Info, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/app/PageShell";
import { FormField } from "@/components/app/FormField";
import { StickyBar } from "@/components/app/StickyBar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/app/NumericInput";
import { Select } from "@/components/ui/select";
import { useBusinessSettings, useProducts, upsertProductLive } from "@/store/domain";
import { supabase } from "@/lib/supabase";
import { npr } from "@/lib/utils";
import {
  UOM_OPTIONS,
  availableExtraUoms,
  conversionLabel,
  mergeUomPricesWithConversion,
  packUomOptions,
  toDbUomConversion,
  toDbUomPrices,
} from "@/lib/uom";
import type { Product, ProductUomConversion, ProductUomPrice } from "@/domain/types";
import { effectiveMinQtyPcs, isLowStock, minStockLabel } from "@/lib/stockAlert";
import { Button } from "@/components/ui/button";

type ExtraUomRow = { id: number; uom: string; mrp: number; sellingPrice: number };
const CAT_OPTIONS = ["Ice Cream", "Bar", "Party", "Candy", "Cone", "Other"];

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

  // ── Stock threshold (defaults from Settings) ──────────────────────────────
  const [minQty, setMinQty] = useState(existing?.minQty ?? business.defaultMinQty);
  const [minQtyPack, setMinQtyPack] = useState(
    existing?.minQtyPack ?? business.defaultMinPackQty,
  );

  const [packUom, setPackUom] = useState(existing?.uomConversion?.packUom ?? "");
  const [piecesPerPack, setPiecesPerPack] = useState(
    existing?.uomConversion?.piecesPerPack ?? 0,
  );

  const [extraUomRows, setExtraUomRows] = useState<ExtraUomRow[]>(() => {
    if (!existing) return [];
    const pack = existing.uomConversion?.packUom;
    return Object.entries(existing.uomPrices)
      .filter(([k]) => k !== existing.uom && k !== pack)
      .map(([uom, p], i) => ({
        id: i + 1,
        uom,
        mrp: p.mrp,
        sellingPrice: p.sellingPrice,
      }));
  });

  const uomConversion: ProductUomConversion | null =
    packUom.trim() && piecesPerPack >= 2
      ? { packUom: packUom.trim(), piecesPerPack: Math.round(piecesPerPack) }
      : null;

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
  const margin          = buyPrice > 0 ? Math.round(((effectiveSell - buyPrice) / buyPrice) * 100) : 0;
  const marginNpr       = effectiveSell - buyPrice;

  // ── Save ──────────────────────────────────────────────────────────────────
  const buildUomPricesForSave = (): Record<string, { mrp: number; sale_price: number }> => {
    const manual: Record<string, ProductUomPrice> = {};
    for (const row of extraUomRows) {
      const key = row.uom.trim();
      if (!key) continue;
      manual[key] = { mrp: row.mrp, sellingPrice: row.sellingPrice };
    }
    const merged = mergeUomPricesWithConversion(
      uom,
      { mrp, sellingPrice: sellPrice },
      manual,
      uomConversion,
    );
    return toDbUomPrices(merged);
  };

  const addExtraUomRow = () => {
    const next = availableExtraUoms(uom, packUom, extraUomRows)[0];
    if (!next) {
      toast.error("All standard units are already added.");
      return;
    }
    setExtraUomRows((rows) => [
      ...rows,
      { id: Date.now(), uom: next, mrp: 0, sellingPrice: 0 },
    ]);
  };

  const handleSave = async () => {
    if (!name.trim())   { toast.error("Product name is required."); return; }
    if (sellPrice <= 0) { toast.error("Sell price must be greater than 0."); return; }
    if (buyPrice <= 0)  { toast.error("Buy price must be greater than 0."); return; }
    if (packUom.trim() && piecesPerPack < 2) {
      toast.error("Enter how many base units are in one pack (e.g. 10).");
      return;
    }
    for (const row of extraUomRows) {
      if (!row.uom.trim()) {
        toast.error("Choose a unit for each extra price row.");
        return;
      }
      if (row.mrp <= 0 || row.sellingPrice <= 0) {
        toast.error(`Enter MRP and sell price for ${row.uom}.`);
        return;
      }
    }
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
        uom_prices: buildUomPricesForSave(),
        uom_conversion: toDbUomConversion(uomConversion),
        discount_pct: discountPct,
        vat_applicable: false,
        min_qty: minQty,
        min_qty_pack: uomConversion && minQtyPack > 0 ? minQtyPack : null,
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
            <FormField label="Base unit" hint="Stock counted in this unit (e.g. PCS, Pkt)">
              <Select
                value={uom}
                onChange={(e) => {
                  const next = e.target.value;
                  setUom(next);
                  if (packUom === next) setPackUom("");
                  setExtraUomRows((rows) => rows.filter((r) => r.uom !== next));
                }}
              >
                {UOM_OPTIONS.map((u) => <option key={u}>{u}</option>)}
              </Select>
            </FormField>
          </div>

          <Section label="Pack / conversion" />
          <p className="mb-3 text-xs text-muted">
            If you sell in packs (e.g. Box), set how many base units are inside one pack.
          </p>
          <div className="space-y-4 rounded-xl border border-border-subtle bg-slate-50/80 p-4">
            <FormField label="Pack unit (optional)" hint="Larger unit — e.g. Box, Ctn">
              <Select
                value={packUom}
                onChange={(e) => {
                  const next = e.target.value;
                  setPackUom(next);
                  setExtraUomRows((rows) => rows.filter((r) => r.uom !== next));
                  if (!next) setPiecesPerPack(0);
                  else if (piecesPerPack < 2) setPiecesPerPack(10);
                }}
              >
                <option value="">— Not sold in packs —</option>
                {packUomOptions(uom).map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </Select>
            </FormField>
            {packUom ? (
              <>
                <FormField
                  label="Conversion rate"
                  hint={`How many ${uom} in one ${packUom}`}
                >
                  <NumericInput
                    min={0}
                    value={piecesPerPack}
                    placeholder="e.g. 10"
                    onChange={(v) => setPiecesPerPack(Math.round(v))}
                  />
                </FormField>
                {uomConversion ? (
                  <div className="flex items-start gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2.5 text-sm font-medium text-emerald-800">
                    <Info size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                    <span>{conversionLabel(uomConversion, uom)}</span>
                  </div>
                ) : null}
                <p className="text-[11px] text-muted">
                  Pack MRP/sell on bills can be filled automatically (base price ×{" "}
                  {piecesPerPack >= 2 ? piecesPerPack : "…"}) or overridden under other units
                  below.
                </p>
              </>
            ) : null}
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
            <NumericInput min={0} value={mrp} placeholder="0" onChange={setMrp} />
          </FormField>

          {/* Buy price */}
          <FormField label="Buy price (NPR)" hint="Your cost from Havmor — private, for profit calc only">
            <NumericInput
              min={0}
              value={buyPrice}
              placeholder="0"
              onChange={handleBuyChange}
              className="border-amber-300 focus:ring-amber-400"
            />
          </FormField>

          {/* Markup + sell price — linked row */}
          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="Markup (%)"
              hint={`Default: ${defaultMarkup}% (from Settings)`}
            >
              <NumericInput
                min={0}
                max={500}
                value={markupPct}
                placeholder={String(defaultMarkup)}
                onChange={handleMarkupChange}
              />
            </FormField>

            <FormField
              label="Sell price excl. VAT (NPR)"
              hint="Auto-calculated. Type to override."
              required
            >
              <div className="relative">
                <NumericInput min={0} value={sellPrice} placeholder="0" onChange={handleSellChange} />
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

          <FormField label="Standard discount (%)" hint="Auto-filled on new bills — 0 if none">
            <NumericInput
              min={0}
              max={100}
              value={discountPct}
              placeholder="0"
              onChange={(v) => setDiscountPct(Math.min(100, v))}
            />
          </FormField>
        </div>

        {/* ── Other units (Box, Ctn, …) ── */}
        <Section label="Prices for other units" />
        <p className="mb-3 text-xs text-muted">
          Optional. Other sell units (not the pack above) with their own MRP and sell price. Base and
          pack units use the prices above unless you add overrides here.
        </p>
        {extraUomRows.length > 0 && (
          <div className="mb-3 space-y-3">
            {extraUomRows.map((row) => {
              const uomPick = availableExtraUoms(
                uom,
                packUom,
                extraUomRows.filter((r) => r.id !== row.id),
              );
              const options = row.uom && !uomPick.includes(row.uom) ? [row.uom, ...uomPick] : uomPick;
              return (
                <div
                  key={row.id}
                  className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2 rounded-lg border border-border-subtle bg-slate-50/80 p-3"
                >
                  <FormField label="Unit">
                    <Select
                      value={row.uom}
                      onChange={(e) =>
                        setExtraUomRows((rows) =>
                          rows.map((r) => (r.id === row.id ? { ...r, uom: e.target.value } : r)),
                        )
                      }
                    >
                      {options.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField label="MRP (NPR)">
                    <NumericInput
                      min={0}
                      value={row.mrp}
                      onChange={(v) =>
                        setExtraUomRows((rows) =>
                          rows.map((r) => (r.id === row.id ? { ...r, mrp: v } : r)),
                        )
                      }
                    />
                  </FormField>
                  <FormField label="Sell excl. VAT">
                    <NumericInput
                      min={0}
                      value={row.sellingPrice}
                      onChange={(v) =>
                        setExtraUomRows((rows) =>
                          rows.map((r) => (r.id === row.id ? { ...r, sellingPrice: v } : r)),
                        )
                      }
                    />
                  </FormField>
                  <button
                    type="button"
                    onClick={() => setExtraUomRows((rows) => rows.filter((r) => r.id !== row.id))}
                    className="mb-0.5 flex h-11 w-11 items-center justify-center rounded-lg text-danger hover:bg-red-50"
                    aria-label="Remove unit"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
        {availableExtraUoms(uom, packUom, extraUomRows).length > 0 && (
          <Button type="button" variant="ghost" size="sm" onClick={addExtraUomRow}>
            <Plus size={14} /> Add unit price (e.g. Box)
          </Button>
        )}

        {/* ── Pricing summary (one line) ── */}
        {sellPrice > 0 && buyPrice > 0 && (
          <div className="rounded-lg border border-border-subtle bg-slate-50 px-3 py-2 text-xs leading-relaxed text-foreground">
            <span className="font-semibold text-muted">Per {uom}: </span>
            <span>MRP {npr(mrp)}</span>
            <span className="text-gray-300"> · </span>
            <span className="text-muted">Buy {npr(buyPrice)}</span>
            <span className="text-gray-300"> · </span>
            <span>Markup {markupPct}%</span>
            <span className="text-gray-300"> · </span>
            <span className="font-semibold text-teal-800">Sell {npr(sellPrice)}</span>
            {discountPct > 0 && (
              <>
                <span className="text-gray-300"> · </span>
                <span>After disc. {npr(effectiveSell)}</span>
              </>
            )}
            <span className="text-gray-300"> · </span>
            <span
              className={
                margin < 5
                  ? "font-semibold text-danger"
                  : margin < 15
                    ? "font-semibold text-warning-foreground"
                    : "font-semibold text-success-foreground"
              }
            >
              Profit {npr(marginNpr)} ({margin}%)
            </span>
          </div>
        )}

        {/* ── Stock alert threshold ── */}
        <Section label="Stock alert" />
        <p className="mb-2 text-[11px] text-muted leading-snug">
          Stock is tracked in <strong>{uom}</strong>. Alerts use the higher of piece and pack minimums.
        </p>
        <div className={`grid gap-3 ${uomConversion ? "grid-cols-2" : "grid-cols-1"}`}>
          <FormField
            label={`Min (${uom})`}
            hint={`Settings: ${business.defaultMinQty}`}
          >
            <NumericInput min={0} value={minQty} onChange={setMinQty} />
          </FormField>
          {uomConversion ? (
            <FormField
              label={`Min (${uomConversion.packUom})`}
              hint={`Settings: ${business.defaultMinPackQty}`}
            >
              <NumericInput min={0} value={minQtyPack} onChange={setMinQtyPack} />
            </FormField>
          ) : null}
        </div>
        {existing && (() => {
          const preview: Product = {
            ...existing,
            minQty,
            minQtyPack: uomConversion && minQtyPack > 0 ? minQtyPack : undefined,
            uomConversion,
          };
          const eff = effectiveMinQtyPcs(preview);
          const low = isLowStock(preview);
          return (
            <p className="text-xs text-muted">
              On hand: <strong>{existing.onHand} {uom}</strong> · alert below{" "}
              <strong>{minStockLabel(preview)}</strong> ({eff} {uom} total).{" "}
              {low ? (
                <span className="font-semibold text-danger">Low stock now.</span>
              ) : (
                <span className="text-success-foreground">{existing.onHand - eff} {uom} above alert.</span>
              )}
            </p>
          );
        })()}

      </div>

      <StickyBar
        rows={sellPrice > 0 ? [
          ["Sell price", npr(sellPrice)],
          ...(buyPrice > 0 ? [["Margin", `${margin}%`] as [string, string]] : []),
        ] : undefined}
        action={isEdit ? "Update product" : "Add product"}
        onAction={handleSave}
        loading={saving}
        disabled={!name.trim() || sellPrice <= 0}
      />
    </PageShell>
  );
};
