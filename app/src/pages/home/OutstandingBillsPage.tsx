import { useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {ChevronRight} from "lucide-react";
import { PageShell } from "@/components/app/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/app/EmptyState";
import { useCustomers, useOutstandingBills } from "@/store/domain";
import { PaginatedListSection } from "@/components/app/PaginatedListSection";
import { npr, fmtDate } from "@/lib/utils";
import { PageBackLink } from "@/components/app/PageBackLink";

/** All open bills (balance &gt; 0) with customer names — tap-through to bill detail. */
export const OutstandingBillsPage = () => {
  const navigate = useNavigate();
  const customers = useCustomers();
  const bills = useOutstandingBills();

  const byCust = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of customers) m.set(c.id, c.name);
    return m;
  }, [customers]);

  const sorted = useMemo(
    () => [...bills].sort((a, b) => b.balance - a.balance),
    [bills],
  );

  return (
    <PageShell>
      <PageBackLink className="flex items-center gap-1 text-sm font-medium text-teal-600" />
      <h1 className="mb-1 text-lg font-semibold">Open bills</h1>
      <p className="mb-4 text-xs text-muted">
        Customers with any balance — newest unpaid bills first by amount.{" "}
        <Link to="/app/home/overdue" className="font-medium text-teal-600 underline">
          Overdue-only list
        </Link>
      </p>
      {sorted.length === 0 ? (
        <EmptyState title="No open bills" body="All sales are fully collected." />
      ) : (
        <Card>
          <CardContent className="p-0 px-4">
            <PaginatedListSection
              items={sorted}
              renderItem={(b) => (
                <button
                  type="button"
                  key={b.id}
                  onClick={() => navigate(`/app/bills/${encodeURIComponent(b.billNo)}`)}
                  className="flex w-full items-center justify-between gap-2 border-b border-border-subtle py-3.5 text-left last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{b.billNo}</p>
                    <p className="text-xs text-muted">
                      {byCust.get(b.customerId) ?? "Customer"} · {fmtDate(b.billDate)}
                    </p>
                    <p className="text-[11px] text-muted">
                      Total {npr(b.billTotal)} · paid {npr(b.paidAmount)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-sm font-bold text-warning">{npr(b.balance)}</span>
                    <span className="text-[10px] uppercase text-muted">{b.status}</span>
                    <ChevronRight size={14} className="text-muted" />
                  </div>
                </button>
              )}
            />
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
};
