import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/app/PageShell";
import { FormField } from "@/components/app/FormField";
import { EntityPicker } from "@/components/app/EntityPicker";
import { StickyBar } from "@/components/app/StickyBar";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useProducts } from "@/store/domain";
import { toDateInput } from "@/lib/utils";

export const SchemePage = () => {
  const navigate  = useNavigate();
  const PRODUCTS  = useProducts();
  const [name, setName]               = useState("");
  const [productId, setProductId]     = useState("");
  const [discountType, setType]       = useState("percent");
  const [discountValue, setDValue]    = useState("");
  const [startDate, setStart]         = useState(toDateInput());
  const [endDate, setEnd]             = useState("");
  const [notes, setNotes]             = useState("");
  const [saving, setSaving]           = useState(false);

  const handleSave = async () => {
    if (!name) { toast.error("Enter a scheme name."); return; }
    if (!productId) { toast.error("Choose a product."); return; }
    if (!endDate) { toast.error("Set an end date."); return; }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    toast.success("Scheme saved.");
    navigate("/app/home");
  };

  return (
    <PageShell stickyBar>
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm font-medium text-teal-600">
        <ArrowLeft size={16} /> Back
      </button>
      <h1 className="mb-5 text-lg font-semibold">Scheme entry</h1>
      <div className="space-y-4">
        <FormField label="Scheme name" required>
          <Input placeholder="e.g. Summer mango offer" value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>
        <FormField label="Product" required>
          <EntityPicker placeholder="Search product" options={PRODUCTS.map((p) => ({ id: p.id, label: p.name }))}
            value={productId} onChange={(id) => setProductId(id)} onClear={() => setProductId("")} entityLabel="product" />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Discount type">
            <Select value={discountType} onChange={(e) => setType(e.target.value)}>
              <option value="percent">Percent (%)</option>
              <option value="flat">Flat (NPR)</option>
            </Select>
          </FormField>
          <FormField label={discountType === "percent" ? "Discount %" : "Flat NPR"} required>
            <Input type="number" min={0} placeholder="0" value={discountValue} onChange={(e) => setDValue(e.target.value)} />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Start date"><Input type="date" value={startDate} onChange={(e) => setStart(e.target.value)} /></FormField>
          <FormField label="End date" required><Input type="date" value={endDate} onChange={(e) => setEnd(e.target.value)} /></FormField>
        </div>
        <FormField label="Notes"><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></FormField>
      </div>
      <StickyBar action="Save scheme" onAction={handleSave} loading={saving} />
    </PageShell>
  );
};
