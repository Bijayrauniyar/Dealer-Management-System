import { useNavigate } from "react-router-dom";
import {Plus, TrendingUp, TrendingDown} from "lucide-react";
import { PageShell } from "@/components/app/PageShell";
import { SectionHeader } from "@/components/app/SectionHeader";
import { KpiCard } from "@/components/app/KpiCard";
import { ListRow } from "@/components/app/ListRow";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";
import { CAPITAL_CATEGORIES } from "@/domain/catalogs";
import { summarizeCapital } from "@/lib/capitalSummary";
import { useCapitalEntries, useCustomers, useLatestCashClosing, useProducts, usePnlTotals, useSales, useSuppliers } from "@/store/domain";
import { npr, fmtDate } from "@/lib/utils";
import { PageBackLink } from "@/components/app/PageBackLink";

const categoryLabel = (cat: string) => CAPITAL_CATEGORIES.find((c) => c.value === cat)?.label ?? cat;

const categoryBadge = (cat: string) => {
  const map: Record<string, "teal" | "warning" | "info" | "danger" | "success"> = {
    fixed_asset: "teal",
    inventory: "success",
    deposit: "info",
    owner_capital: "warning",
    loan: "danger",
  };
  return map[cat] ?? "default";
};

const Row = ({
  label,
  value,
  sub,
  color,
  bold,
}: {
  label: string;
  value: number;
  sub?: string;
  color?: string;
  bold?: boolean;
}) => (
  <div className="flex items-start justify-between gap-2 py-2.5 border-b border-border-subtle last:border-0">
    <div>
      <p className={`text-sm ${bold ? "font-semibold text-foreground" : "text-muted"}`}>{label}</p>
      {sub && <p className="text-xs text-muted/70">{sub}</p>}
    </div>
    <span className={`shrink-0 text-sm font-semibold ${color ?? "text-foreground"}`}>{npr(value)}</span>
  </div>
);

export const CompanyOverviewPage = () => {
  const navigate = useNavigate();
  const products = useProducts();
  const capitalEntries = useCapitalEntries();
  const customers = useCustomers();
  const suppliers = useSuppliers();
  const sales = useSales();
  const pnl = usePnlTotals();
  const latestCashClosing = useLatestCashClosing();

  const cap = summarizeCapital(capitalEntries);
  const capitalPreview = useMemo(
    () => [...capitalEntries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5),
    [capitalEntries],
  );
  const stockValueAtCost = products.reduce((s, p) => s + p.onHand * p.costPrice, 0);

  const customerOutstanding = customers.reduce((s, c) => s + c.outstanding, 0);
  const supplierPayable = suppliers.reduce((s, u) => s + u.outstanding, 0);

  const businessStartDate = useMemo(() => {
    const d = [...capitalEntries.map((e) => e.date), ...sales.map((x) => x.date)];
    if (!d.length) return new Date().toISOString().slice(0, 10);
    return [...d].sort()[0];
  }, [capitalEntries, sales]);

  const lifetimeSales = sales.reduce((s, x) => s + x.grandTotal, 0);
  const lifetimeProfit = lifetimeSales - pnl.lifetimeReturnsCredit - pnl.lifetimePurchases - pnl.lifetimeExpenses;

  const totalAssets =
    cap.fixedAssetsBookValue + cap.deposits + stockValueAtCost + latestCashClosing + 0 + customerOutstanding;

  const totalLiabilities = supplierPayable + cap.loanOutstanding;
  const netWorth = totalAssets - totalLiabilities;
  const ownerCapitalInvested = cap.ownerCapitalInvested;

  return (
    <PageShell>
      <PageBackLink className="flex items-center gap-1 text-sm font-medium text-teal-600" />

      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Company overview</h1>
          <p className="text-sm text-muted">
            From {fmtDate(businessStartDate)} till today.
          </p>
        </div>
        <Button size="sm" onClick={() => navigate("/app/capital/new")}>
          <Plus size={14} /> Add entry
        </Button>
      </div>

      <div className={`mb-5 rounded-2xl px-5 py-4 ${netWorth >= 0 ? "bg-teal-600" : "bg-danger"}`}>
        <p className="text-sm font-medium text-white/80">Net worth (owner equity)</p>
        <p className="mt-1 text-3xl font-bold text-white">{npr(netWorth)}</p>
        <p className="mt-1 text-xs text-white/70">
          Assets {npr(totalAssets)} − Liabilities {npr(totalLiabilities)}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl bg-white/10 px-3 py-2.5">
          <div>
            <p className="text-xs text-white/70">Owner capital put in</p>
            <p className="text-sm font-bold text-white">{npr(ownerCapitalInvested)}</p>
          </div>
          <div>
            <p className="text-xs text-white/70">Retained {lifetimeProfit >= 0 ? "profit" : "loss"}</p>
            <p className={`text-sm font-bold ${lifetimeProfit >= 0 ? "text-white" : "text-red-200"}`}>
              {lifetimeProfit >= 0 ? "+" : ""}
              {npr(lifetimeProfit)}
            </p>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          {netWorth >= 0 ? (
            <TrendingUp size={14} className="text-white/80" />
          ) : (
            <TrendingDown size={14} className="text-white/80" />
          )}
          <span className="text-xs text-white/80">
            {netWorth >= 0 ? "Business is in positive equity" : "Liabilities exceed assets — review urgently"}
          </span>
        </div>
      </div>

      <SectionHeader title="Profit & Loss (since day 1)" className="mb-2" />
      <Card className="mb-5">
        <CardContent className="p-0 px-4">
          <Row label="Total sales revenue" value={lifetimeSales} color="text-success-foreground" />
          <Row
            label="Total purchases"
            value={pnl.lifetimePurchases}
            color="text-danger"
            sub="Cost of goods from suppliers"
          />
          <Row label="Total expenses" value={pnl.lifetimeExpenses} color="text-danger" sub="Operating expenses" />
          <Row
            label="Sales returns (credit)"
            value={pnl.lifetimeReturnsCredit}
            color="text-danger"
            sub="Credit notes — deducted from net revenue"
          />
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-bold text-foreground">Net profit / loss</p>
              <p className="text-xs text-muted">Sales − Returns − Purchases − Expenses</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-bold ${lifetimeProfit >= 0 ? "text-success-foreground" : "text-danger"}`}>
                {npr(lifetimeProfit)}
              </span>
              <Badge variant={lifetimeProfit >= 0 ? "success" : "danger"}>
                {lifetimeProfit >= 0 ? "Profit" : "Loss"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <SectionHeader title="Current assets" className="mb-2" />
      <Card className="mb-5">
        <CardContent className="p-0 px-4">
          <Row
            label="Fixed assets (book value)"
            value={cap.fixedAssetsBookValue}
            sub="Freezers, vehicle, generator — after depreciation"
          />
          <Row label="Security deposits" value={cap.deposits} sub="Refundable deposits" />
          <Row
            label="Stock / inventory"
            value={stockValueAtCost}
            sub={`On-hand qty × cost (${products.reduce((s, p) => s + p.onHand, 0)} units · ${products.length} SKUs)`}
          />
          <Row label="Cash in hand (latest daily close)" value={latestCashClosing} sub="From daily_cash closing balance" />
          <Row label="Bank balance" value={0} sub="Not stored yet — add in a future release" />
          <Row label="Customer outstanding" value={customerOutstanding} sub="Receivable" />
          <Row label="Total assets" value={totalAssets} bold color="text-teal-600" />
        </CardContent>
      </Card>

      <SectionHeader title="Liabilities (what business owes)" className="mb-2" />
      <Card className="mb-5">
        <CardContent className="p-0 px-4">
          <Row label="Supplier payable" value={supplierPayable} sub="Owed to suppliers" color="text-danger" />
          <Row label="Loan outstanding" value={cap.loanOutstanding} sub="Remaining loan balance" color="text-danger" />
          <Row label="Total liabilities" value={totalLiabilities} bold color="text-danger" />
        </CardContent>
      </Card>

      <SectionHeader title="Capital invested (all entries)" onSeeAll={() => navigate("/app/capital")} className="mb-2" />
      <div className="mb-5 grid grid-cols-2 gap-3">
        <KpiCard label="Total invested" value={npr(cap.totalCapitalInvested)} sub="Owner capital + assets + deposits" />
        <KpiCard label="Loans taken" value={npr(cap.totalLoans)} variant="danger" sub="Bank + other borrowing" />
      </div>

      <Card className="mb-4">
        <CardContent className="p-0 px-4">
          {capitalPreview.map((entry) => (
            <ListRow
              key={entry.id}
              left={entry.name}
              right={
                <div className="flex flex-col items-end gap-1">
                  <span className="text-sm font-semibold">{npr(entry.amount)}</span>
                  {entry.currentValue !== entry.amount && (
                    <span className="text-xs text-muted">now {npr(entry.currentValue)}</span>
                  )}
                </div>
              }
              sub={
                <span className="flex items-center gap-1.5">
                  <Badge variant={categoryBadge(entry.category)} className="text-[10px] px-1.5 py-0">
                    {categoryLabel(entry.category)}
                  </Badge>
                  <span>{fmtDate(entry.date)}</span>
                </span>
              }
            />
          ))}
        </CardContent>
      </Card>

      <p className="mb-6 text-xs text-center text-muted">
        Book values use straight-line depreciation estimate. Update current value manually per entry.
      </p>
    </PageShell>
  );
};
