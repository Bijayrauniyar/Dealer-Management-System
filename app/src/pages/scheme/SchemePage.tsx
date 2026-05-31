import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PageShell } from "@/components/app/PageShell";
import { FormField } from "@/components/app/FormField";
import { EntityPicker } from "@/components/app/EntityPicker";
import { StickyBar } from "@/components/app/StickyBar";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/app/NumericInput";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useProducts, commitSchemeEntry } from "@/store/domain";
import { productUomChoices } from "@/lib/uom";
import { toDateInput } from "@/lib/utils";
import { PageBackLink } from "@/components/app/PageBackLink";

export const SchemePage = () => {
  const navigate = useNavigate();
  const PRODUCTS = useProducts();
  const [name, setName] = useState("");
  const [productId, setProductId] = useState("");
  const [buyQty, setBuyQty] = useState(10);
  const [freeQty, setFreeQty] = useState(1);
  const [buyUom, setBuyUom] = useState("");
  const [freeUom, setFreeUom] = useState("");
  const [startDate, setStart] = useState(toDateInput());
  const [endDate, setEnd] = useState("");
  const [saving, setSaving] = useState(false);

  const product = useMemo(
    () => PRODUCTS.find((p) => p.id === productId),
    [PRODUCTS, productId],
  );

  const uomChoices = useMemo(() => {
    if (!product) return ["PCS"];
    return productUomChoices(product, buyUom || product.uom);
  }, [product, buyUom]);

  const applyBoxPiecePreset = () => {
    if (!product?.uomConversion) {
      toast.error("Choose a product with pack conversion (e.g. 1 Box = N PCS).");
      return;
    }
    const { packUom } = product.uomConversion;
    const base = product.uom || "PCS";
    setBuyQty(1);
    setFreeQty(1);
    setBuyUom(packUom);
    setFreeUom(base);
    if (!name.trim()) {
      setName(`1 ${packUom} → 1 ${base} free`);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Enter a scheme name.");
      return;
    }
    if (!productId) {
      toast.error("Choose a product.");
      return;
    }
    if (buyQty < 1) {
      toast.error("Buy quantity must be at least 1.");
      return;
    }
    if (freeQty < 1) {
      toast.error("Free quantity must be at least 1.");
      return;
    }
    if (!endDate) {
      toast.error("Set an end date.");
      return;
    }
    if (endDate < startDate) {
      toast.error("End date cannot be before start date.");
      return;
    }
    setSaving(true);
    try {
      await commitSchemeEntry({
        schemeName: name.trim(),
        productId,
        buyQty,
        freeQty,
        buyUom: buyUom.trim() || null,
        freeUom: freeUom.trim() || null,
        startDate,
        endDate,
      });
      toast.success("Scheme saved.");
      navigate("/app/home");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save scheme");
    } finally {
      setSaving(false);
    }
  };

  const buyLabel = buyUom ? `${buyQty} ${buyUom}` : String(buyQty);
  const freeLabel = freeUom ? `${freeQty} ${freeUom}` : String(freeQty);

  return (
    <PageShell stickyBar>
      <PageBackLink className="flex items-center gap-1 text-sm font-medium text-teal-600" />
      <h1 className="mb-5 text-lg font-semibold">Scheme entry</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Buy-X-get-Y-free for one product. Use different units for pack deals (e.g. buy 1 Box, get 1
        piece free).
      </p>
      <div className="space-y-4">
        <FormField label="Scheme name" required>
          <Input
            placeholder="e.g. Summer mango offer"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </FormField>
        <FormField label="Product" required>
          <EntityPicker
            placeholder="Search product"
            options={PRODUCTS.map((p) => ({ id: p.id, label: p.name }))}
            value={productId}
            onChange={(id) => {
              setProductId(id);
              setBuyUom("");
              setFreeUom("");
            }}
            onClear={() => {
              setProductId("");
              setBuyUom("");
              setFreeUom("");
            }}
            entityLabel="product"
          />
        </FormField>

        {product?.uomConversion && (
          <Button type="button" variant="outline" size="sm" onClick={applyBoxPiecePreset}>
            Use example: 1 {product.uomConversion.packUom} → 1 {product.uom} free
          </Button>
        )}

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Buy qty" required>
            <NumericInput min={1} value={buyQty} onChange={(v) => setBuyQty(Math.max(1, v))} />
          </FormField>
          <FormField label="Buy unit" hint={product ? "Paid line UOM on bill" : undefined}>
            <Select
              value={buyUom || product?.uom || "PCS"}
              disabled={!product}
              onChange={(e) => setBuyUom(e.target.value)}
            >
              {uomChoices.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Free qty" required>
            <NumericInput min={1} value={freeQty} onChange={(v) => setFreeQty(Math.max(1, v))} />
          </FormField>
          <FormField label="Free unit" hint="Usually base unit (piece)">
            <Select
              value={freeUom || product?.uom || "PCS"}
              disabled={!product}
              onChange={(e) => setFreeUom(e.target.value)}
            >
              {uomChoices.map((u) => (
                <option key={`free-${u}`} value={u}>
                  {u}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
        <p className="text-xs text-muted-foreground">
          Example: buy {buyLabel}, get {freeLabel} free on the selected product.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Start date">
            <Input type="date" value={startDate} onChange={(e) => setStart(e.target.value)} />
          </FormField>
          <FormField label="End date" required>
            <Input type="date" value={endDate} onChange={(e) => setEnd(e.target.value)} />
          </FormField>
        </div>
      </div>
      <StickyBar action="Save scheme" onAction={handleSave} loading={saving} />
    </PageShell>
  );
};
