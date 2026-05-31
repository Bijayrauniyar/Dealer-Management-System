import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {RefreshCw, Lock} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageShell } from "@/components/app/PageShell";
import { KpiCard } from "@/components/app/KpiCard";
import { SectionHeader } from "@/components/app/SectionHeader";
import { ListRow } from "@/components/app/ListRow";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchDashboardPeriodTotalsLive, fetchTopProductsInPeriodLive } from "@/lib/live/domainLive";
import { useQuery } from "@tanstack/react-query";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  useBusinessSettings,
  useCustomers,
  useDashboardPeriodTotals,
  usePayments,
  useSales,
  useSuppliers,
} from "@/store/domain";
import { npr, nprNum, fmtDate } from "@/lib/utils";
import { PageBackLink } from "@/components/app/PageBackLink";

function defaultPeriodRange() {
  const to = new Date();
  const from = new Date();
  from.setMonth(from.getMonth() - 3);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

function computeAgingBuckets(
  customers: { outstanding: number; oldestBillDays: number }[],
): { bucket: string; days: string; amount: number }[] {
  const rows = [
    { bucket: "0–7 days", days: "0-7", amount: 0 },
    { bucket: "8–30 days", days: "8-30", amount: 0 },
    { bucket: "31–60 days", days: "31-60", amount: 0 },
    { bucket: "60+ days", days: "60+", amount: 0 },
  ];
  for (const c of customers) {
    if (c.outstanding <= 0) continue;
    const d = c.oldestBillDays;
    const amt = c.outstanding;
    if (d <= 7) rows[0].amount += amt;
    else if (d <= 30) rows[1].amount += amt;
    else if (d <= 60) rows[2].amount += amt;
    else rows[3].amount += amt;
  }
  return rows;
}

export const DashboardPage = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const business = useBusinessSettings();
  const [period, setPeriod] = useState(defaultPeriodRange);
  const sales = useSales();
  const payments = usePayments();
  const customers = useCustomers();
  const suppliers = useSuppliers();

  const periodQuery = useDashboardPeriodTotals(period.from, period.to);

  const salesInPeriod = useMemo(
    () => sales.filter((s) => s.date >= period.from && s.date <= period.to),
    [sales, period.from, period.to],
  );

  const totalSalesPeriod = salesInPeriod.reduce((a, s) => a + s.grandTotal, 0);
  const returnsCredit = periodQuery.data?.returnsCredit ?? 0;
  const totalPurchase = periodQuery.data?.totalPurchase ?? 0;
  const totalExpenses = periodQuery.data?.totalExpenses ?? 0;
  const netProfit = totalSalesPeriod - returnsCredit - totalPurchase - totalExpenses;

  const todayIso = new Date().toISOString().slice(0, 10);
  const todaySalesRows = sales.filter((s) => s.date === todayIso);
  const todaySales = todaySalesRows.reduce((a, s) => a + s.grandTotal, 0);
  const todayCollection = payments.filter((p) => p.date === todayIso).reduce((a, p) => a + p.amount, 0);

  const pendingDue = customers.reduce((a, c) => a + c.outstanding, 0);
  const supplierPayable = suppliers.reduce((a, s) => a + s.outstanding, 0);
  const damageQty = periodQuery.data?.damageQty ?? 0;

  const AGING = useMemo(() => computeAgingBuckets(customers), [customers]);
  const agingTotal = AGING.reduce((s, a) => s + a.amount, 0);

  const topCustomers = useMemo(() => {
    const m = new Map<string, { name: string; sales: number }>();
    for (const s of salesInPeriod) {
      const cur = m.get(s.customerId) ?? { name: s.customerName, sales: 0 };
      cur.sales += s.grandTotal;
      m.set(s.customerId, cur);
    }
    return [...m.entries()]
      .sort((a, b) => b[1].sales - a[1].sales)
      .slice(0, 5)
      .map(([customerId, v]) => ({ customerId, ...v }));
  }, [salesInPeriod]);

  const topProductsQ = useQuery({
    queryKey: ["dashboard-top-products", period.from, period.to],
    queryFn: () => fetchTopProductsInPeriodLive(period.from, period.to),
    enabled: isSupabaseConfigured,
    staleTime: 30_000,
  });
  const topProducts = topProductsQ.data ?? [];

  const overdue = useMemo(
    () =>
      customers
        .filter((c) => c.oldestBillDays > business.overdueDays && c.outstanding > 0)
        .sort((a, b) => b.outstanding - a.outstanding),
    [customers, business.overdueDays],
  );

  return (
    <PageShell>
      <div className="mb-4 flex items-center gap-3">
        <PageBackLink className="flex items-center gap-1 text-sm font-medium text-teal-600" />
        <div className="flex items-center gap-1.5 rounded-lg bg-surface-card border border-border-subtle px-2 py-1">
          <Lock size={11} className="text-muted" />
          <span className="text-xs text-muted">Owner</span>
        </div>
      </div>

      <h1 className="mb-4 text-lg font-bold text-foreground">Business Dashboard</h1>

      <div className="mb-4 flex items-center gap-2 rounded-xl bg-white border border-border-subtle px-3 py-2 shadow-card">
        <span className="text-xs font-medium text-muted">Period</span>
        <div className="flex flex-1 items-center gap-1">
          <input
            type="date"
            value={period.from}
            onChange={(e) => setPeriod((p) => ({ ...p, from: e.target.value }))}
            className="flex-1 rounded-lg border border-border-subtle bg-slate-50 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
          <span className="text-xs text-muted">→</span>
          <input
            type="date"
            value={period.to}
            onChange={(e) => setPeriod((p) => ({ ...p, to: e.target.value }))}
            className="flex-1 rounded-lg border border-border-subtle bg-slate-50 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
        <button
          type="button"
          className="rounded-lg p-1 text-muted hover:bg-slate-100"
          aria-label="Refresh period KPIs"
          onClick={() =>
            void qc.fetchQuery({
              queryKey: ["dashboard-period", period.from, period.to],
              queryFn: () => fetchDashboardPeriodTotalsLive(period.from, period.to),
            })
          }
        >
          <RefreshCw size={14} />
        </button>
      </div>

      <SectionHeader title="Today" className="mb-2" />
      <div className="mb-5 grid grid-cols-2 gap-3">
        <KpiCard
          label="Today's sales"
          value={npr(todaySales)}
          sub={`${todaySalesRows.length} bills`}
          onClick={() => navigate("/app/home/period/today-sales")}
        />
        <KpiCard
          label="Today's collection"
          value={npr(todayCollection)}
          onClick={() => navigate("/app/home/period/today-collection")}
        />
      </div>

      <SectionHeader
        title={`${business.region || "Workspace"} · ${fmtDate(period.from)} – ${fmtDate(period.to)}`}
        className="mb-3"
      />
      <div className="mb-5 grid grid-cols-2 gap-3">
        <KpiCard label="Total sales" value={npr(totalSalesPeriod)} onClick={() => navigate("/app/home/period/sales")} />
        <KpiCard
          label="Total purchase"
          value={npr(totalPurchase)}
          onClick={() => navigate("/app/home/period/purchases")}
        />
        <KpiCard
          label="Total expenses"
          value={npr(totalExpenses)}
          onClick={() => navigate("/app/home/period/expenses")}
        />
        <KpiCard
          label="Returns (credit)"
          value={npr(returnsCredit)}
          onClick={() => navigate("/app/home/period/returns")}
        />
        <KpiCard
          label="Net profit / loss"
          value={npr(netProfit)}
          variant={netProfit >= 0 ? "success" : "danger"}
          sub={netProfit < 0 ? "Review expenses & purchases" : "On track"}
          onClick={() => navigate("/app/home/period/profit")}
          className="col-span-2"
        />
        <KpiCard
          label="Customer dues"
          value={npr(pendingDue)}
          variant="warning"
          sub="Outstanding receivable"
          onClick={() => navigate("/app/home/overdue")}
        />
        <KpiCard label="Supplier payable" value={npr(supplierPayable)} variant="info" onClick={() => navigate("/app/supplier-payments/new")} />
        <KpiCard
          label="Damage qty"
          value={`${damageQty} units`}
          variant="danger"
          onClick={() => navigate("/app/home/period/damages")}
        />
      </div>

      <SectionHeader title="Outstanding aging (open dues)" onSeeAll={() => navigate("/app/home/aging/all")} className="mb-2" />
      <Card className="mb-5">
        <CardContent className="p-0">
          {AGING.map((row, i) => {
            const pct = agingTotal > 0 ? (row.amount / agingTotal) * 100 : 0;
            const isDanger = row.days === "60+";
            return (
              <div
                key={row.bucket}
                onClick={() => row.amount > 0 && navigate(`/app/home/aging/${row.days}`)}
                className={`flex items-center gap-3 px-4 py-3 ${
                  i < AGING.length - 1 ? "border-b border-border-subtle" : ""
                } ${row.amount > 0 ? "cursor-pointer hover:bg-slate-50" : ""}`}
              >
                <span className="w-24 shrink-0 text-sm text-foreground">{row.bucket}</span>
                <div className="flex-1">
                  {row.amount > 0 && (
                    <div className="h-1.5 rounded-full bg-slate-100">
                      <div
                        className={`h-1.5 rounded-full ${isDanger ? "bg-danger" : "bg-warning"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                </div>
                <span
                  className={`text-sm font-semibold ${
                    row.amount === 0 ? "text-muted" : isDanger ? "text-danger" : "text-warning"
                  }`}
                >
                  {row.amount === 0 ? "—" : npr(row.amount)}
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <SectionHeader title="Top 5 customers (period)" onSeeAll={() => navigate("/app/home?tab=customers")} className="mb-2" />
      <Card className="mb-5">
        <CardContent className="p-0 px-4">
          {topCustomers.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">No sales in this period</p>
          ) : (
            topCustomers.map((c, i) => (
              <ListRow
                key={c.customerId}
                left={`${i + 1}. ${c.name}`}
                right={npr(c.sales)}
                onClick={() => navigate(`/app/customers/${c.customerId}`)}
              />
            ))
          )}
        </CardContent>
      </Card>

      <SectionHeader title="Top 5 products by qty (period)" onSeeAll={() => navigate("/app/products")} className="mb-2" />
      <Card className="mb-5">
        <CardContent className="p-0 px-4">
          {topProducts.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">No lines in this period</p>
          ) : (
            topProducts.map((p, i) => (
              <ListRow
                key={p.productId}
                left={`${i + 1}. ${p.name}`}
                right={
                  <span>
                    {nprNum(p.qty)} <span className="text-xs font-normal text-muted">units</span>
                  </span>
                }
                sub={npr(p.revenue) + " revenue"}
                onClick={() => navigate("/app/products")}
              />
            ))
          )}
        </CardContent>
      </Card>

      <SectionHeader title="Overdue customers" onSeeAll={() => navigate("/app/home/overdue")} className="mb-2" />
      <Card className="mb-6">
        <CardContent className="p-0 px-4">
          {overdue.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">No overdue customers</p>
          ) : (
            overdue.slice(0, 5).map((c) => (
              <ListRow
                key={c.id}
                left={c.name}
                right={<Badge variant="danger">{npr(c.outstanding)}</Badge>}
                sub={`oldest ${c.oldestBillDays}d · ${c.area}`}
                onClick={() => navigate(`/app/customers/${c.id}`)}
              />
            ))
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
};
