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
import { DAMAGE_REASONS } from "@/domain/catalogs";
import { useProducts, commitDamageEntry } from "@/store/domain";
import { toDateInput } from "@/lib/utils";
import { PageBackLink } from "@/components/app/PageBackLink";

export const DamagePage = () => {
  const navigate  = useNavigate();
  const PRODUCTS  = useProducts();
  const [productId, setProductId] = useState("");
  const [qty, setQty]             = useState(1);
  const [reason, setReason]       = useState(DAMAGE_REASONS[0]);
  const [notes, setNotes]         = useState("");
  const [date, setDate]           = useState(toDateInput());
  const [saving, setSaving]       = useState(false);

  const handleSave = async () => {
    if (!productId) { toast.error("Choose a product."); return; }
    setSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 200));
      await commitDamageEntry({
        productId,
        qty: qty || 1,
        reason,
        notes: notes || undefined,
      });
      toast.success("Damage entry recorded.");
      navigate("/app/home");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell stickyBar>
      <PageBackLink className="flex items-center gap-1 text-sm font-medium text-teal-600" />
      <h1 className="mb-5 text-lg font-semibold">Damage entry</h1>
      <div className="space-y-4">
        <FormField label="Product" required>
          <EntityPicker placeholder="Search product" options={PRODUCTS.map((p) => ({ id: p.id, label: p.name }))}
            value={productId} onChange={(id) => setProductId(id)} onClear={() => setProductId("")} entityLabel="product" />
        </FormField>
        <FormField label="Qty" required>
          <NumericInput
            {...numericQtyProps}
            min={0}
            value={qty}
            onChange={(v) => setQty(v > 0 ? v : 0)}
          />
        </FormField>
        <FormField label="Reason" required>
          <Select value={reason} onChange={(e) => setReason(e.target.value)}>
            {DAMAGE_REASONS.map((r) => <option key={r}>{r}</option>)}
          </Select>
        </FormField>
        <FormField label="Notes (optional)">
          <Textarea placeholder="Any detail" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </FormField>
        <FormField label="Date">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </FormField>
      </div>
      <StickyBar action="Save damage" onAction={handleSave} loading={saving} />
    </PageShell>
  );
};
