import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { PageShell } from "@/components/app/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { KpiCard } from "@/components/app/KpiCard";
import { SectionHeader } from "@/components/app/SectionHeader";
import { DateDisplay } from "@/components/app/DateDisplay";
import { HOME_OVERVIEW_SECTIONS, HOME_QUICK_ACTIONS } from "@/config/appNavigation";
import {
  useBusinessSettings,
  useCustomers,
  useDomainBundleErrorMessage,
  useDomainBundleLoadState,
  usePayments,
  useProducts,
  useSales,
} from "@/store/domain";
import { queryClient } from "@/lib/queryClient";
import { DOMAIN_QUERY_KEY } from "@/lib/live/domainLive";
import { isLowStock } from "@/lib/stockAlert";
import { npr, toDateInput } from "@/lib/utils";

const TODAY = toDateInput();

export const HomePage = () => {
  const navigate = useNavigate();
  const business = useBusinessSettings();
  const loadState = useDomainBundleLoadState();
  const loadError = useDomainBundleErrorMessage();
  const CUSTOMERS = useCustomers();
  const PRODUCTS = useProducts();
  const SALES = useSales();
  const PAYMENTS = usePayments();

  const todaySalesRows = useMemo(
    () => SALES.filter((s) => s.date === TODAY),
    [SALES],
  );
  const todaySales = todaySalesRows.reduce((a, s) => a + s.grandTotal, 0);
  const todayCollection = useMemo(
    () => PAYMENTS.filter((p) => p.date === TODAY).reduce((a, p) => a + p.amount, 0),
    [PAYMENTS],
  );

  const overdueCount = useMemo(
    () =>
      CUSTOMERS.filter(
        (c) => c.oldestBillDays > business.overdueDays && c.outstanding > 0,
      ).length,
    [CUSTOMERS, business.overdueDays],
  );
  const lowStockCount = useMemo(() => PRODUCTS.filter(isLowStock).length, [PRODUCTS]);
  const outstandingTotal = useMemo(
    () => CUSTOMERS.reduce((a, c) => a + c.outstanding, 0),
    [CUSTOMERS],
  );

  const recentBills = useMemo(
    () =>
      [...SALES]
        .sort((a, b) => b.date.localeCompare(a.date) || b.billNo.localeCompare(a.billNo))
        .slice(0, 5),
    [SALES],
  );

  return (
    <PageShell>
      <div className="mb-5 border-b border-border-subtle pb-3">
        <DateDisplay iso={TODAY} dual size="md" />
      </div>

      {loadState === "error" && loadError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {loadError}{" "}
          <button
            type="button"
            className="font-semibold underline"
            onClick={() => void queryClient.invalidateQueries({ queryKey: DOMAIN_QUERY_KEY })}
          >
            Try again
          </button>
        </div>
      )}

      <SectionHeader title="Today" className="mb-2" />
      <div className="mb-5 grid grid-cols-2 gap-3">
        <KpiCard
          label="Sales"
          value={npr(todaySales)}
          sub={`${todaySalesRows.length} bills`}
          onClick={() => navigate("/app/home/period/today-sales")}
        />
        <KpiCard
          label="Collection"
          value={npr(todayCollection)}
          onClick={() => navigate("/app/home/period/today-collection")}
        />
      </div>

      <SectionHeader title="Needs attention" className="mb-2" />
      <div className="mb-5 grid grid-cols-2 gap-3">
        <KpiCard
          label="Overdue"
          value={String(overdueCount)}
          sub="customers"
          variant={overdueCount > 0 ? "danger" : "default"}
          onClick={() => navigate("/app/home/overdue")}
        />
        <KpiCard
          label="Low stock"
          value={String(lowStockCount)}
          sub="products"
          variant={lowStockCount > 0 ? "danger" : "default"}
          onClick={() => navigate("/app/products?filter=low")}
        />
        <KpiCard
          label="Outstanding"
          value={npr(outstandingTotal)}
          sub="customer dues"
          variant={outstandingTotal > 0 ? "warning" : "default"}
          className="col-span-2"
          onClick={() => navigate("/app/home/outstanding")}
        />
      </div>

      <SectionHeader title="Quick actions" className="mb-2" />
      <div className="mb-5 grid grid-cols-3 gap-2">
        {HOME_QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.to}
              type="button"
              onClick={() => navigate(action.to)}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-border-subtle bg-white p-3 shadow-card active:scale-[0.98] transition-transform"
            >
              <span className={`flex h-10 w-10 items-center justify-center rounded-full ${action.color}`}>
                <Icon size={18} />
              </span>
              <span className="text-center text-[11px] font-semibold text-foreground leading-tight">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mb-5 space-y-5">
        {HOME_OVERVIEW_SECTIONS.map((section) => (
          <div key={section.title}>
            <SectionHeader title={section.title} className="mb-2" />
            <ul className="space-y-2">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.to + item.label}>
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          item.to,
                          item.settingsTab
                            ? { state: { settingsTab: item.settingsTab } }
                            : undefined,
                        )
                      }
                      className="flex w-full items-center gap-3 rounded-xl border border-border-subtle bg-white px-4 py-3.5 text-left shadow-card active:scale-[0.99] transition-transform"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100">
                        <Icon size={18} className="text-slate-600" />
                      </div>
                      <p className="min-w-0 flex-1 text-sm font-semibold text-foreground">
                        {item.label}
                      </p>
                      <ChevronRight size={16} className="shrink-0 text-muted" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {recentBills.length > 0 && (
        <>
          <SectionHeader title="Recent bills" className="mb-2" />
          <Card className="mb-4">
            <CardContent className="divide-y divide-border-subtle p-0">
              {recentBills.map((s) => (
                <button
                  key={s.billNo}
                  type="button"
                  onClick={() => navigate(`/app/bills/${encodeURIComponent(s.billNo)}`)}
                  className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left active:bg-slate-50/80"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-foreground">{s.billNo}</p>
                    <p className="truncate text-[11px] text-muted">
                      {s.customerName || "—"} · <DateDisplay iso={s.date} dual compact />
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      {npr(s.grandTotal)}
                    </span>
                    <ChevronRight size={14} className="text-muted" />
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </>
      )}

      <div className="h-4" />
    </PageShell>
  );
};
