import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PageShell } from "@/components/app/PageShell";
import { FormField } from "@/components/app/FormField";
import { EntityPicker } from "@/components/app/EntityPicker";
import { StickyBar } from "@/components/app/StickyBar";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/app/NumericInput";
import { numericQtyProps } from "@/lib/money";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useProducts, commitStockAdjustment } from "@/store/domain";
import { toDateInput } from "@/lib/utils";
import { PageBackLink } from "@/components/app/PageBackLink";

const REASONS = ["Physical count", "Found stock", "Shrinkage", "Data correction", "Other"];

export const StockAdjustmentPage = () => {
  const navigate = useNavigate();
  const PRODUCTS = useProducts();
  const [productId, setProductId] = useState("");
  const [direction, setDirection] = useState<"add" | "remove">("add");
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState(REASONS[0]);
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(toDateInput());
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!productId) {
      toast.error("Choose a product.");
      return;
    }
    const delta = direction === "add" ? qty : -qty;
    if (!delta) {
      toast.error("Enter a quantity.");
      return;
    }
    setSaving(true);
    try {
      await commitStockAdjustment({
        productId,
        qtyDelta: delta,
        reason,
        notes: notes || undefined,
        adjustmentDate: date,
      });
      toast.success("Stock adjustment saved.");
      navigate("/app/home?tab=stock");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell stickyBar>
      <PageBackLink className="flex items-center gap-1 text-sm font-medium text-teal-600" />
      <h1 className="mb-1 text-lg font-semibold">Stock adjustment</h1>
      <p className="mb-5 text-sm text-muted">
        Correct on-hand qty without a purchase. Use + for found stock, − for shrinkage.
      </p>
      <div className="space-y-4">
        <FormField label="Product" required>
          <EntityPicker
            placeholder="Search product"
            options={PRODUCTS.map((p) => ({ id: p.id, label: p.name }))}
            value={productId}
            onChange={(id) => setProductId(id)}
            onClear={() => setProductId("")}
            entityLabel="product"
          />
        </FormField>
        <FormField label="Direction" required>
          <Select value={direction} onChange={(e) => setDirection(e.target.value as "add" | "remove")}>
            <option value="add">Add to stock (+)</option>
            <option value="remove">Remove from stock (−)</option>
          </Select>
        </FormField>
        <FormField label="Qty (base units)" required>
          <NumericInput {...numericQtyProps} min={0} value={qty} onChange={(v) => setQty(v > 0 ? v : 0)} />
        </FormField>
        <FormField label="Reason" required>
          <Select value={reason} onChange={(e) => setReason(e.target.value)}>
            {REASONS.map((r) => (
              <option key={r}>
                {r}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Notes (optional)">
          <Textarea placeholder="Any detail" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </FormField>
        <FormField label="Date">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </FormField>
      </div>
      <StickyBar action="Save adjustment" onAction={handleSave} loading={saving} />
    </PageShell>
  );
};
