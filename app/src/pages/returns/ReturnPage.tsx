import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {Minus, Plus} from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/app/PageShell";
import { FormField } from "@/components/app/FormField";
import { EntityPicker } from "@/components/app/EntityPicker";
import { StickyBar } from "@/components/app/StickyBar";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useCustomers, useSales, commitReturn } from "@/store/domain";
import { roundMoney } from "@/lib/money";
import { npr, fmtDate } from "@/lib/utils";
import { PageBackLink } from "@/components/app/PageBackLink";

type ReturnLine = {
  productId:   string;
  productName: string;
  soldQty:     number;
  rate:        number;
  discountPct: number; // carry from original bill line
  returnQty:   number; // 0 = not returning this item
};

export const ReturnPage = () => {
  const navigate  = useNavigate();
  const CUSTOMERS = useCustomers();
  const SALES     = useSales();

  const [customerId, setCustomerId] = useState("");
  const [saleId, setSaleId]         = useState("");
  const [lines, setLines]           = useState<ReturnLine[]>([]);
  const [reason, setReason]         = useState("");
  const [saving, setSaving]         = useState(false);

  const customerOptions = CUSTOMERS.map((c) => ({ id: c.id, label: c.name, sub: c.area }));

  // Bills for selected customer
  const customerBills = SALES.filter((s) => s.customerId === customerId);
  const billOptions   = customerBills.map((s) => ({
    id:  s.id,
    label: s.billNo,
    sub: `${fmtDate(s.date)} · ${npr(s.total)}`,
  }));

  const selectedBill = SALES.find((s) => s.id === saleId);

  // When a bill is selected, populate return lines from its line items
  const handleBillSelect = (id: string) => {
    setSaleId(id);
    const bill = SALES.find((s) => s.id === id);
    if (!bill) { setLines([]); return; }
    setLines(
      bill.lines.map((l) => ({
        productId:   l.productId,
        productName: l.productName,
        soldQty:     l.qty,
        rate:        l.rate,
        discountPct: l.discountPct ?? 0,   // carry from original bill
        returnQty:   0,
      })),
    );
  };

  const setReturnQty = (productId: string, delta: number) =>
    setLines((prev) =>
      prev.map((l) =>
        l.productId === productId
          ? { ...l, returnQty: Math.min(Math.max(0, l.returnQty + delta), l.soldQty) }
          : l,
      ),
    );

  const returnLines  = lines.filter((l) => l.returnQty > 0);
  // Bug fix: apply per-line discount same as original billing so credit = what customer paid
  const lineCredit   = (l: ReturnLine) =>
    roundMoney(l.returnQty * l.rate * (1 - (l.discountPct ?? 0) / 100));
  const creditAmount   = returnLines.reduce((s, l) => s + lineCredit(l), 0);
  const totalReturnQty = returnLines.reduce((s, l) => s + l.returnQty, 0);

  const handleSave = async () => {
    if (!customerId)              { toast.error("Choose a customer."); return; }
    if (!saleId)                  { toast.error("Select a bill."); return; }
    if (returnLines.length === 0) { toast.error("Select at least one product to return."); return; }
    setSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 200));
      const bill = SALES.find((s) => s.id === saleId);
      await commitReturn({
        customerId,
        saleId,
        billNo:       bill?.billNo ?? "",
        creditAmount,
        lines:        returnLines.map((l) => ({ productId: l.productId, returnQty: l.returnQty })),
      });
      toast.success(`Return saved · ${totalReturnQty} item(s) · credit ${npr(creditAmount)}`);
      navigate(-1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Return failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell stickyBar>
      <PageBackLink className="flex items-center gap-1 text-sm font-medium text-teal-600" />
      <h1 className="mb-5 text-lg font-semibold">Return entry</h1>

      <div className="space-y-4">
        {/* ── Customer ── */}
        <FormField label="Customer" required>
          <EntityPicker
            placeholder="Search customers"
            options={customerOptions}
            value={customerId}
            onChange={(id) => { setCustomerId(id); setSaleId(""); setLines([]); }}
            onClear={() => { setCustomerId(""); setSaleId(""); setLines([]); }}
            entityLabel="customer"
          />
        </FormField>

        {/* ── Bill ── */}
        <FormField label="Bill to return against" required>
          <EntityPicker
            placeholder={customerId ? "Select bill" : "Choose customer first"}
            options={billOptions}
            value={saleId}
            onChange={(id) => handleBillSelect(id)}
            onClear={() => { setSaleId(""); setLines([]); }}
            entityLabel="bill"
            disabled={!customerId}
          />
        </FormField>

        {/* ── Bill summary ── */}
        {selectedBill && (
          <div className="rounded-lg bg-slate-50 border border-border-subtle px-3 py-2 text-xs text-muted">
            Bill <strong className="text-foreground">{selectedBill.billNo}</strong>
            {" · "}{fmtDate(selectedBill.date)}
            {" · "}Total <strong className="text-foreground">{npr(selectedBill.total)}</strong>
          </div>
        )}

        {/* ── Product lines from bill ── */}
        {lines.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">
              Select items to return
              <span className="ml-2 text-xs font-normal text-muted">(tap − / + to set qty)</span>
            </p>
            <Card>
              <CardContent className="p-0">
                {lines.map((line, i) => (
                  <div
                    key={line.productId}
                    className={`flex items-center gap-3 px-4 py-3 ${i < lines.length - 1 ? "border-b border-border-subtle" : ""} ${line.returnQty > 0 ? "bg-teal-50/40" : ""}`}
                  >
                    {/* Product info */}
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{line.productName}</p>
                      <p className="text-xs text-muted">
                        Sold: {line.soldQty} × {npr(line.rate)}
                        {line.returnQty > 0 && (
                          <span className="ml-2 font-medium text-success-foreground">
                            → credit {npr(lineCredit(line))}
                            {line.discountPct > 0 && <span className="ml-1 text-[10px] text-amber-600">({line.discountPct}% disc applied)</span>}
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Qty stepper */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setReturnQty(line.productId, -1)}
                        disabled={line.returnQty === 0}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-border-subtle bg-white text-foreground disabled:opacity-30 hover:bg-slate-50"
                      >
                        <Minus size={14} />
                      </button>
                      <span className={`w-6 text-center text-sm font-semibold ${line.returnQty > 0 ? "text-teal-700" : "text-muted"}`}>
                        {line.returnQty}
                      </span>
                      <button
                        onClick={() => setReturnQty(line.productId, +1)}
                        disabled={line.returnQty >= line.soldQty}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-border-subtle bg-white text-foreground disabled:opacity-30 hover:bg-slate-50"
                      >
                        <Plus size={14} />
                      </button>
                      <span className="w-6 text-xs text-muted">/{line.soldQty}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Credit summary ── */}
        {creditAmount > 0 && (
          <div className="flex items-center justify-between rounded-xl bg-success-light border border-success/20 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-success-foreground">Credit to customer</p>
              <p className="text-xs text-success-foreground/70">
                {totalReturnQty} item{totalReturnQty !== 1 ? "s" : ""} returned · will reduce outstanding
              </p>
            </div>
            <Badge variant="success">{npr(creditAmount)}</Badge>
          </div>
        )}

        {/* ── Reason ── */}
        <FormField label="Reason (optional)">
          <Textarea
            placeholder="e.g. Melted on delivery, wrong product sent…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </FormField>
      </div>

      <StickyBar
        rows={creditAmount > 0 ? [["Credit", npr(creditAmount)]] : undefined}
        action="Save return"
        onAction={handleSave}
        loading={saving}
        disabled={returnLines.length === 0}
      />
    </PageShell>
  );
};
