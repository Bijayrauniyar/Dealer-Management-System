import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, Info } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/app/PageShell";
import { FormField } from "@/components/app/FormField";
import { StickyBar } from "@/components/app/StickyBar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DAILY_CASH } from "@/data/dummy";
import { npr, toDateInput } from "@/lib/utils";

// ── Demo data breakdown ───────────────────────────────────────────────────────
// In real app all these come from DB queries for the selected date.
const CASH_IN = {
  openingBalance:   8_200,  // yesterday's physical close
  cashSales:       12_400,  // sale entries where paidNow > 0 AND mode = Cash
  cashReceipts:     5_000,  // payment_received entries where mode = Cash
  ownerInject:          0,  // owner put personal cash into business (manual)
};
const CASH_OUT = {
  expenses:         3_500,  // expense entries where mode = Cash
  supplierPayments:     0,  // supplier_payments where mode = Cash
  staffAdvance:         0,  // staff advances/drawings (future)
  ownerDrawings:        0,  // owner withdrawal (future)
};

export const DailyCashPage = () => {
  const navigate = useNavigate();
  const [date, setDate]                   = useState(toDateInput());
  const [physicalCount, setPhysicalCount] = useState(String(DAILY_CASH.physicalCount));
  const [varianceNote, setVarianceNote]   = useState("");
  const [ownerInject, setOwnerInject]     = useState("0");
  const [saving, setSaving]               = useState(false);
  const [locked, setLocked]               = useState(false);

  const totalIn  = CASH_IN.openingBalance + CASH_IN.cashSales + CASH_IN.cashReceipts + Number(ownerInject || 0);
  const totalOut = CASH_OUT.expenses + CASH_OUT.supplierPayments + CASH_OUT.staffAdvance + CASH_OUT.ownerDrawings;
  const computed = totalIn - totalOut;
  const variance = Number(physicalCount) - computed;

  const handleSaveDraft = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    toast.success("Daily cash draft saved.");
    setSaving(false);
  };

  const handleLockDay = async () => {
    if (variance !== 0 && !varianceNote.trim()) {
      toast.error("Explain the variance before locking.");
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setLocked(true);
    toast.success("Day locked.");
    setSaving(false);
  };

  const SummaryRow = ({
    label, value, sub, indent = false, bold = false, color,
  }: {
    label: string; value: number; sub?: string;
    indent?: boolean; bold?: boolean; color?: string;
  }) => (
    <div className={`flex items-start justify-between gap-2 py-2.5 border-b border-border-subtle last:border-0 ${indent ? "pl-4" : ""}`}>
      <div>
        <p className={`text-sm ${bold ? "font-semibold text-foreground" : "text-muted"}`}>{label}</p>
        {sub && <p className="text-xs text-muted/70">{sub}</p>}
      </div>
      <span className={`shrink-0 text-sm ${bold ? "font-bold" : "font-medium"} ${color ?? (bold ? "text-teal-600" : "text-foreground")}`}>
        {value < 0 ? `(${npr(Math.abs(value))})` : npr(value)}
      </span>
    </div>
  );

  return (
    <PageShell stickyBar>
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm font-medium text-teal-600">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Daily cash</h1>
        {locked && <Badge variant="default"><Lock size={11} className="mr-1" />Locked</Badge>}
      </div>

      <FormField label="Date" className="mb-4">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={locked} />
      </FormField>

      {/* ── Cash IN ── */}
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Cash in</p>
      <Card className="mb-4">
        <CardContent className="p-0 px-4">
          <SummaryRow
            label="Opening balance"
            value={CASH_IN.openingBalance}
            sub="Yesterday's physical closing count"
          />
          <SummaryRow
            label="Cash sales today"
            value={CASH_IN.cashSales}
            sub="Bills with cash collected at billing"
          />
          <SummaryRow
            label="Cash receipts today"
            value={CASH_IN.cashReceipts}
            sub="Payments received against old outstanding bills"
          />
          {/* Owner injection — editable */}
          <div className="py-2.5 border-b border-border-subtle last:border-0">
            <p className="mb-1.5 text-sm text-muted">
              Owner cash injection
              <span className="ml-1 text-xs text-muted-foreground">(personal → business)</span>
            </p>
            <Input
              type="number" min={0} placeholder="0"
              value={ownerInject}
              onChange={(e) => setOwnerInject(e.target.value)}
              disabled={locked}
              className="h-9 text-sm"
            />
          </div>
          <SummaryRow label="Total cash in" value={totalIn} bold />
        </CardContent>
      </Card>

      {/* ── Cash OUT ── */}
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Cash out</p>
      <Card className="mb-4">
        <CardContent className="p-0 px-4">
          <SummaryRow
            label="Expenses (cash)"
            value={CASH_OUT.expenses}
            sub="Fuel, rent, materials paid in cash"
          />
          <SummaryRow
            label="Supplier payments (cash)"
            value={CASH_OUT.supplierPayments}
            sub="Havmor / vendor cash payments today"
          />
          <SummaryRow
            label="Staff advance / salary"
            value={CASH_OUT.staffAdvance}
            sub="Cash paid to staff (v2 field)"
            color="text-muted"
          />
          <SummaryRow
            label="Owner drawings"
            value={CASH_OUT.ownerDrawings}
            sub="Owner withdrawal from business cash (v2)"
            color="text-muted"
          />
          <SummaryRow label="Total cash out" value={totalOut} bold color="text-danger" />
        </CardContent>
      </Card>

      {/* ── Computed closing ── */}
      <Card className="mb-4 border-teal-200 bg-teal-50/40">
        <CardContent className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Computed closing balance</p>
              <p className="text-xs text-muted">Opening + In − Out</p>
            </div>
            <span className="text-xl font-bold text-teal-700">{npr(computed)}</span>
          </div>
        </CardContent>
      </Card>

      {/* ── Physical count ── */}
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Physical count</p>
      <Card className="mb-4">
        <CardContent className="space-y-3 p-4">
          <FormField label="Cash in drawer / safe (NPR)" required>
            <Input
              type="number" min={0}
              placeholder="Count and enter actual cash"
              value={physicalCount}
              onChange={(e) => setPhysicalCount(e.target.value)}
              disabled={locked}
            />
          </FormField>

          {physicalCount !== "" && (
            <div className={`flex items-center justify-between rounded-lg px-3 py-2.5 ${variance === 0 ? "bg-success-light" : "bg-danger-light"}`}>
              <div>
                <p className={`text-sm font-semibold ${variance === 0 ? "text-success-foreground" : "text-danger-foreground"}`}>
                  Variance: {variance >= 0 ? "+" : ""}{npr(variance)}
                </p>
                <p className={`text-xs ${variance === 0 ? "text-success-foreground/70" : "text-danger-foreground/70"}`}>
                  {variance === 0 ? "Matched — no variance" : variance > 0 ? "More cash than expected" : "Less cash than expected"}
                </p>
              </div>
              {variance === 0
                ? <span className="text-lg">✓</span>
                : <Badge variant="danger">Explain</Badge>}
            </div>
          )}

          {variance !== 0 && physicalCount !== "" && (
            <FormField label="Variance note" required hint="e.g. NPR 200 given as change, not yet entered">
              <Input
                placeholder="Explain the difference"
                value={varianceNote}
                onChange={(e) => setVarianceNote(e.target.value)}
                disabled={locked}
              />
            </FormField>
          )}
        </CardContent>
      </Card>

      {/* Info note about what's not auto-tracked yet */}
      <div className="mb-4 flex gap-2 rounded-xl bg-info-light border border-info/20 px-3 py-3">
        <Info size={14} className="mt-0.5 shrink-0 text-info" />
        <p className="text-xs text-info-foreground">
          <strong>Not yet auto-tracked:</strong> eSewa/digital wallet balance, cheque clearances, staff salary, owner drawings.
          These will be added as separate entries in v2.
        </p>
      </div>

      {locked && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
          <Lock size={14} /> This day is locked. Contact the owner to unlock.
        </div>
      )}

      <StickyBar
        rows={[["Computed", npr(computed)], ["Physical", physicalCount ? npr(Number(physicalCount)) : "—"]]}
        action={locked ? "Day locked" : "Lock day"}
        onAction={handleLockDay}
        loading={saving}
        disabled={locked || !physicalCount}
      />

      {/* Save draft (secondary — above sticky bar) */}
      {!locked && (
        <div className="fixed bottom-32 left-0 right-0 z-20 px-4">
          <div className="mx-auto max-w-xl">
            <Button variant="secondary" size="full" onClick={handleSaveDraft} loading={saving}>
              Save draft
            </Button>
          </div>
        </div>
      )}
    </PageShell>
  );
};
