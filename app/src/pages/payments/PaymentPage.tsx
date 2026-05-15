import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { PAYMENT_MODES, type Sale } from "@/data/dummy";
import { useCustomers, useSales, commitPayment } from "@/store/domain";
import { npr, fmtDate } from "@/lib/utils";

// Simulated open bills per customer (bill total = outstanding for demo)
type OpenBill = {
  saleId: string;
  billNo: string;
  date: string;
  total: number;
  outstanding: number; // remaining unpaid on this bill
};

function getOpenBills(sales: Sale[], customerId: string): OpenBill[] {
  return sales
    .filter((s) => s.customerId === customerId && s.balance > 0)
    .sort((a, b) => a.date.localeCompare(b.date))          // FIFO — oldest first
    .map((s) => ({
      saleId:      s.id,
      billNo:      s.billNo,
      date:        s.date,
      total:       s.grandTotal,
      outstanding: s.balance,
    }));
}

export const PaymentPage = () => {
  const navigate  = useNavigate();
  const [params]  = useSearchParams();
  const preId     = params.get("customerId") ?? "";
  const CUSTOMERS = useCustomers();
  const SALES     = useSales();

  const [customerId, setCustomerId] = useState(preId);
  const [amount, setAmount]         = useState("");
  const [mode, setMode]             = useState("Cash");
  const [reference, setReference]   = useState("");
  const [chequeDate, setChequeDate] = useState("");
  const [saving, setSaving]         = useState(false);

  // Which bills are selected for this payment
  const [selectedBills, setSelectedBills] = useState<Set<string>>(new Set());

  const customerOptions  = CUSTOMERS.map((c) => ({ id: c.id, label: c.name, sub: c.area }));
  const selectedCustomer = CUSTOMERS.find((c) => c.id === customerId);
  const openBills        = getOpenBills(SALES, customerId);

  // No auto-selection — the dealer manually ticks which bills this payment applies to.

  const toggleBill = (saleId: string) =>
    setSelectedBills((prev) => {
      const next = new Set(prev);
      next.has(saleId) ? next.delete(saleId) : next.add(saleId);
      return next;
    });

  const enteredAmt  = Number(amount) || 0;
  const selectedAmt = openBills
    .filter((b) => selectedBills.has(b.saleId))
    .reduce((s, b) => s + b.outstanding, 0);

  // Running allocation: how much of the entered amount lands on each selected bill (FIFO order)
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
  const unallocated    = Math.max(0, enteredAmt - totalAllocated);

  const handleSave = async () => {
    if (!customerId)               { toast.error("Choose a customer.");          return; }
    if (!enteredAmt || enteredAmt <= 0) { toast.error("Enter a valid amount."); return; }
    if (selectedBills.size === 0)  { toast.error("Select at least one bill.");   return; }
    if (mode === "Cheque" && !reference) { toast.error("Enter cheque number."); return; }
    setSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 200));
      const billNos = openBills.filter((b) => selectedBills.has(b.saleId)).map((b) => b.billNo).join(", ");
      await commitPayment({
        customerId,
        amount:    enteredAmt,
        mode,
        reference,
        date:      new Date().toISOString().slice(0, 10),
        allocations: allocation
          .filter((b) => b.allocated > 0)
          .map((b)  => ({ saleId: b.saleId, amount: b.allocated, billNo: b.billNo })),
      });
      toast.success(`${npr(enteredAmt)} recorded against ${billNos}`);
      navigate(-1);
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
      <h1 className="mb-5 text-lg font-semibold">Payment received</h1>

      <div className="space-y-4">
        {/* ── Customer ── */}
        <FormField label="Customer" required>
          <EntityPicker
            placeholder="Search customers"
            options={customerOptions}
            value={customerId}
            onChange={(id) => { setCustomerId(id); setAmount(""); setSelectedBills(new Set()); }}
            onClear={() => { setCustomerId(""); setSelectedBills(new Set()); }}
            entityLabel="customer"
          />
        </FormField>

        {selectedCustomer && (
          <div className="rounded-lg bg-warning-light border border-warning/20 px-3 py-2 text-sm">
            <span className="font-medium text-warning-foreground">Total outstanding: </span>
            <span className="font-bold text-warning-foreground">{npr(selectedCustomer.outstanding)}</span>
            <span className="ml-2 text-xs text-warning-foreground/70">· oldest {selectedCustomer.oldestBillDays}d</span>
          </div>
        )}

        {/* ── Open bills – select which to settle ── */}
        {openBills.length > 0 && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Apply to bills</p>
                <p className="text-xs text-muted">Tick the bills this payment is for</p>
              </div>
              <button
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
                  const fullyPaid  = isSelected && bill.allocated >= bill.outstanding;
                  const partial    = isSelected && bill.allocated > 0 && bill.allocated < bill.outstanding;
                  return (
                    <div
                      key={bill.saleId}
                      onClick={() => toggleBill(bill.saleId)}
                      className={`flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-slate-50 ${i < allocation.length - 1 ? "border-b border-border-subtle" : ""} ${isSelected ? "bg-teal-50/40" : ""}`}
                    >
                      {/* Checkbox */}
                      <span className="mt-0.5 shrink-0 text-teal-600">
                        {isSelected ? <CheckCircle2 size={18} /> : <Circle size={18} className="text-slate-300" />}
                      </span>

                      {/* Bill info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-foreground">{bill.billNo}</span>
                          <span className="text-sm font-semibold text-foreground">{npr(bill.outstanding)}</span>
                        </div>
                        <p className="text-xs text-muted">{fmtDate(bill.date)} · bill total {npr(bill.total)}</p>

                        {/* Allocation preview */}
                        {isSelected && enteredAmt > 0 && (
                          <div className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${fullyPaid ? "bg-success-light text-success-foreground" : partial ? "bg-warning-light text-warning-foreground" : "bg-slate-100 text-slate-500"}`}>
                            {fullyPaid
                              ? `✓ Fully settled (${npr(bill.allocated)})`
                              : partial
                              ? `Partial — ${npr(bill.allocated)} of ${npr(bill.outstanding)}`
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
              Selected: {npr(selectedAmt)} outstanding across {selectedBills.size} bill{selectedBills.size !== 1 ? "s" : ""}
            </p>
          </div>
        )}

        {openBills.length === 0 && customerId && (
          <div className="rounded-xl bg-success-light border border-success/20 px-4 py-3 text-sm text-success-foreground">
            No open bills — this customer has no outstanding balance.
          </div>
        )}

        {/* ── Amount ── */}
        <FormField label="Amount received (NPR)" required>
          <Input
            type="number" min={0}
            placeholder={selectedAmt > 0 ? `Max ${selectedAmt}` : "0"}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </FormField>

        {unallocated > 0 && (
          <div className="rounded-lg bg-info-light border border-info/20 px-3 py-2 text-sm text-info-foreground">
            <strong>{npr(unallocated)}</strong> unallocated — will be kept as advance credit.
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
      </div>

      <StickyBar
        rows={[
          ["Received", npr(enteredAmt)],
          ...(unallocated > 0 ? [["Advance credit", npr(unallocated)] as [string, string]] : []),
        ]}
        action="Save payment"
        onAction={handleSave}
        loading={saving}
        disabled={!customerId || !enteredAmt || selectedBills.size === 0}
      />
    </PageShell>
  );
};
