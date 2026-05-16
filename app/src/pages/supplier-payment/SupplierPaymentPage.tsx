import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Circle } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/app/PageShell";
import { FormField } from "@/components/app/FormField";
import { EntityPicker } from "@/components/app/EntityPicker";
import { StickyBar } from "@/components/app/StickyBar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PAYMENT_MODES } from "@/domain/catalogs";
import type { Supplier } from "@/domain/types";
import { useSuppliers, commitSupplierPayment } from "@/store/domain";
import { npr, fmtDate, toDateInput } from "@/lib/utils";

/** Single allocation bucket from live supplier outstanding (Supabase); not a separate invoice table in v1. */
type OpenInvoice = {
  id: string;
  invoiceNo: string;
  date: string;
  total: number;
  outstanding: number;
};

function getOpenInvoices(supplierId: string, suppliers: Supplier[]): OpenInvoice[] {
  const supplier = suppliers.find((s) => s.id === supplierId);
  if (!supplier || supplier.outstanding === 0) return [];
  const amt = supplier.outstanding;
  return [
    {
      id:          `${supplierId}-inv-1`,
      invoiceNo:   `INV-${supplierId.toUpperCase()}-001`,
      date:        new Date().toISOString().slice(0, 10),
      total:       amt,
      outstanding: amt,
    },
  ];
}

export const SupplierPaymentPage = () => {
  const navigate  = useNavigate();
  const SUPPLIERS = useSuppliers();

  const [supplierId, setSupplierId] = useState("");
  const [amount, setAmount]         = useState("");
  const [mode, setMode]             = useState("Cash");
  const [reference, setReference]   = useState("");
  const [chequeDate, setChequeDate] = useState("");
  const [date, setDate]             = useState(toDateInput());
  const [saving, setSaving]         = useState(false);

  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());

  const supplierOptions  = SUPPLIERS.map((s) => ({ id: s.id, label: s.name, sub: `${s.paymentTermsDays}d terms` }));
  const selectedSupplier = SUPPLIERS.find((s) => s.id === supplierId);
  const openInvoices     = getOpenInvoices(supplierId, SUPPLIERS);

  // Pre-select all invoices when supplier / outstanding changes
  useEffect(() => {
    if (supplierId) setSelectedInvoices(new Set(openInvoices.map((inv) => inv.id)));
  }, [supplierId, openInvoices]);

  const toggleInvoice = (id: string) =>
    setSelectedInvoices((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const enteredAmt    = Number(amount) || 0;
  const selectedTotal = openInvoices
    .filter((inv) => selectedInvoices.has(inv.id))
    .reduce((s, inv) => s + inv.outstanding, 0);

  // FIFO allocation across selected invoices (oldest first)
  const allocation = (() => {
    let remaining = enteredAmt;
    return openInvoices.map((inv) => {
      if (!selectedInvoices.has(inv.id) || remaining <= 0) return { ...inv, allocated: 0 };
      const pay = Math.min(remaining, inv.outstanding);
      remaining -= pay;
      return { ...inv, allocated: pay };
    });
  })();

  const totalAllocated = allocation.reduce((s, inv) => s + inv.allocated, 0);
  const unallocated    = Math.max(0, enteredAmt - totalAllocated);

  const handleSave = async () => {
    if (!supplierId) { toast.error("Choose a supplier."); return; }
    if (!enteredAmt || enteredAmt <= 0) { toast.error("Enter a valid amount."); return; }
    if (!selectedSupplier || selectedSupplier.outstanding <= 0) {
      toast.error("This supplier has no outstanding balance to pay.");
      return;
    }
    if (openInvoices.length > 0 && selectedInvoices.size === 0) {
      toast.error("Select at least one invoice.");
      return;
    }
    if (mode === "Cheque" && !reference) { toast.error("Enter cheque number."); return; }
    const payAmount =
      openInvoices.length > 0
        ? totalAllocated
        : Math.min(enteredAmt, selectedSupplier.outstanding);
    if (payAmount <= 0) {
      toast.error("Enter an amount to apply.");
      return;
    }
    setSaving(true);
    try {
      await commitSupplierPayment({
        supplierId,
        amount: payAmount,
        paymentDate: date,
        mode,
        notes: reference?.trim() || null,
      });
      const invNos = openInvoices
        .filter((inv) => selectedInvoices.has(inv.id) && allocation.find((a) => a.id === inv.id)!.allocated > 0)
        .map((inv) => inv.invoiceNo)
        .join(", ");
      toast.success(`${npr(payAmount)} recorded — ${invNos || "supplier account"}`);
      navigate("/app/home");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell stickyBar>
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm font-medium text-teal-600">
        <ArrowLeft size={16} /> Back
      </button>
      <h1 className="mb-5 text-lg font-semibold">Supplier payment</h1>

      <div className="space-y-4">
        {/* ── Supplier ── */}
        <FormField label="Supplier" required>
          <EntityPicker
            placeholder="Search supplier"
            options={supplierOptions}
            value={supplierId}
            onChange={(id) => {
              setSupplierId(id);
              setAmount("");
            }}
            onClear={() => {
              setSupplierId("");
              setSelectedInvoices(new Set());
            }}
            entityLabel="supplier"
            onCreateNew={() => navigate("/app/suppliers/new")}
          />
        </FormField>

        {selectedSupplier && (
          <div className="rounded-lg bg-info-light border border-info/20 px-3 py-2 text-sm">
            <span className="font-medium text-info-foreground">Total payable: </span>
            <span className="font-bold text-info-foreground">{npr(selectedSupplier.outstanding)}</span>
            <span className="ml-2 text-xs text-info-foreground/70">· {selectedSupplier.paymentTermsDays}d terms</span>
          </div>
        )}

        {/* ── Open invoices ── */}
        {openInvoices.length > 0 && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">Apply to invoices</p>
              <button
                className="text-xs text-teal-600 hover:underline"
                onClick={() =>
                  selectedInvoices.size === openInvoices.length
                    ? setSelectedInvoices(new Set())
                    : setSelectedInvoices(new Set(openInvoices.map((inv) => inv.id)))
                }
              >
                {selectedInvoices.size === openInvoices.length ? "Deselect all" : "Select all"}
              </button>
            </div>

            <Card>
              <CardContent className="p-0">
                {allocation.map((inv, i) => {
                  const isSelected = selectedInvoices.has(inv.id);
                  const fullyPaid  = isSelected && inv.allocated >= inv.outstanding;
                  const partial    = isSelected && inv.allocated > 0 && inv.allocated < inv.outstanding;
                  return (
                    <div
                      key={inv.id}
                      onClick={() => toggleInvoice(inv.id)}
                      className={`flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-slate-50 ${i < allocation.length - 1 ? "border-b border-border-subtle" : ""} ${isSelected ? "bg-teal-50/40" : ""}`}
                    >
                      <span className="mt-0.5 shrink-0 text-teal-600">
                        {isSelected
                          ? <CheckCircle2 size={18} />
                          : <Circle size={18} className="text-slate-300" />}
                      </span>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-foreground">{inv.invoiceNo}</span>
                          <span className="text-sm font-semibold text-foreground">{npr(inv.outstanding)}</span>
                        </div>
                        <p className="text-xs text-muted">{fmtDate(inv.date)} · invoice total {npr(inv.total)}</p>

                        {isSelected && enteredAmt > 0 && (
                          <div className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${fullyPaid ? "bg-success-light text-success-foreground" : partial ? "bg-warning-light text-warning-foreground" : "bg-slate-100 text-slate-500"}`}>
                            {fullyPaid
                              ? `✓ Fully cleared (${npr(inv.allocated)})`
                              : partial
                              ? `Partial — ${npr(inv.allocated)} of ${npr(inv.outstanding)}`
                              : "No amount left to allocate"}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
            <p className="mt-1.5 text-xs text-muted">
              Selected: {npr(selectedTotal)} payable across {selectedInvoices.size} invoice{selectedInvoices.size !== 1 ? "s" : ""}
            </p>
          </div>
        )}

        {openInvoices.length === 0 && supplierId && (
          <div className="rounded-xl bg-success-light border border-success/20 px-4 py-3 text-sm text-success-foreground">
            No open invoices — this supplier has no outstanding balance.
          </div>
        )}

        {/* ── Amount ── */}
        <FormField label="Amount (NPR)" required>
          <Input
            type="number" min={0}
            placeholder={selectedTotal > 0 ? `Max ${selectedTotal}` : "0"}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </FormField>

        {unallocated > 0 && (
          <div className="rounded-lg bg-info-light border border-info/20 px-3 py-2 text-sm text-info-foreground">
            <strong>{npr(unallocated)}</strong> excess — will be kept as advance payment to supplier.
          </div>
        )}

        {/* ── Mode ── */}
        <FormField label="Payment mode" required>
          <Select value={mode} onChange={(e) => setMode(e.target.value)}>
            {PAYMENT_MODES.map((m) => <option key={m}>{m}</option>)}
          </Select>
        </FormField>

        <FormField label={mode === "Cheque" ? "Cheque no.*" : "Reference / UTR (optional)"}>
          <Input
            placeholder={mode === "Cheque" ? "Cheque number" : "e.g. TXN-23891"}
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
        </FormField>

        {mode === "Cheque" && (
          <FormField label="Expected clearing date">
            <Input type="date" value={chequeDate} onChange={(e) => setChequeDate(e.target.value)} />
          </FormField>
        )}

        <FormField label="Payment date">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </FormField>
      </div>

      <StickyBar
        rows={[
          ["Paying", npr(enteredAmt)],
          ...(unallocated > 0 ? [["Advance", npr(unallocated)] as [string, string]] : []),
        ]}
        action="Save payment"
        onAction={handleSave}
        loading={saving}
        disabled={!supplierId || !enteredAmt}
      />
    </PageShell>
  );
};
