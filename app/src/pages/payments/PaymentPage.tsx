import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Circle } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/app/PageShell";
import { FormField } from "@/components/app/FormField";
import { EntityPicker } from "@/components/app/EntityPicker";
import { StickyBar } from "@/components/app/StickyBar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/app/NumericInput";
import { numericMoneyProps } from "@/lib/money";
import { Select } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { PAYMENT_MODES } from "@/domain/catalogs";
import type { Sale } from "@/domain/types";
import { useCustomers, useSales, commitPayment, commitAdvancePayment } from "@/store/domain";
import { DateDisplay } from "@/components/app/DateDisplay";
import { customerAdvanceBalance, customerReceivable } from "@/lib/customerBalance";
import { advanceReceiptConfirm, type FinancialSaveConfirmConfig } from "@/lib/financialSaveConfirm";
import { npr, toDateInput } from "@/lib/utils";
import { FormPageHeader, SegmentedTabs } from "@/components/app/patterns";
import { DateFormField } from "@/components/app/DateFormField";

type PayMode = "bills" | "advance";

type OpenBill = {
  saleId: string;
  billNo: string;
  date: string;
  total: number;
  outstanding: number;
};

function getOpenBills(sales: Sale[], customerId: string): OpenBill[] {
  return sales
    .filter((s) => s.customerId === customerId && s.balance > 0)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((s) => ({
      saleId: s.id,
      billNo: s.billNo,
      date: s.date,
      total: s.grandTotal,
      outstanding: s.balance,
    }));
}

export const PaymentPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const preId = params.get("customerId") ?? "";
  const preMode = params.get("mode") === "advance" ? "advance" : "bills";
  const CUSTOMERS = useCustomers();
  const SALES = useSales();

  const [payMode, setPayMode] = useState<PayMode>(preMode);
  const [customerId, setCustomerId] = useState(preId);
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("Cash");
  const [reference, setReference] = useState("");
  const [chequeDate, setChequeDate] = useState("");
  const [paymentDate, setPaymentDate] = useState(toDateInput());
  const [saving, setSaving] = useState(false);
  const [advanceConfirm, setAdvanceConfirm] = useState<FinancialSaveConfirmConfig | null>(null);
  const [selectedBills, setSelectedBills] = useState<Set<string>>(new Set());

  const customerOptions = CUSTOMERS.map((c) => ({ id: c.id, label: c.name, sub: c.area }));
  const selectedCustomer = CUSTOMERS.find((c) => c.id === customerId);
  const openBills = getOpenBills(SALES, customerId);
  const receivable = selectedCustomer ? customerReceivable(selectedCustomer.outstanding) : 0;
  const advanceBal = selectedCustomer ? customerAdvanceBalance(selectedCustomer.outstanding) : 0;

  const toggleBill = (saleId: string) =>
    setSelectedBills((prev) => {
      const next = new Set(prev);
      next.has(saleId) ? next.delete(saleId) : next.add(saleId);
      return next;
    });

  const enteredAmt = Number(amount) || 0;
  const selectedAmt = openBills
    .filter((b) => selectedBills.has(b.saleId))
    .reduce((s, b) => s + b.outstanding, 0);

  const allocation = (() => {
    let remaining = enteredAmt;
    return openBills.map((bill) => {
      if (!selectedBills.has(bill.saleId) || remaining <= 0) return { ...bill, allocated: 0 };
      const pay = Math.min(remaining, bill.outstanding);
      remaining -= pay;
      return { ...bill, allocated: pay };
    });
  })();

  const totalAllocated = allocation.reduce((s, b) => s + b.allocated, 0);

  const performBillPayment = async () => {
    const billNos = openBills.filter((b) => selectedBills.has(b.saleId)).map((b) => b.billNo).join(", ");
    await commitPayment({
      customerId,
      amount: enteredAmt,
      mode,
      reference,
      date: paymentDate,
      allocations: allocation
        .filter((b) => b.allocated > 0)
        .map((b) => ({ saleId: b.saleId, amount: b.allocated, billNo: b.billNo })),
    });
    toast.success(`${npr(enteredAmt)} recorded against ${billNos}`);
    navigate(-1);
  };

  const performAdvancePayment = async () => {
    await commitAdvancePayment({
      customerId,
      amount: enteredAmt,
      mode,
      reference,
      date: paymentDate,
    });
    toast.success(`Advance ${npr(enteredAmt)} recorded on account.`);
    navigate(-1);
  };

  const handleSave = () => {
    if (!customerId) {
      toast.error("Choose a customer.");
      return;
    }
    if (!enteredAmt || enteredAmt <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    if (mode === "Cheque" && !reference) {
      toast.error("Enter cheque number.");
      return;
    }

    if (payMode === "bills") {
      if (selectedBills.size === 0) {
        toast.error("Select at least one bill, or use the Advance tab.");
        return;
      }
      if (enteredAmt > selectedAmt + 0.01) {
        toast.error(`Amount exceeds selected bills (${npr(selectedAmt)}). Reduce amount or select more bills.`);
        return;
      }
      void (async () => {
        setSaving(true);
        try {
          await performBillPayment();
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Payment failed");
        } finally {
          setSaving(false);
        }
      })();
      return;
    }

    setAdvanceConfirm(advanceReceiptConfirm(enteredAmt));
  };

  const subtitle =
    payMode === "bills"
      ? "Record collection against open sales invoices."
      : "Record advance when the customer paid before billing.";

  return (
    <PageShell stickyBar>
      <FormPageHeader title="Payment in" subtitle={subtitle} />

      <SegmentedTabs
        value={payMode}
        onChange={setPayMode}
        className="mb-4"
        options={[
          { id: "bills", label: "Against bills" },
          { id: "advance", label: "Advance only" },
        ]}
      />

      <div className="space-y-4">
        <FormField label="Customer" required>
          <EntityPicker
            placeholder="Search customers"
            options={customerOptions}
            value={customerId}
            onChange={(id) => {
              setCustomerId(id);
              setAmount("");
              setSelectedBills(new Set());
            }}
            onClear={() => {
              setCustomerId("");
              setSelectedBills(new Set());
            }}
            entityLabel="customer"
          />
        </FormField>

        {selectedCustomer && (
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg border border-warning/20 bg-warning-light px-3 py-2">
              <p className="text-[10px] font-semibold uppercase text-warning-foreground/80">Receivable</p>
              <p className="font-bold text-warning-foreground">{npr(receivable)}</p>
            </div>
            <div className="rounded-lg border border-info/20 bg-info-light px-3 py-2">
              <p className="text-[10px] font-semibold uppercase text-info-foreground/80">Advance</p>
              <p className="font-bold text-info-foreground">{npr(advanceBal)}</p>
            </div>
          </div>
        )}

        {payMode === "bills" && openBills.length > 0 && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Apply to bills</p>
                <p className="text-xs text-muted">Select invoices this receipt settles</p>
              </div>
              <button
                type="button"
                className="text-xs text-teal-600 hover:underline"
                onClick={() =>
                  selectedBills.size === openBills.length
                    ? setSelectedBills(new Set())
                    : setSelectedBills(new Set(openBills.map((b) => b.saleId)))
                }
              >
                {selectedBills.size === openBills.length ? "Deselect all" : "Select all"}
              </button>
            </div>

            <Card>
              <CardContent className="p-0">
                {allocation.map((bill, i) => {
                  const isSelected = selectedBills.has(bill.saleId);
                  const fullyPaid = isSelected && bill.allocated >= bill.outstanding;
                  const partial = isSelected && bill.allocated > 0 && bill.allocated < bill.outstanding;
                  return (
                    <div
                      key={bill.saleId}
                      onClick={() => toggleBill(bill.saleId)}
                      className={`flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-slate-50 ${i < allocation.length - 1 ? "border-b border-border-subtle" : ""} ${isSelected ? "bg-teal-50/40" : ""}`}
                    >
                      <span className="mt-0.5 shrink-0 text-teal-600">
                        {isSelected ? <CheckCircle2 size={18} /> : <Circle size={18} className="text-slate-300" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-foreground">{bill.billNo}</span>
                          <span className="text-sm font-semibold text-foreground">{npr(bill.outstanding)}</span>
                        </div>
                        <p className="text-xs text-muted">
                          <DateDisplay iso={bill.date} dual compact /> · {npr(bill.total)}
                        </p>
                        {isSelected && enteredAmt > 0 && (
                          <div
                            className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${fullyPaid ? "bg-success-light text-success-foreground" : partial ? "bg-warning-light text-warning-foreground" : "bg-slate-100 text-slate-500"}`}
                          >
                            {fullyPaid
                              ? `Settled ${npr(bill.allocated)}`
                              : partial
                                ? `Partial ${npr(bill.allocated)} of ${npr(bill.outstanding)}`
                                : "No amount left"}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
            <p className="mt-1.5 text-xs text-muted">
              Selected: {npr(selectedAmt)} across {selectedBills.size} bill{selectedBills.size !== 1 ? "s" : ""}
            </p>
          </div>
        )}

        {payMode === "bills" && openBills.length === 0 && customerId && (
          <div className="rounded-xl border border-border-subtle bg-surface-muted/30 px-4 py-3 text-sm text-muted">
            No open invoices. Use <strong className="text-foreground">Advance only</strong> if the customer paid
            before billing, or raise a sales invoice first.
          </div>
        )}

        {payMode === "advance" && customerId && (
          <p className="rounded-lg border border-info/20 bg-info-light px-3 py-2 text-xs text-info-foreground leading-snug">
            Advance is applied automatically to this customer&apos;s next sales invoice (up to the invoice total).
          </p>
        )}

        <DateFormField label="Receipt date" value={paymentDate} onChange={setPaymentDate} />

        <FormField label="Amount received (NPR)" required>
          <NumericInput
            {...numericMoneyProps}
            min={0}
            value={Number(amount) || 0}
            onChange={(v) => setAmount(v === 0 ? "" : String(v))}
          />
        </FormField>

        <FormField label="Payment mode" required>
          <Select value={mode} onChange={(e) => setMode(e.target.value)}>
            {PAYMENT_MODES.map((m) => (
              <option key={m}>{m}</option>
            ))}
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
          <DateFormField label="Expected clearing date" value={chequeDate} onChange={setChequeDate} />
        )}
      </div>

      <ConfirmDialog
        open={advanceConfirm !== null}
        title={advanceConfirm?.title ?? ""}
        description={advanceConfirm?.content}
        confirmLabel={advanceConfirm?.confirmLabel ?? "Confirm"}
        cancelLabel="Cancel"
        loading={saving}
        onConfirm={() => {
          void (async () => {
            setSaving(true);
            try {
              await performAdvancePayment();
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Advance failed");
            } finally {
              setSaving(false);
              setAdvanceConfirm(null);
            }
          })();
        }}
        onCancel={() => {
          if (!saving) setAdvanceConfirm(null);
        }}
      />

      <StickyBar
        rows={[["Received", npr(enteredAmt)]]}
        action={payMode === "advance" ? "Save advance" : "Save payment"}
        onAction={handleSave}
        loading={saving}
        disabled={
          !customerId ||
          !enteredAmt ||
          (payMode === "bills" && (openBills.length === 0 || selectedBills.size === 0))
        }
      />
    </PageShell>
  );
};
