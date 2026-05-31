import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/app/PageShell";
import { FormField } from "@/components/app/FormField";
import { StickyBar } from "@/components/app/StickyBar";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/app/NumericInput";
import { numericMoneyProps } from "@/lib/money";
import { Textarea } from "@/components/ui/textarea";
import { useSuppliers, commitSupplier } from "@/store/domain";

export const SupplierFormPage = () => {
  const navigate = useNavigate();
  const { supplierId } = useParams<{ supplierId?: string }>();
  const SUPPLIERS = useSuppliers();
  const existing = supplierId ? SUPPLIERS.find((s) => s.id === supplierId) : undefined;
  const isEdit = Boolean(supplierId);
  const notFound = isEdit && !existing;

  const [name, setName] = useState(existing?.name ?? "");
  const [phone, setPhone] = useState(existing?.phone ?? "");
  const [address, setAddress] = useState(
    [existing?.addressLine1, existing?.addressLine2].filter(Boolean).join(", ") ?? "",
  );
  const [openingPayable, setOpeningPayable] = useState(0);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Supplier name is required.");
      return;
    }
    setSaving(true);
    try {
      await commitSupplier({
        id: isEdit ? existing?.id : undefined,
        name: name.trim(),
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        payable_opening: isEdit ? undefined : openingPayable,
      });
      toast.success(isEdit ? `${name.trim()} updated.` : `${name.trim()} added.`);
      navigate("/app/suppliers");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save supplier");
    } finally {
      setSaving(false);
    }
  };

  if (notFound) {
    return (
      <PageShell>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-1 text-sm font-medium text-teal-600"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <p className="text-sm text-muted">Supplier not found.</p>
      </PageShell>
    );
  }

  return (
    <PageShell stickyBar>
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1 text-sm font-medium text-teal-600"
      >
        <ArrowLeft size={16} /> Back
      </button>
      <h1 className="mb-1 text-lg font-bold">{isEdit ? "Edit supplier" : "New supplier"}</h1>
      <p className="mb-5 text-sm text-muted">Used on purchases and supplier payments.</p>

      <div className="space-y-4">
        <FormField label="Name" required>
          <Input placeholder="e.g. ABC Distributors" value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>
        <FormField label="Phone">
          <Input type="tel" placeholder="98XXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </FormField>
        <FormField label="Address">
          <Textarea placeholder="Godown / billing address" value={address} onChange={(e) => setAddress(e.target.value)} />
        </FormField>
        {!isEdit && (
          <FormField
            label="Opening payable (NPR)"
            hint="What you already owed this supplier before using the app, if any"
          >
            <NumericInput
              {...numericMoneyProps}
              min={0}
              value={openingPayable}
              placeholder="0"
              onChange={setOpeningPayable}
            />
          </FormField>
        )}
      </div>

      <StickyBar
        action={isEdit ? "Update supplier" : "Save supplier"}
        onAction={handleSave}
        loading={saving}
        disabled={!name.trim()}
      />
    </PageShell>
  );
};
