/**
 * ProductFormPage — create or edit a product.
 *
 * Pricing model:
 *   MRP          = price on product label (shown on bill, reference only)
 *   Buy price    = supplier cost excl. VAT (stored incl. in DB for purchase prefill)
 *   Markup %     = configurable % over buy price → auto-calculates sell price
 *   Sell price   = buy price × (1 + markup/100) — what we charge on bills
 *   VAT on bills = from tenant Settings (not per product)
 *
 *   Auto-link: changing buy price or markup % recalculates sell price.
 *              Manually typing sell price updates markup % to match.
 *
 * Defaults (from Settings):
 *   - markup %     → optional; empty = unset (hint shows Settings default); refresh applies default
 *   - low stock    → BUSINESS.defaultMinQty
 */
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {Info, Plus, RefreshCw, Trash2} from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/app/PageShell";
import { FormField } from "@/components/app/FormField";
import { ProductCategoryField } from "@/components/app/ProductCategoryField";
import { ProductUnitField } from "@/components/app/ProductUnitField";
import { StickyBar } from "@/components/app/StickyBar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/app/NumericInput";
import { numericMoneyProps, numericPercentProps, numericQtyProps, roundMoney, roundPercent } from "@/lib/money";
import { Select } from "@/components/ui/select";
import { useBusinessSettings, useProductsCatalog, upsertProductLive } from "@/store/domain";
import { FormPageHeader } from "@/components/app/patterns";
import { supabase } from "@/lib/supabase";
import { addVatToExcl, getVatPct, purchasePriceExclFromProduct } from "@/lib/tax";
import { npr, nprNum } from "@/lib/utils";
import {
  availableExtraUoms,
  conversionLabel,
  mergeUomPricesWithConversion,
  packUomOptions,
  tenantUomOptions,
  toDbUomConversion,
  toDbUomPrices,
} from "@/lib/uom";
import type { Product, ProductUomConversion, ProductUomPrice } from "@/domain/types";
import { effectiveMinQtyPcs, isLowStock, minStockLabel } from "@/lib/stockAlert";
import { Button } from "@/components/ui/button";
type ExtraUomRow = { id: number; uom: string; mrp: number; sellingPrice: number };

const Section = ({ label }: { label: string }) => (
  <p className="mb-3 mt-6 text-xs font-bold uppercase tracking-wider text-teal-600 first:mt-0">{label}</p>
);

export const ProductFormPage = () => {
  const navigate      = useNavigate();
  const { productId } = useParams<{ productId?: string }>();
  const PRODUCTS      = useProductsCatalog();
  const business      = useBusinessSettings();
  const existing      = productId ? PRODUCTS.find((p) => p.id === productId) : undefined;
  const isEdit        = Boolean(existing);

  // ── Basic info ────────────────────────────────────────────────────────────
  const [name,        setName]        = useState(existing?.name        ?? "");
  const baseCategories = business.productCategories?.length ? business.productCategories : ["General"];
  const [categories, setCategories] = useState<string[]>(() => {
    const list = [...baseCategories];
    if (existing?.category && !list.includes(existing.category)) list.push(existing.category);
    return list;
  });
  const [category, setCategory] = useState(
    existing?.category && categories.includes(existing.category)
      ? existing.category
      : categories[0] ?? "General",
  );

  useEffect(() => {
    const list = business.productCategories?.length ? [...business.productCategories] : ["General"];
    setCategories((prev) => {
      const merged = [...list];
      for (const c of prev) {
        if (!merged.includes(c)) merged.push(c);
      }
      if (existing?.category && !merged.includes(existing.category)) merged.push(existing.category);
      return merged;
    });
  }, [business.productCategories, existing?.category]);

  const baseUnits = business.productUnits?.length ? business.productUnits : ["PCS", "Pkt", "Box", "Ctn", "Doz", "Ltr", "Kg"];
  const [units, setUnits] = useState<string[]>(() => {
    const list = [...baseUnits];
    if (existing?.uom && !list.includes(existing.uom)) list.push(existing.uom);
    return list;
  });
  useEffect(() => {
    const list = business.productUnits?.length ? [...business.productUnits] : ["PCS", "Pkt", "Box", "Ctn", "Doz", "Ltr", "Kg"];
    setUnits((prev) => {
      const merged = [...list];
      for (const u of prev) {
        if (!merged.includes(u)) merged.push(u);
      }
      if (existing?.uom && !merged.includes(existing.uom)) merged.push(existing.uom);
      return merged;
    });
  }, [business.productUnits, existing?.uom]);
  const unitCatalog = tenantUomOptions(units);

  const [openingStock, setOpeningStock] = useState(existing?.openingStock ?? 0);
  const [uom,         setUom]         = useState(existing?.uom         ?? "PCS");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [hsnCode, setHsnCode] = useState(existing?.hsnCode ?? "");

  // ── Pricing ───────────────────────────────────────────────────────────────
  const [mrp, setMrp] = useState(existing?.mrp ?? 0);
  const defaultMarkup = business.defaultMarkupPct;
  const vatPct = getVatPct(business);
  const initialBuyExcl =
    existing?.costPrice && existing.costPrice > 0
      ? purchasePriceExclFromProduct(existing.costPrice, vatPct)
      : 0;
  const [buyPrice, setBuyPrice] = useState(initialBuyExcl);

  // Markup % — empty = unset (hint shows Settings default); 0 = no markup; not prefilled from Settings
  const [markupPct, setMarkupPct] = useState<number | null>(() => {
    if (!existing || initialBuyExcl <= 0) return null;
    return roundPercent(((existing.sellingPrice - initialBuyExcl) / initialBuyExcl) * 100);
  });

  const markupForCalc = (m: number | null) => m ?? 0;

  // Sell price is derived from buy × (1 + markup/100), but can be overridden
  const [sellPrice, setSellPrice] = useState(existing?.sellingPrice ?? 0);

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
  const recalcSellFromMarkup = (buy: number, markup: number | null) => {
    if (buy > 0) setSellPrice(roundMoney(buy * (1 + markupForCalc(markup) / 100)));
  };

  const handleBuyChange = (v: number) => {
    setBuyPrice(v);
    recalcSellFromMarkup(v, markupPct);
  };

  const handleMarkupChange = (v: number | null) => {
    setMarkupPct(v);
    recalcSellFromMarkup(buyPrice, v);
  };

  // If sell price is typed manually, back-calculate markup %
  const handleSellChange = (v: number) => {
    setSellPrice(v);
    if (buyPrice > 0 && v > 0) {
      setMarkupPct(roundPercent(((v - buyPrice) / buyPrice) * 100));
    }
  };

  // Reset sell price from current buy + markup
  const resetSellFromMarkup = () => {
    if (buyPrice <= 0) return;
    const m = markupPct ?? defaultMarkup;
    if (markupPct === null) setMarkupPct(defaultMarkup);
    setSellPrice(roundMoney(buyPrice * (1 + m / 100)));
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
    const next = availableExtraUoms(uom, packUom, extraUomRows, unitCatalog)[0];
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
        purchase_price: vatPct > 0 ? addVatToExcl(buyPrice, vatPct) : buyPrice,
        sale_price: sellPrice,
        mrp,
        uom_prices: buildUomPricesForSave(),
        uom_conversion: toDbUomConversion(uomConversion),
        discount_pct: discountPct,
        vat_applicable: false,
        min_qty: minQty,
        min_qty_pack: uomConversion && minQtyPack > 0 ? minQtyPack : null,
        opening_stock: isEdit ? (existing?.openingStock ?? 0) : openingStock,
        hsn_code: hsnCode.trim() || null,
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
      <FormPageHeader
        title={isEdit ? `Edit ${existing?.name}` : "New product"}
        subtitle={
          isEdit ? "Update product details and pricing." : "Add a product to your catalogue."
        }
      />

      <div className="space-y-1">

        {/* ── Basic info ── */}
        <Section label="Basic info" />
        <div className="space-y-4">
          <FormField label="Product name" required>
            <Input placeholder="e.g. Vanilla 500ml tub" value={name}
              onChange={(e) => setName(e.target.value)} />
          </FormField>
          <ProductCategoryField
            categories={categories}
            value={category}
            onChange={setCategory}
            onCategoriesChange={setCategories}
          />
          <ProductUnitField
            units={units}
            value={uom}
            onChange={(next) => {
              setUom(next);
              if (packUom === next) setPackUom("");
              setExtraUomRows((rows) => rows.filter((r) => r.uom !== next));
            }}
            onUnitsChange={setUnits}
          />

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
                {packUomOptions(uom, unitCatalog).map((u) => (
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
          <FormField label="HSN code (optional)">
            <Input
              placeholder="e.g. 21050000"
              value={hsnCode}
              maxLength={16}
              onChange={(e) => setHsnCode(e.target.value.replace(/\s/g, ""))}
            />
          </FormField>
        </div>

        {/* ── Pricing ── */}
        <Section label="Pricing" />

        <div className="mb-4 flex items-start gap-2 rounded-xl bg-teal-50 border border-teal-200 px-3 py-3">
          <Info size={14} className="mt-0.5 shrink-0 text-teal-600" />
          <div className="text-xs text-teal-700 space-y-1">
            <p><strong>MRP</strong> — printed on product. Shown on bill as reference only.</p>
            <p><strong>Buy price</strong> — supplier cost before VAT. With-VAT amount is calculated from Settings.</p>
            <p>
              <strong>Markup %</strong> — leave blank for no markup, or use ↻ on sell price to apply Settings default (
              {defaultMarkup}%).
            </p>
            <p>
              <strong>Sell price</strong> — updates from buy × markup; type to override (<em>excl. VAT</em>).
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <FormField label="MRP (NPR)" hint="Price on the product label — shown on bill for customer reference">
            <NumericInput {...numericMoneyProps} min={0} value={mrp} placeholder="0" onChange={setMrp} />
          </FormField>

          {/* Buy price */}
          <FormField
            label="Buy price excl. VAT (NPR)"
            hint={
              buyPrice > 0 && vatPct > 0
                ? `With VAT (${vatPct}%): ${nprNum(addVatToExcl(buyPrice, vatPct))}`
                : vatPct > 0
                  ? `VAT ${vatPct}% from Settings`
                  : undefined
            }
          >
            <NumericInput
              {...numericMoneyProps}
              min={0}
              value={buyPrice}
              placeholder="0"
              onChange={handleBuyChange}
              className="border-amber-300 focus:ring-amber-400"
            />
          </FormField>

          {/* Markup + sell price — linked row */}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Markup (%)">
              <NumericInput
                {...numericPercentProps}
                nullable
                showZero
                min={0}
                max={500}
                value={markupPct}
                placeholder=""
                onChange={handleMarkupChange}
              />
            </FormField>

            <FormField
              label="Sell price excl. VAT (NPR)"
              hint={
                sellPrice > 0 && vatPct > 0
                  ? `With VAT (${vatPct}%): ${nprNum(addVatToExcl(sellPrice, vatPct))}`
                  : vatPct > 0
                    ? `VAT ${vatPct}% from Settings`
                    : undefined
              }
            >
              <div className="relative">
                <NumericInput
                  {...numericMoneyProps}
                  min={0}
                  value={sellPrice}
                  placeholder="0"
                  onChange={handleSellChange}
                />
                {/* Reset button — recalculate from buy × markup */}
                {buyPrice > 0 && (
                  <button
                    type="button"
                    onClick={resetSellFromMarkup}
                    title={
                      markupPct === null
                        ? `Apply Settings markup (${defaultMarkup}%) and recalculate sell`
                        : "Recalculate sell from buy × markup %"
                    }
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
              {...numericPercentProps}
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
                unitCatalog,
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
                      {...numericMoneyProps}
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
                      {...numericMoneyProps}
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
        {availableExtraUoms(uom, packUom, extraUomRows, unitCatalog).length > 0 && (
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
            <span>
              Markup {markupPct === null ? "—" : `${markupPct}%`}
            </span>
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

        {!isEdit ? (
          <>
            <Section label="Opening stock" />
            <div className="mb-4 flex items-start gap-2 rounded-xl bg-slate-50 border border-border-subtle px-3 py-3">
              <Info size={14} className="mt-0.5 shrink-0 text-teal-600" />
              <p className="text-xs text-muted leading-snug">
                Opening count for this product. Later changes come from purchases and sales
                {business.allowStockAdjustment ? " or stock adjustment." : "."}
              </p>
            </div>
            <FormField label={`Opening qty (${uom})`}>
              <NumericInput {...numericQtyProps} min={0} value={openingStock} onChange={setOpeningStock} />
            </FormField>
          </>
        ) : (
          <div className="mb-4 rounded-xl border border-border-subtle bg-slate-50 px-3 py-3 text-xs text-muted leading-snug">
            <p>
              <strong>Opening qty:</strong> {existing?.openingStock ?? 0} {uom} (set when product was created).
            </p>
            <p className="mt-1">
              On hand: <strong>{existing?.onHand ?? 0}</strong> {uom}. Update via purchase
              {business.allowStockAdjustment ? " or stock adjustment." : "."}
            </p>
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
        disabled={!name.trim() || buyPrice <= 0}
      />
    </PageShell>
  );
};
