import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/app/PageShell";
import { FormField } from "@/components/app/FormField";
import { StickyBar } from "@/components/app/StickyBar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { commitNewSupplier } from "@/store/domain";

export const SupplierFormPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [openingPayable, setOpeningPayable] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Supplier name is required.");
      return;
    }
    setSaving(true);
    try {
      await commitNewSupplier({
        name: name.trim(),
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        payable_opening: Number(openingPayable) || 0,
      });
      toast.success(`${name.trim()} added.`);
      navigate("/app/suppliers");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save supplier");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell stickyBar>
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1 text-sm font-medium text-teal-600"
      >
        <ArrowLeft size={16} /> Back
      </button>
      <h1 className="mb-1 text-lg font-bold">New supplier</h1>
      <p className="mb-5 text-sm text-muted">Used on purchases and supplier payments.</p>

      <div className="space-y-4">
        <FormField label="Name" required>
          <Input placeholder="e.g. Havmor distributor" value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>
        <FormField label="Phone">
          <Input type="tel" placeholder="98XXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </FormField>
        <FormField label="Address">
          <Textarea placeholder="Godown / billing address" value={address} onChange={(e) => setAddress(e.target.value)} />
        </FormField>
        <FormField
          label="Opening payable (NPR)"
          hint="What you already owed this supplier before using the app, if any"
        >
          <Input
            type="number"
            min={0}
            placeholder="0"
            value={openingPayable}
            onChange={(e) => setOpeningPayable(e.target.value)}
          />
        </FormField>
      </div>

      <StickyBar action="Save supplier" onAction={handleSave} loading={saving} disabled={!name.trim()} />
    </PageShell>
  );
};
