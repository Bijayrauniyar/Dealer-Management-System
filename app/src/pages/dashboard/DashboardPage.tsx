import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, Lock } from "lucide-react";
import { PageShell } from "@/components/app/PageShell";
import { KpiCard } from "@/components/app/KpiCard";
import { SectionHeader } from "@/components/app/SectionHeader";
import { ListRow } from "@/components/app/ListRow";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DASHBOARD, PERIOD, AGING, TOP_CUSTOMERS, TOP_PRODUCTS, OVERDUE } from "@/data/dummy";
import { useBusinessSettings } from "@/store/domain";
import { npr, nprNum, fmtDate } from "@/lib/utils";

export const DashboardPage = () => {
  const navigate = useNavigate();
  const business = useBusinessSettings();
  const [period, setPeriod] = useState({ from: PERIOD.from, to: PERIOD.to });

  const D = DASHBOARD;
  const agingTotal = AGING.reduce((s, a) => s + a.amount, 0);

  return (
    <PageShell>
      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm font-medium text-teal-600">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex items-center gap-1.5 rounded-lg bg-surface-card border border-border-subtle px-2 py-1">
          <Lock size={11} className="text-muted" />
          <span className="text-xs text-muted">Private</span>
        </div>
      </div>

      <h1 className="mb-1 text-lg font-bold text-foreground">Business Dashboard</h1>
      <p className="mb-4 text-xs text-muted">
        This page contains sensitive financial data. Do not show to customers or staff.
      </p>

      {/* ── Period selector ── */}
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
        <button className="rounded-lg p-1 text-muted hover:bg-slate-100">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* ── Today strip ── */}
      <SectionHeader title="Today" className="mb-2" />
      <div className="mb-5 grid grid-cols-2 gap-3">
        <KpiCard
          label="Today's sales"
          value={npr(D.todaySales)}
          sub={`${D.todaySalesCount} bills`}
          onClick={() => navigate("/app/home/period/today-sales")}
        />
        <KpiCard
          label="Today's collection"
          value={npr(D.todayCollection)}
          onClick={() => navigate("/app/home/period/today-collection")}
        />
      </div>

      {/* ── Period KPIs ── */}
      <SectionHeader
        title={`${business.region} · ${fmtDate(period.from)} – ${fmtDate(period.to)}`}
        className="mb-3"
      />
      <div className="mb-5 grid grid-cols-2 gap-3">
        <KpiCard label="Total sales"    value={npr(D.totalSales)}    onClick={() => navigate("/app/home/period/sales")} />
        <KpiCard label="Total purchase" value={npr(D.totalPurchase)} onClick={() => navigate("/app/home/period/purchases")} />
        <KpiCard label="Total expenses" value={npr(D.totalExpenses)} onClick={() => navigate("/app/home/period/expenses")} />
        <KpiCard label="Returns (credit)" value={npr(D.returnsCredit)} onClick={() => navigate("/app/home/period/returns")} />
        <KpiCard
          label="Net profit / loss"
          value={npr(D.netProfit)}
          variant={D.netProfit >= 0 ? "success" : "danger"}
          sub={D.netProfit < 0 ? "Review expenses & purchases" : "On track"}
          onClick={() => navigate("/app/home/period/profit")}
          className="col-span-2"
        />
        <KpiCard
          label="Customer dues"
          value={npr(D.pendingDue)}
          variant="warning"
          sub="Outstanding receivable"
          onClick={() => navigate("/app/home/overdue")}
        />
        <KpiCard
          label="Supplier payable"
          value={npr(D.supplierPayable)}
          variant="info"
          onClick={() => navigate("/app/suppliers")}
        />
        <KpiCard
          label="Damage qty"
          value={`${D.damageQty} units`}
          variant="danger"
          onClick={() => navigate("/app/home/period/damages")}
        />
      </div>

      {/* ── Outstanding aging ── */}
      <SectionHeader
        title="Outstanding aging (open dues)"
        onSeeAll={() => navigate("/app/home/aging/all")}
        className="mb-2"
      />
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
                <span className={`text-sm font-semibold ${
                  row.amount === 0 ? "text-muted" : isDanger ? "text-danger" : "text-warning"
                }`}>
                  {row.amount === 0 ? "—" : npr(row.amount)}
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* ── Top 5 customers ── */}
      <SectionHeader title="Top 5 customers (period)" onSeeAll={() => navigate("/app/customers")} className="mb-2" />
      <Card className="mb-5">
        <CardContent className="p-0 px-4">
          {TOP_CUSTOMERS.map((c, i) => (
            <ListRow
              key={c.customerId}
              left={`${i + 1}. ${c.name}`}
              right={npr(c.sales)}
              onClick={() => navigate(`/app/customers/${c.customerId}`)}
            />
          ))}
        </CardContent>
      </Card>

      {/* ── Top 5 products ── */}
      <SectionHeader title="Top 5 products by qty (period)" onSeeAll={() => navigate("/app/products")} className="mb-2" />
      <Card className="mb-5">
        <CardContent className="p-0 px-4">
          {TOP_PRODUCTS.map((p, i) => (
            <ListRow
              key={p.productId}
              left={`${i + 1}. ${p.name}`}
              right={<span>{nprNum(p.qty)} <span className="text-xs font-normal text-muted">units</span></span>}
              sub={npr(p.revenue) + " revenue"}
              onClick={() => navigate("/app/products")}
            />
          ))}
        </CardContent>
      </Card>

      {/* ── Overdue ── */}
      <SectionHeader title="Overdue customers" onSeeAll={() => navigate("/app/home/overdue")} className="mb-2" />
      <Card className="mb-6">
        <CardContent className="p-0 px-4">
          {OVERDUE.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">No overdue customers</p>
          ) : (
            OVERDUE.slice(0, 5).map((c) => (
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
