import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, AlertTriangle, Clock, CheckCircle2, ChevronRight, CreditCard, FilePlus, Pencil } from "lucide-react";
import { DetailActions } from "@/components/app/DetailActions";
import { PageShell } from "@/components/app/PageShell";
import { SALES_INVOICE_LABEL } from "@/lib/actionLabels";
import { KpiCard } from "@/components/app/KpiCard";
import { SectionHeader } from "@/components/app/SectionHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { BillStatus, OutstandingBill } from "@/domain/types";
import { useCustomers, useOutstandingBills, usePayments } from "@/store/domain";
import { npr, fmtDate } from "@/lib/utils";
import { ListPagination } from "@/components/app/ListPagination";
import { usePagination } from "@/lib/usePagination";

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

  return (
    <div className="border-b border-border-subtle last:border-0 py-3.5">
      {/* Row 1: bill number + status badge + balance */}
      <div className="flex items-center justify-between gap-2 mb-1" onClick={onOpen} role="button">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-teal-600 underline underline-offset-2">{bill.billNo}</span>
          <Badge variant={cfg.variant} className="flex items-center gap-1 text-[10px] px-1.5 py-0">
            {cfg.icon} {cfg.label}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {bill.balance > 0 ? (
            <span className={`text-sm font-bold ${bill.status === "overdue" ? "text-danger" : "text-foreground"}`}>
              {npr(bill.balance)}
            </span>
          ) : (
            <span className="text-sm font-semibold text-success-foreground">{npr(bill.billTotal)}</span>
          )}
          <ChevronRight size={14} className="text-muted" />
        </div>
      </div>

      {/* Row 2: dates + total info */}
      <div className="flex items-center justify-between text-xs text-muted">
        <span>Bill {fmtDate(bill.billDate)} · Total {npr(bill.billTotal)}</span>
        {bill.balance > 0 && bill.paidAmount > 0 && (
          <span className="text-success-foreground">Paid {npr(bill.paidAmount)}</span>
        )}
      </div>

      {/* Row 3: due date line */}
      {bill.balance > 0 && (
        <div className={`mt-1.5 flex items-center justify-between text-xs ${
          bill.status === "overdue" ? "text-danger" : "text-muted"
        }`}>
          <span className="flex items-center gap-1">
            {bill.status === "overdue"
              ? <AlertTriangle size={11} />
              : <Clock size={11} />}
            {bill.status === "overdue"
              ? `${overDays} day${overDays !== 1 ? "s" : ""} overdue · Due was ${fmtDate(bill.dueDate)}`
              : `Due ${fmtDate(bill.dueDate)} · ${remDays} day${remDays !== 1 ? "s" : ""} left`}
          </span>
          {bill.status !== "paid" && (
            <button
              className="text-teal-600 font-medium underline underline-offset-2"
              onClick={onPay}
            >
              Collect
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
type Tab = "bills" | "payments";

export const CustomerDetailPage = () => {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [tab, setTab] = useState<Tab>("bills");

  const CUSTOMERS        = useCustomers();
  const OUTSTANDING_BILLS = useOutstandingBills();
  const PAYMENTS         = usePayments();

  const customer = CUSTOMERS.find((c) => c.id === id);
  if (!customer) return (
    <PageShell>
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm font-medium text-teal-600">
        <ArrowLeft size={16} /> Back
      </button>
      <p className="mt-8 text-center text-muted">Customer not found.</p>
    </PageShell>
  );

  const allBills   = OUTSTANDING_BILLS.filter((b) => b.customerId === id)
    .sort((a, b) => {
      // overdue first, then current, then paid; within same status sort by dueDate asc
      const order = { overdue: 0, partial: 1, current: 2, paid: 3 };
      if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

  const openBills    = allBills.filter((b) => b.balance > 0);
  const overdueBills = allBills.filter((b) => b.status === "overdue");

  const billsPage = usePagination(allBills, undefined, id);
  const payments = PAYMENTS.filter((p) => p.customerId === id);
  const paymentsPage = usePagination(payments, undefined, `${id}|payments`);

  const totalOverdue = overdueBills.reduce((s, b) => s + b.balance, 0);

  const goToPayment = () => navigate(`/app/payments/new?customerId=${customer.id}`);
  const goToNewBill = () => navigate(`/app/sales/new?customerId=${customer.id}`);

  return (
    <PageShell>
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm font-medium text-teal-600">
        <ArrowLeft size={16} /> Back
      </button>

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
          label="Outstanding"
          value={npr(customer.outstanding)}
          variant={customer.outstanding > 0 ? "warning" : "success"}
          sub={`${openBills.length} open`}
        />
        <KpiCard
          size="compact"
          label="Overdue"
          value={npr(totalOverdue)}
          variant={totalOverdue > 0 ? "danger" : "success"}
          sub={totalOverdue > 0 ? `${overdueBills.length} due` : "None"}
        />
        <KpiCard
          size="compact"
          label="Credit limit"
          value={npr(customer.creditLimit)}
          sub={
            customer.creditLimit > 0
              ? `${Math.min(100, Math.round((customer.outstanding / customer.creditLimit) * 100))}% used`
              : "Not set"
          }
        />
      </div>

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
              {dueSoon.map((b) => `${b.billNo} (${fmtDate(b.dueDate)})`).join(", ")}
            </p>
          </div>
        );
      })()}

      <DetailActions
        className="mb-4"
        actions={[
          {
            label: SALES_INVOICE_LABEL,
            icon: FilePlus,
            variant: "primary",
            onClick: goToNewBill,
          },
          {
            label: "Edit customer",
            icon: Pencil,
            variant: "outline",
            onClick: () => navigate(`/app/customers/edit/${customer.id}`),
          },
        ]}
      />

      {customer.outstanding > 0 && (
        <Button size="full" className="mb-4 gap-2" onClick={goToPayment}>
          <CreditCard size={16} />
          Collect · {npr(customer.outstanding)}
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
          {payments.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">No payments recorded.</p>
          ) : (
            <Card>
              <CardContent className="p-0 px-4">
                {paymentsPage.visible.map((p) => (
                  <div key={p.id} className="border-b border-border-subtle last:border-0 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{npr(p.amount)}</p>
                        <p className="text-xs text-muted">
                          {fmtDate(p.date)} · {p.mode}
                          {p.reference ? ` · ${p.reference}` : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        {p.billNo && (
                          <button
                            className="flex items-center gap-1 text-xs text-teal-600 font-medium"
                            onClick={() => {}}
                          >
                            {p.billNo} <ChevronRight size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
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

          <Button size="full" variant="outline" className="mt-4" onClick={goToPayment}>
            + Record new payment
          </Button>
        </>
      )}

      <div className="h-6" />
    </PageShell>
  );
};
