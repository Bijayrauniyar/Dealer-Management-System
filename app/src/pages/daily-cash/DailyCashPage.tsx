import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {Lock, Info} from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/app/PageShell";
import { FormField } from "@/components/app/FormField";
import { StickyBar } from "@/components/app/StickyBar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/app/NumericInput";
import { numericMoneyProps } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { commitDailyCashClose, useDailyCashBreakdown } from "@/store/domain";
import { DOMAIN_QUERY_KEY } from "@/lib/live/domainLive";
import { npr, toDateInput } from "@/lib/utils";
import { PageBackLink } from "@/components/app/PageBackLink";

export const DailyCashPage = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [date, setDate] = useState(toDateInput());
  const breakdownQ = useDailyCashBreakdown(date);

  const live = breakdownQ.data;

  const [physicalCount, setPhysicalCount] = useState("");
  const [varianceNote, setVarianceNote] = useState("");
  const [ownerInject, setOwnerInject] = useState(0);
  const [saving, setSaving] = useState(false);
  const [locked, setLocked] = useState(false);

  const openingBalance = live?.openingBalance ?? 0;
  const cashSales = live?.cashSalesToday ?? 0;
  const cashReceipts = live?.cashReceiptsToday ?? 0;

  const cashOut = useMemo(
    () => ({
      expenses: live?.expensesCash ?? 0,
      supplierPayments: live?.supplierPaymentsCash ?? 0,
    }),
    [live],
  );

  const ownerInjectNum = ownerInject;
  const totalIn = openingBalance + cashSales + cashReceipts + ownerInjectNum;
  const totalOut = cashOut.expenses + cashOut.supplierPayments;
  const computed = totalIn - totalOut;
  const variance = Number(physicalCount) - computed;

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await commitDailyCashClose({
        cashDate: date,
        openingBalance,
        closingBalance: Number(physicalCount) || computed,
        notes:
          variance !== 0 && varianceNote.trim()
            ? `Draft variance note: ${varianceNote.trim()}`
            : "Draft save",
      });
      toast.success("Daily cash draft saved.");
      void qc.invalidateQueries({ queryKey: ["daily-cash-breakdown"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save draft.");
    } finally {
      setSaving(false);
    }
  };

  const handleLockDay = async () => {
    if (variance !== 0 && !varianceNote.trim()) {
      toast.error("Explain the variance before locking.");
      return;
    }
    const physical = Number(physicalCount);
    if (!physicalCount || Number.isNaN(physical)) {
      toast.error("Enter physical cash count.");
      return;
    }
    setSaving(true);
    try {
      await commitDailyCashClose({
        cashDate: date,
        openingBalance,
        closingBalance: physical,
        notes:
          [
            variance !== 0 ? `Variance: ${variance >= 0 ? "+" : ""}${variance} — ${varianceNote.trim()}` : null,
            ownerInjectNum ? `Owner cash injection (NPR): ${ownerInjectNum}` : null,
          ]
            .filter(Boolean)
            .join(" · ") || null,
      });
      setLocked(true);
      toast.success("Day locked.");
      void qc.invalidateQueries({ queryKey: ["daily-cash-breakdown"] });
      void qc.invalidateQueries({ queryKey: DOMAIN_QUERY_KEY });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not lock day.");
    } finally {
      setSaving(false);
    }
  };

  const SummaryRow = ({
    label,
    value,
    sub,
    indent = false,
    bold = false,
    color,
    onNavigate,
  }: {
    label: string;
    value: number;
    sub?: string;
    indent?: boolean;
    bold?: boolean;
    color?: string;
    onNavigate?: () => void;
  }) => (
    <div
      role={onNavigate ? "button" : undefined}
      tabIndex={onNavigate ? 0 : undefined}
      onClick={onNavigate}
      onKeyDown={onNavigate ? (e) => e.key === "Enter" && onNavigate() : undefined}
      className={`flex items-start justify-between gap-2 py-2.5 border-b border-border-subtle last:border-0 ${
        indent ? "pl-4" : ""
      } ${onNavigate ? "cursor-pointer hover:bg-slate-50/80 rounded-lg -mx-2 px-2" : ""}`}
    >
      <div>
        <p className={`text-sm ${bold ? "font-semibold text-foreground" : "text-muted"}`}>{label}</p>
        {sub && <p className="text-xs text-muted/70">{sub}</p>}
      </div>
      <span
        className={`shrink-0 text-sm ${bold ? "font-bold" : "font-medium"} ${color ?? (bold ? "text-teal-600" : "text-foreground")}`}
      >
        {value < 0 ? `(${npr(Math.abs(value))})` : npr(value)}
      </span>
    </div>
  );

  return (
    <PageShell stickyBar>
      <PageBackLink className="flex items-center gap-1 text-sm font-medium text-teal-600" />

      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Daily cash</h1>
        {locked && (
          <Badge variant="default">
            <Lock size={11} className="mr-1" />
            Locked
          </Badge>
        )}
      </div>

      {breakdownQ.isError && (
        <div className="mb-3 rounded-lg border border-danger/30 bg-danger-light px-3 py-2 text-sm text-danger-foreground">
          {breakdownQ.error instanceof Error
            ? breakdownQ.error.message
            : "Could not load cash data. Refresh the page or contact support."}
        </div>
      )}

      <FormField label="Date" className="mb-4">
        <Input
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setLocked(false);
            setPhysicalCount("");
            setVarianceNote("");
          }}
          disabled={locked}
        />
      </FormField>

      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Cash in</p>
      <Card className="mb-4">
        <CardContent className="p-0 px-4">
          <SummaryRow
            label="Opening balance"
            value={openingBalance}
            sub="Last saved closing on a prior date (from daily_cash)"
          />
          <SummaryRow
            label="Cash sales today"
            value={cashSales}
            sub="Cash-mode payments linked to today’s bills"
          />
          <SummaryRow
            label="Cash receipts today"
            value={cashReceipts}
            sub="Cash collected against earlier bills"
          />
          <div className="py-2.5 border-b border-border-subtle last:border-0">
            <p className="mb-1.5 text-sm text-muted">
              Owner cash injection
              <span className="ml-1 text-xs text-muted-foreground">(personal → business)</span>
            </p>
            <NumericInput
              {...numericMoneyProps}
              min={0}
              placeholder="0"
              value={ownerInject}
              onChange={setOwnerInject}
              disabled={locked}
              className="h-9 text-sm"
            />
          </div>
          <SummaryRow label="Total cash in" value={totalIn} bold />
        </CardContent>
      </Card>

      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Cash out</p>
      <Card className="mb-4">
        <CardContent className="p-0 px-4">
          <SummaryRow
            label="Expenses (cash)"
            value={cashOut.expenses}
            sub="Expenses for this date (paid_by blank or Cash)"
          />
          <SummaryRow
            label="Supplier payments (cash)"
            value={cashOut.supplierPayments}
            sub="Recorded supplier pays — tap to add"
            onNavigate={locked ? undefined : () => navigate("/app/supplier-payments/new")}
          />
          <SummaryRow label="Total cash out" value={totalOut} bold color="text-danger" />
        </CardContent>
      </Card>

      <Card className="mb-4 border-teal-200 bg-teal-50/40">
        <CardContent className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Computed closing balance</p>
              <p className="text-xs text-muted">Opening + cash in − cash out (incl. owner inject)</p>
            </div>
            <span className="text-xl font-bold text-teal-700">{npr(computed)}</span>
          </div>
        </CardContent>
      </Card>

      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Physical count</p>
      <Card className="mb-4">
        <CardContent className="space-y-3 p-4">
          <FormField label="Cash in drawer / safe (NPR)" required>
            <NumericInput
              {...numericMoneyProps}
              min={0}
              placeholder="Count and enter actual cash"
              value={Number(physicalCount) || 0}
              onChange={(v) => setPhysicalCount(v === 0 ? "" : String(v))}
              disabled={locked}
            />
          </FormField>

          {physicalCount !== "" && (
            <div
              className={`flex items-center justify-between rounded-lg px-3 py-2.5 ${
                variance === 0 ? "bg-success-light" : "bg-danger-light"
              }`}
            >
              <div>
                <p
                  className={`text-sm font-semibold ${
                    variance === 0 ? "text-success-foreground" : "text-danger-foreground"
                  }`}
                >
                  Variance: {variance >= 0 ? "+" : ""}{npr(variance)}
                </p>
                <p
                  className={`text-xs ${
                    variance === 0 ? "text-success-foreground/70" : "text-danger-foreground/70"
                  }`}
                >
                  {variance === 0
                    ? "Matched — no variance"
                    : variance > 0
                      ? "More cash than expected"
                      : "Less cash than expected"}
                </p>
              </div>
              {variance === 0 ? <span className="text-lg">✓</span> : <Badge variant="danger">Explain</Badge>}
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

      <div className="mb-4 flex gap-2 rounded-xl bg-info-light border border-info/20 px-3 py-3">
        <Info size={14} className="mt-0.5 shrink-0 text-info" />
        <p className="text-xs text-info-foreground">
          Figures pull from <strong>payments</strong> (Cash), <strong>expenses</strong>, and{" "}
          <strong>supplier_payments</strong> for the date you selected. Locking the day saves opening/closing to{" "}
          <strong>daily_cash</strong> for the next worksheet.
        </p>
      </div>

      {locked && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
          <Lock size={14} /> This day is locked locally — change the date for another worksheet.
        </div>
      )}

      <StickyBar
        rows={[["Computed", npr(computed)], ["Physical", physicalCount ? npr(Number(physicalCount)) : "—"]]}
        action={locked ? "Day locked" : "Lock day"}
        onAction={handleLockDay}
        loading={saving}
        disabled={locked || !physicalCount}
      />

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
