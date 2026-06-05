import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { PageShell } from "@/components/app/PageShell";
import { FormField } from "@/components/app/FormField";
import { StickyBar } from "@/components/app/StickyBar";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/app/NumericInput";
import { numericMoneyProps } from "@/lib/money";
import { Textarea } from "@/components/ui/textarea";
import { commitSetSupplierActive, commitSupplier, useSuppliersCatalog } from "@/store/domain";
import { FormPageHeader } from "@/components/app/patterns";
import { PageBackLink } from "@/components/app/PageBackLink";
import { MasterArchiveAction } from "@/components/app/MasterArchiveAction";

export const SupplierFormPage = () => {
  const navigate = useNavigate();
  const { supplierId } = useParams<{ supplierId?: string }>();
  const SUPPLIERS = useSuppliersCatalog();
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
        <PageBackLink className="flex items-center gap-1 text-sm font-medium text-teal-600" />
        <p className="text-sm text-muted">Supplier not found.</p>
      </PageShell>
    );
  }

  return (
    <PageShell stickyBar>
      <FormPageHeader
        title={isEdit ? "Edit supplier" : "New supplier"}
        subtitle="Used on purchases and supplier payments."
      />

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

      {isEdit && existing ? (
        <div className="mt-4">
          <MasterArchiveAction
            entityLabel="supplier"
            isActive={existing.isActive}
            blockArchiveReason={
              existing.outstanding > 0.01 ? "Clear payable balance before archiving." : undefined
            }
            onSetActive={(active) => commitSetSupplierActive(existing.id, active)}
            onArchived={() => navigate("/app/suppliers")}
          />
        </div>
      ) : null}

      <StickyBar
        action={isEdit ? "Update supplier" : "Save supplier"}
        onAction={handleSave}
        loading={saving}
        disabled={!name.trim()}
      />
    </PageShell>
  );
};
