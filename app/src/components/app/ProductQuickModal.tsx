/**
 * Quick add / edit product from bill or purchase line (modal).
 */
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/app/FormField";
import { ProductCategoryField } from "@/components/app/ProductCategoryField";
import { NumericInput } from "@/components/app/NumericInput";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  numericPercentProps,
  numericPriceProps,
  PRICE_DECIMAL_PLACES,
  roundMoney,
  roundPercent,
} from "@/lib/money";
import { useQueryClient } from "@tanstack/react-query";
import { DOMAIN_QUERY_KEY, MASTER_CATALOG_QUERY_KEY } from "@/lib/live/domainLive";
import { useBusinessSettings, useProductsCatalog, upsertProductLive } from "@/store/domain";
import { addVatToExclPrice, getVatPct, purchasePriceExclFromProduct } from "@/lib/tax";
import { packUomOptions, tenantUomOptions, toDbUomConversion } from "@/lib/uom";
import { supabase } from "@/lib/supabase";

type Props = {
  open: boolean;
  productId?: string;
  initialName?: string;
  onClose: () => void;
  onSaved: (productId: string) => void;
};

export function ProductQuickModal({
  open,
  productId,
  initialName = "",
  onClose,
  onSaved,
}: Props) {
  const queryClient = useQueryClient();
  const business = useBusinessSettings();
  const PRODUCTS = useProductsCatalog();
  const existing = productId ? PRODUCTS.find((p) => p.id === productId) : undefined;
  const vatPct = getVatPct(business);
  const isEdit = Boolean(productId && existing);

  const [name, setName] = useState(initialName);
  const [category, setCategory] = useState("General");
  const [uom, setUom] = useState("PCS");
  const [mrp, setMrp] = useState(0);
  const [buyPrice, setBuyPrice] = useState(0);
  const [markupPct, setMarkupPct] = useState(0);
  const [sellPrice, setSellPrice] = useState(0);
  const [packUom, setPackUom] = useState("");
  const [piecesPerPack, setPiecesPerPack] = useState(0);
  const [saving, setSaving] = useState(false);

  const unitCatalog = tenantUomOptions(business.productUnits);
  const categories = business.productCategories?.length ? business.productCategories : ["General"];

  useEffect(() => {
    if (!open) return;
    if (existing) {
      const buyExcl =
        existing.costPrice > 0 ? purchasePriceExclFromProduct(existing.costPrice, vatPct) : 0;
      const sp = existing.sellingPrice;
      setName(existing.name);
      setCategory(existing.category || categories[0] || "General");
      setUom(existing.uom || "PCS");
      setMrp(existing.mrp);
      setBuyPrice(buyExcl);
      setSellPrice(sp > 0 && buyExcl > 0 && sp >= buyExcl * 0.5 ? sp : buyExcl);
      setMarkupPct(
        buyExcl > 0 && sp > 0 && sp >= buyExcl * 0.5
          ? roundPercent(((sp - buyExcl) / buyExcl) * 100)
          : 0,
      );
      setPackUom(existing.uomConversion?.packUom ?? "");
      setPiecesPerPack(existing.uomConversion?.piecesPerPack ?? 0);
    } else {
      setName(initialName.trim());
      setCategory(categories[0] ?? "General");
      setUom("PCS");
      setMrp(0);
      setBuyPrice(0);
      setMarkupPct(0);
      setSellPrice(0);
      setPackUom("");
      setPiecesPerPack(0);
    }
  }, [open, existing, initialName, vatPct, categories]);

  const recalcSell = (buy: number, markup: number) => {
    if (buy > 0) setSellPrice(roundMoney(buy * (1 + markup / 100), PRICE_DECIMAL_PLACES));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Product name is required.");
      return;
    }
    if (buyPrice <= 0) {
      toast.error("Buy price must be greater than 0.");
      return;
    }
    setSaving(true);
    try {
      let code = `P-${Date.now().toString(36).toUpperCase()}`;
      if (isEdit && existing) {
        const { data: row } = await supabase
          .from("products")
          .select("code")
          .eq("id", existing.id)
          .maybeSingle();
        if (row?.code) code = row.code as string;
      }
      const uomConversion =
        packUom.trim() && piecesPerPack >= 2
          ? toDbUomConversion({ packUom: packUom.trim(), piecesPerPack: Math.round(piecesPerPack) })
          : null;
      const id = await upsertProductLive({
        id: isEdit ? existing?.id : undefined,
        code,
        name: name.trim(),
        category,
        unit: uom,
        purchase_price:
          vatPct > 0 ? addVatToExclPrice(buyPrice, vatPct) : roundMoney(buyPrice, PRICE_DECIMAL_PLACES),
        sale_price: roundMoney(sellPrice, PRICE_DECIMAL_PLACES),
        mrp: roundMoney(mrp, PRICE_DECIMAL_PLACES),
        discount_pct: 0,
        vat_applicable: false,
        min_qty: business.defaultMinQty,
        min_qty_pack: uomConversion && business.defaultMinPackQty > 0 ? business.defaultMinPackQty : null,
        uom_conversion: uomConversion,
        opening_stock: isEdit ? (existing?.openingStock ?? 0) : 0,
      });
      await queryClient.refetchQueries({ queryKey: DOMAIN_QUERY_KEY });
      await queryClient.refetchQueries({ queryKey: MASTER_CATALOG_QUERY_KEY });
      toast.success(isEdit ? `${name} updated.` : `${name} added.`);
      onSaved(id);
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save product");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-4 print:hidden">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-border-subtle bg-white shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
          <h2 className="text-base font-semibold">{isEdit ? "Edit product" : "Add product"}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          <FormField label="Product name" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Product name" />
          </FormField>
          <ProductCategoryField
            value={category}
            categories={categories}
            onChange={setCategory}
            onCategoriesChange={() => {}}
          />
          <FormField label="Base unit">
            <Select value={uom} onChange={(e) => setUom(e.target.value)}>
              {unitCatalog.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="MRP (NPR)">
            <NumericInput {...numericPriceProps} min={0} value={mrp} onChange={setMrp} />
          </FormField>
          <FormField label="Buy price excl. VAT (NPR)" required>
            <NumericInput
              {...numericPriceProps}
              min={0}
              value={buyPrice}
              onChange={(v) => {
                setBuyPrice(v);
                recalcSell(v, markupPct);
              }}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-2">
            <FormField label="Markup (%)">
              <NumericInput
                {...numericPercentProps}
                showZero
                min={0}
                value={markupPct}
                onChange={(v) => {
                  setMarkupPct(v ?? 0);
                  recalcSell(buyPrice, v ?? 0);
                }}
              />
            </FormField>
            <FormField label="Sell excl. VAT">
              <NumericInput
                {...numericPriceProps}
                min={0}
                value={sellPrice}
                onChange={(v) => {
                  setSellPrice(v);
                  if (buyPrice > 0 && v > 0) {
                    setMarkupPct(roundPercent(((v - buyPrice) / buyPrice) * 100));
                  }
                }}
              />
            </FormField>
          </div>
          <FormField label="Pack unit (optional)">
            <Select
              value={packUom}
              onChange={(e) => {
                setPackUom(e.target.value);
                if (!e.target.value) setPiecesPerPack(0);
                else if (piecesPerPack < 2) setPiecesPerPack(10);
              }}
            >
              <option value="">— None —</option>
              {packUomOptions(uom, unitCatalog).map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </Select>
          </FormField>
          {packUom ? (
            <FormField label={`PCS per ${packUom}`}>
              <NumericInput
                min={2}
                value={piecesPerPack}
                onChange={(v) => setPiecesPerPack(Math.round(v))}
              />
            </FormField>
          ) : null}
        </div>
        <div className="flex gap-2 border-t border-border-subtle p-4">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" className="flex-1" loading={saving} onClick={() => void handleSave()}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
