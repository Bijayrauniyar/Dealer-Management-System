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
import { useCustomers, commitCustomer } from "@/store/domain";
import { FormPageHeader } from "@/components/app/patterns";

export const CustomerFormPage = () => {
  const navigate = useNavigate();
  const { customerId } = useParams<{ customerId?: string }>();
  const CUSTOMERS = useCustomers();
  const existing = customerId ? CUSTOMERS.find((c) => c.id === customerId) : undefined;
  const isEdit = Boolean(existing);

  const [name, setName] = useState(existing?.name ?? "");
  const [phone, setPhone] = useState(existing?.phone ?? "");
  const [area, setArea] = useState(existing?.area ?? "");
  const [address, setAddress] = useState(existing?.address ?? "");
  const [creditLimit, setCreditLimit] = useState(existing?.creditLimit ?? 0);
  const [panNumber, setPanNumber] = useState(existing?.panNumber ?? "");
  const [vatNumber, setVatNumber] = useState(existing?.vatNumber ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Customer name is required.");
      return;
    }
    setSaving(true);
    try {
      const id = await commitCustomer({
        id: isEdit ? existing?.id : undefined,
        name: name.trim(),
        phone: phone.trim(),
        area: area.trim(),
        address: address.trim(),
        creditLimit,
        panNumber: panNumber.trim(),
        vatNumber: vatNumber.trim(),
      });
      toast.success(isEdit ? `${name} updated.` : `${name} added.`);
      navigate(isEdit ? `/app/customers/${id}` : "/app/customers");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save customer");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell stickyBar>
      <FormPageHeader
        title={isEdit ? `Edit ${existing?.name}` : "New customer"}
        subtitle={
          isEdit ? "Update shop details." : "Add a customer to use on bills and payments."
        }
      />

      <div className="space-y-4">
        <FormField label="Shop / customer name" required>
          <Input
            placeholder="e.g. Ghantaghar Stores"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </FormField>
        <FormField label="Phone">
          <Input
            type="tel"
            placeholder="98XXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </FormField>
        <FormField label="Area / locality">
          <Input placeholder="e.g. Birgunj" value={area} onChange={(e) => setArea(e.target.value)} />
        </FormField>
        <FormField label="Full address">
          <Textarea
            placeholder="Street, ward, district"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={2}
          />
        </FormField>
        <FormField label="Customer PAN (optional)">
          <Input
            value={panNumber}
            onChange={(e) => setPanNumber(e.target.value)}
            maxLength={9}
            placeholder="Buyer PAN"
          />
        </FormField>
        <FormField label="Customer VAT no. (optional)">
          <Input
            value={vatNumber}
            onChange={(e) => setVatNumber(e.target.value)}
            placeholder="Buyer VAT number"
          />
        </FormField>
        <FormField label="Credit limit (NPR)" hint="0 = no limit">
          <NumericInput
            {...numericMoneyProps}
            min={0}
            value={creditLimit}
            placeholder="0"
            onChange={setCreditLimit}
          />
        </FormField>
      </div>

      <StickyBar
        action={isEdit ? "Update customer" : "Add customer"}
        onAction={() => void handleSave()}
        loading={saving}
      />
    </PageShell>
  );
};
