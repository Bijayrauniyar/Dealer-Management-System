import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {AlertTriangle, Clock, CheckCircle2, ChevronRight, CreditCard, FilePlus, Pencil, Undo2} from "lucide-react";
import { DetailActions } from "@/components/app/DetailActions";
import { PageShell } from "@/components/app/PageShell";
import { PaymentReverseDialog } from "@/components/app/PaymentReverseDialog";
import { SALES_INVOICE_LABEL } from "@/lib/actionLabels";
import { KpiCard } from "@/components/app/KpiCard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { BillStatus, OutstandingBill, Payment } from "@/domain/types";
import {
  commitSetCustomerActive,
  reversePayment,
  useCustomers,
  useCustomersCatalog,
  useCustomerBills,
  useDomainBundleLoadState,
  useMasterCatalogLoadState,
  usePayments,
} from "@/store/domain";
import { MasterArchiveAction } from "@/components/app/MasterArchiveAction";
import { DateDisplay } from "@/components/app/DateDisplay";
import { customerAdvanceBalance, customerReceivable } from "@/lib/customerBalance";
import { npr, fmtDateDualBs } from "@/lib/utils";
import { ListPagination } from "@/components/app/ListPagination";
import { usePagination } from "@/lib/usePagination";
import { PageBackLink } from "@/components/app/PageBackLink";

// ── Helpers ───────────────────────────────────────────────────────────────────
const TODAY = "2026-05-14";

function daysOverdue(dueDate: string): number {
  const due  = new Date(dueDate).getTime();
  const now  = new Date(TODAY).getTime();
  return Math.floor((now - due) / 86_400_000); // positive = days past due
}

function daysUntilDue(dueDate: string): number {
  return -daysOverdue(dueDate); // positive = days remaining
}

const STATUS_CONFIG: Record<BillStatus, { label: string; variant: "success" | "warning" | "danger" | "teal"; icon: React.ReactNode }> = {
  paid:     { label: "Paid",     variant: "success", icon: <CheckCircle2 size={12} /> },
  current:  { label: "Current",  variant: "teal",    icon: <Clock size={12} /> },
  partial:  { label: "Partial",  variant: "warning",  icon: <Clock size={12} /> },
  overdue:  { label: "Overdue",  variant: "danger",   icon: <AlertTriangle size={12} /> },
};

// ── Bill card ─────────────────────────────────────────────────────────────────
const BillCard = ({
  bill, onPay, onOpen,
}: { bill: OutstandingBill; onPay: () => void; onOpen: () => void }) => {
  const cfg      = STATUS_CONFIG[bill.status];
  const overDays = daysOverdue(bill.dueDate);
  const remDays  = daysUntilDue(bill.dueDate);

  const dueLabel =
    bill.balance > 0
      ? bill.status === "overdue"
        ? `${overDays}d overdue`
        : `Due ${remDays}d`
      : null;

  return (
    <div className="border-b border-border-subtle py-2.5 last:border-0">
      <div
        className="flex items-center justify-between gap-2"
        onClick={onOpen}
        onKeyDown={(e) => e.key === "Enter" && onOpen()}
        role="button"
        tabIndex={0}
      >
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <span className="truncate text-[13px] font-semibold text-teal-600">{bill.billNo}</span>
          <Badge variant={cfg.variant} className="flex shrink-0 items-center gap-0.5 px-1 py-0 text-[9px]">
            {cfg.icon} {cfg.label}
          </Badge>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span
            className={`text-[13px] font-bold ${
              bill.balance > 0
                ? bill.status === "overdue"
                  ? "text-danger"
                  : "text-foreground"
                : "text-success-foreground"
            }`}
          >
            {npr(bill.balance > 0 ? bill.balance : bill.billTotal)}
          </span>
          <ChevronRight size={13} className="text-muted" />
        </div>
      </div>

      <div className="mt-0.5 flex items-center justify-between gap-2 text-[11px] text-muted">
        <span className="min-w-0 truncate">
          <DateDisplay iso={bill.billDate} dual compact />
          {bill.balance > 0 ? (
            <>
              {" · "}
              <DateDisplay iso={bill.dueDate} dual compact />
              {dueLabel ? ` · ${dueLabel}` : ""}
            </>
          ) : (
            <> · Total {npr(bill.billTotal)}</>
          )}
        </span>
        {bill.balance > 0 && bill.status !== "paid" ? (
          <button
            type="button"
            className="shrink-0 text-[11px] font-semibold text-teal-600"
            onClick={onPay}
          >
            Collect
          </button>
        ) : bill.balance > 0 && bill.paidAmount > 0 ? (
          <span className="shrink-0 text-success-foreground">Paid {npr(bill.paidAmount)}</span>
        ) : null}
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
type Tab = "bills" | "payments";
type PaymentFilter = "all" | "active" | "reversed";

export const CustomerDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const customerId = id ?? "";
  const [tab, setTab] = useState<Tab>("bills");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [paymentToReverse, setPaymentToReverse] = useState<Payment | null>(null);
  const [reversing, setReversing] = useState(false);

  const ACTIVE_CUSTOMERS = useCustomers();
  const CATALOG_CUSTOMERS = useCustomersCatalog();
  const bundleState = useDomainBundleLoadState();
  const catalogState = useMasterCatalogLoadState();
  const customerBills = useCustomerBills(customerId);
  const PAYMENTS = usePayments();

  const customer =
    CATALOG_CUSTOMERS.find((c) => c.id === id) ??
    ACTIVE_CUSTOMERS.find((c) => c.id === id);

  const allBills = useMemo(
    () =>
      [...customerBills].sort((a, b) => {
        const order = { overdue: 0, partial: 1, current: 2, paid: 3 };
        if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
        return new Date(b.billDate).getTime() - new Date(a.billDate).getTime();
      }),
    [customerBills],
  );

  const payments = useMemo(
    () => PAYMENTS.filter((p) => p.customerId === customerId),
    [PAYMENTS, customerId],
  );

  const reversedCount = useMemo(
    () => payments.filter((p) => p.reversedAt).length,
    [payments],
  );

  const filteredPayments = useMemo(() => {
    if (paymentFilter === "active") return payments.filter((p) => !p.reversedAt);
    if (paymentFilter === "reversed") return payments.filter((p) => p.reversedAt);
    return payments;
  }, [payments, paymentFilter]);

  const billsPage = usePagination(allBills, undefined, customerId);
  const paymentsPage = usePagination(
    filteredPayments,
    undefined,
    `${customerId}|payments|${paymentFilter}`,
  );

  if (!customer && (bundleState === "loading" || catalogState === "loading")) {
    return (
      <PageShell>
        <PageBackLink className="flex items-center gap-1 text-sm font-medium text-teal-600" />
        <p className="mt-8 text-center text-sm text-muted">Loading customer…</p>
      </PageShell>
    );
  }

  if (!customer) {
    return (
      <PageShell>
        <PageBackLink className="flex items-center gap-1 text-sm font-medium text-teal-600" />
        <p className="mt-8 text-center text-sm text-muted">Customer not found.</p>
      </PageShell>
    );
  }

  const receivable = customerReceivable(customer.outstanding);
  const advanceBal = customerAdvanceBalance(customer.outstanding);
  const openBills = allBills.filter((b) => b.balance > 0);
  const overdueBills = allBills.filter((b) => b.status === "overdue");
  const totalOverdue = overdueBills.reduce((s, b) => s + b.balance, 0);

  const goToPayment = () => navigate(`/app/payments/new?customerId=${customer.id}`);
  const goToAdvance = () =>
    navigate(`/app/payments/new?customerId=${customer.id}&mode=advance`);
  const goToNewBill = () => navigate(`/app/sales/new?customerId=${customer.id}`);

  const handleReversePayment = async (paymentId: string, reason: string) => {
    setReversing(true);
    try {
      await reversePayment(paymentId, reason);
      toast.success("Payment reversed.");
      setPaymentToReverse(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Reversal failed");
    } finally {
      setReversing(false);
    }
  };

  return (
    <PageShell>
      <PageBackLink className="flex items-center gap-1 text-sm font-medium text-teal-600" />

      <div className="mb-3 min-w-0">
        <h1 className="text-lg font-bold text-foreground leading-tight">{customer.name}</h1>
        <p className="mt-1 text-xs text-muted leading-snug">
          {[customer.area, customer.address, customer.phone ? `Ph ${customer.phone}` : null]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {customer.phone && (
          <a href={`tel:${customer.phone}`} className="sr-only">
            {customer.phone}
          </a>
        )}
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2">
        <KpiCard
          size="compact"
          label="Receivable"
          value={npr(receivable)}
          variant={receivable > 0 ? "warning" : "success"}
          sub={`${openBills.length} open`}
        />
        <KpiCard
          size="compact"
          label="Advance"
          value={npr(advanceBal)}
          variant={advanceBal > 0 ? "info" : "success"}
          sub={advanceBal > 0 ? "On account" : "None"}
        />
        <KpiCard
          size="compact"
          label="Credit limit"
          value={npr(customer.creditLimit)}
          sub={
            customer.creditLimit > 0
              ? `${Math.min(100, Math.round((receivable / customer.creditLimit) * 100))}% used`
              : "Not set"
          }
        />
      </div>

      {advanceBal > 0 && receivable === 0 && (
        <div className="mb-4 rounded-xl border border-info/20 bg-info-light px-4 py-3 text-sm text-info-foreground">
          Customer has {npr(advanceBal)} advance — it will apply automatically on the next sales invoice.
        </div>
      )}

      {/* ── Overdue alert banner ── */}
      {overdueBills.length > 0 && (
        <div className="mb-4 flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-danger" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-danger">
              {npr(totalOverdue)} overdue across {overdueBills.length} bill{overdueBills.length !== 1 ? "s" : ""}
            </p>
            <p className="text-xs text-red-600/80 mt-0.5">
              Oldest: {customer.oldestBillDays} days past due.
              {customer.oldestBillDays > 30 ? " Escalate — risk of bad debt." : " Follow up today."}
            </p>
          </div>
          <button
            className="shrink-0 text-xs font-semibold text-teal-600 underline underline-offset-2"
            onClick={goToPayment}
          >
            Collect
          </button>
        </div>
      )}

      {/* ── Due-soon reminder (bills due within 3 days, not yet overdue) ── */}
      {(() => {
        const dueSoon = allBills.filter(
          (b) => b.status === "current" && daysUntilDue(b.dueDate) <= 3
        );
        if (dueSoon.length === 0) return null;
        return (
          <div className="mb-4 flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
            <Clock size={18} className="mt-0.5 shrink-0 text-warning" />
            <p className="text-sm text-amber-800">
              <span className="font-semibold">{dueSoon.length} bill{dueSoon.length !== 1 ? "s" : ""}</span> due
              within 3 days —{" "}
              {dueSoon.map((b) => `${b.billNo} (${fmtDateDualBs(b.dueDate)})`).join(", ")}
            </p>
          </div>
        );
      })()}

      <DetailActions
        className="mb-4"
        actions={[
          ...(customer.isActive
            ? [
                {
                  label: SALES_INVOICE_LABEL,
                  icon: FilePlus,
                  variant: "primary" as const,
                  onClick: goToNewBill,
                },
                {
                  label: "Edit customer",
                  icon: Pencil,
                  variant: "outline" as const,
                  onClick: () => navigate(`/app/customers/edit/${customer.id}`),
                },
              ]
            : [
                {
                  label: "View customer",
                  icon: Pencil,
                  variant: "outline" as const,
                  onClick: () => navigate(`/app/customers/edit/${customer.id}`),
                },
              ]),
        ]}
      />

      <div className="mb-4">
        <MasterArchiveAction
          entityLabel="customer"
          isActive={customer.isActive}
          blockArchiveReason={
            receivable > 0.01 ? "Clear receivable balance before archiving." : undefined
          }
          onSetActive={(active) => commitSetCustomerActive(customer.id, active)}
          onArchived={() => navigate("/app/customers")}
        />
      </div>

      {customer.isActive && receivable > 0 && (
        <Button size="full" className="mb-4 gap-2" onClick={goToPayment}>
          <CreditCard size={16} />
          Collect · {npr(receivable)}
        </Button>
      )}

      {customer.isActive && advanceBal > 0 && receivable === 0 && (
        <Button size="full" variant="outline" className="mb-4 gap-2" onClick={goToNewBill}>
          <FilePlus size={16} />
          New invoice · apply {npr(advanceBal)} advance
        </Button>
      )}

      {/* ── Tab bar ── */}
      <div className="mb-4 flex rounded-xl bg-surface-card overflow-hidden border border-border-subtle">
        {(["bills", "payments"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-sm font-semibold capitalize transition-colors ${
              tab === t
                ? "bg-teal-600 text-white"
                : "text-muted hover:text-foreground"
            }`}
          >
            {t === "bills"
              ? `Bills (${allBills.length})`
              : `Payments (${payments.length})`}
          </button>
        ))}
      </div>

      {/* ── Bills tab ── */}
      {tab === "bills" && (
        <>
          {allBills.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">No bills found.</p>
          ) : (
            <>
              <Card>
                <CardContent className="p-0 px-4">
                  {billsPage.visible.map((bill) => (
                    <BillCard
                      key={bill.id}
                      bill={bill}
                      onPay={goToPayment}
                      onOpen={() => navigate(`/app/bills/${bill.billNo}`)}
                    />
                  ))}
                </CardContent>
              </Card>
              <ListPagination
                page={billsPage.page}
                totalPages={billsPage.totalPages}
                total={billsPage.total}
                hasPrev={billsPage.hasPrev}
                hasNext={billsPage.hasNext}
                onPrev={billsPage.goPrev}
                onNext={billsPage.goNext}
                showingLabel={billsPage.showingLabel}
                className="mx-0 border-0 shadow-none px-0"
              />
            </>
          )}

          {/* Summary footer */}
          {allBills.length > 0 && (
            <div className="mt-3 rounded-xl bg-surface-card border border-border-subtle px-4 py-3 grid grid-cols-3 text-center text-xs">
              <div>
                <p className="font-bold text-foreground">{allBills.length}</p>
                <p className="text-muted">Total bills</p>
              </div>
              <div>
                <p className="font-bold text-danger">{overdueBills.length}</p>
                <p className="text-muted">Overdue</p>
              </div>
              <div>
                <p className="font-bold text-success-foreground">
                  {allBills.filter((b) => b.status === "paid").length}
                </p>
                <p className="text-muted">Paid</p>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Payments tab ── */}
      {tab === "payments" && (
        <>
          {payments.length > 0 && (
            <div className="mb-3 flex rounded-lg border border-border-subtle bg-surface-muted/20 p-0.5 text-xs">
              {(
                [
                  ["all", `All (${payments.length})`],
                  ["active", `Active (${payments.length - reversedCount})`],
                  ["reversed", `Reversed (${reversedCount})`],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPaymentFilter(id)}
                  className={`flex-1 rounded-md px-2 py-1.5 font-semibold transition-colors ${
                    paymentFilter === id
                      ? "bg-white text-foreground shadow-sm"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {payments.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">No payments recorded.</p>
          ) : filteredPayments.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">No payments in this filter.</p>
          ) : (
            <Card>
              <CardContent className="p-0 px-4">
                {paymentsPage.visible.map((p) => {
                  const reversed = Boolean(p.reversedAt);
                  return (
                    <div
                      key={p.id}
                      className={`border-b border-border-subtle py-3 last:border-0 ${reversed ? "opacity-60" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p
                              className={`text-sm font-semibold ${reversed ? "line-through text-muted" : "text-foreground"}`}
                            >
                              {npr(p.amount)}
                            </p>
                            {p.isAdvance && !reversed && (
                              <Badge variant="teal" className="text-[9px]">
                                Advance
                              </Badge>
                            )}
                            {reversed && (
                              <Badge variant="danger" className="text-[9px]">
                                Reversed
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted">
                            <DateDisplay iso={p.date} dual compact /> · {p.mode}
                            {p.reference ? ` · ${p.reference}` : ""}
                          </p>
                          {reversed && (
                            <p className="mt-0.5 text-[11px] text-muted">
                              Reversed
                              {p.reversedAt ? (
                                <>
                                  {" "}
                                  · <DateDisplay iso={p.reversedAt} dual compact />
                                </>
                              ) : null}
                              {p.reversalReason ? ` · ${p.reversalReason}` : ""}
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          {p.billNo && (
                            <button
                              type="button"
                              className="flex items-center gap-1 text-xs font-medium text-teal-600"
                              onClick={() => navigate(`/app/bills/${encodeURIComponent(p.billNo!)}`)}
                            >
                              {p.billNo} <ChevronRight size={12} />
                            </button>
                          )}
                          {!reversed && (
                            <button
                              type="button"
                              className="flex items-center gap-1 text-[11px] font-semibold text-danger"
                              onClick={() => setPaymentToReverse(p)}
                            >
                              <Undo2 size={12} /> Reverse
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
          {payments.length > 0 && (
            <ListPagination
              page={paymentsPage.page}
              totalPages={paymentsPage.totalPages}
              total={paymentsPage.total}
              hasPrev={paymentsPage.hasPrev}
              hasNext={paymentsPage.hasNext}
              onPrev={paymentsPage.goPrev}
              onNext={paymentsPage.goNext}
              showingLabel={paymentsPage.showingLabel}
            />
          )}

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button size="full" variant="outline" onClick={goToPayment}>
              + Against bills
            </Button>
            <Button size="full" variant="outline" onClick={goToAdvance}>
              + Record advance
            </Button>
          </div>
        </>
      )}

      <PaymentReverseDialog
        payment={paymentToReverse}
        loading={reversing}
        onConfirm={handleReversePayment}
        onCancel={() => {
          if (!reversing) setPaymentToReverse(null);
        }}
      />

      <div className="h-6" />
    </PageShell>
  );
};
