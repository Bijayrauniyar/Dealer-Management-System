import { useNavigate, useParams } from "react-router-dom";
import { PageShell } from "@/components/app/PageShell";
import { ListRow } from "@/components/app/ListRow";
import { Card, CardContent } from "@/components/ui/card";
import { KpiCard } from "@/components/app/KpiCard";
import { useExpensesList, usePayments, usePnlTotals, usePurchasesList, useSales, useSuppliers } from "@/store/domain";
import { purchaseDisplayTitle, purchaseDisplaySubtitle } from "@/lib/purchaseDisplay";
import { PaginatedListSection } from "@/components/app/PaginatedListSection";
import { npr, fmtDate } from "@/lib/utils";
import { PageBackLink } from "@/components/app/PageBackLink";

const CONFIG: Record<string, { title: string; description: string }> = {
  sales: { title: "Sales (period)", description: "All sales in selected period" },
  purchases: { title: "Purchases (period)", description: "Purchases from suppliers" },
  expenses: { title: "Expenses (period)", description: "Operating expenses" },
  returns: { title: "Returns / Credit (period)", description: "Customer return credits" },
  profit: { title: "Net profit breakdown", description: "Sales − Purchase − Expenses ± Returns" },
  "supplier-payable": { title: "Supplier payable", description: "Open bills to suppliers" },
  damages: { title: "Damage entries (period)", description: "Written-off / damaged stock" },
  freezer: { title: "Freezer deposits", description: "Active scheme / equipment deposits" },
  "today-sales": { title: "Today's sales", description: "Bills raised today" },
  "today-collection": { title: "Today's collection", description: "Payments received today" },
};

export const PeriodListPage = () => {
  const { type = "sales" } = useParams();
  const navigate = useNavigate();
  const SALES = useSales();
  const PAYMENTS = usePayments();
  const expenses = useExpensesList();
  const purchases = usePurchasesList();
  const pnl = usePnlTotals();
  const suppliers = useSuppliers();
  const cfg = CONFIG[type] ?? { title: type, description: "" };

  const suppliersOwing = suppliers
    .filter((s) => s.outstanding > 0.01)
    .sort((a, b) => b.outstanding - a.outstanding);

  const lifetimeSales = SALES.reduce((s, x) => s + x.grandTotal, 0);
  const netProfit = lifetimeSales - pnl.lifetimeReturnsCredit - pnl.lifetimePurchases - pnl.lifetimeExpenses;

  return (
    <PageShell>
      <PageBackLink className="flex items-center gap-1 text-sm font-medium text-teal-600" />
      <h1 className="mb-1 text-lg font-semibold">{cfg.title}</h1>
      <p className="mb-5 text-sm text-muted">{cfg.description}</p>

      {type === "profit" && (
        <div className="mb-5 grid grid-cols-2 gap-3">
          <KpiCard label="Sales (all bills loaded)" value={npr(lifetimeSales)} />
          <KpiCard label="Purchase" value={npr(pnl.lifetimePurchases)} />
          <KpiCard label="Expenses" value={npr(pnl.lifetimeExpenses)} />
          <KpiCard label="Returns" value={npr(pnl.lifetimeReturnsCredit)} variant="success" />
          <KpiCard
            label="Net profit"
            value={npr(netProfit)}
            variant={netProfit >= 0 ? "success" : "danger"}
            className="col-span-2"
          />
        </div>
      )}

      {(type === "sales" || type === "today-sales") && (
        <Card>
          <CardContent className="p-0 px-4">
            <PaginatedListSection
              items={SALES}
              resetKey={type}
              renderItem={(s) => (
                <ListRow
                  key={s.id}
                  left={s.customerName}
                  right={npr(s.total)}
                  sub={`${fmtDate(s.date)} · ${s.billNo}`}
                />
              )}
            />
          </CardContent>
        </Card>
      )}

      {type === "today-collection" && (
        <Card>
          <CardContent className="p-0 px-4">
            <PaginatedListSection
              items={PAYMENTS}
              resetKey={type}
              renderItem={(p) => (
                <ListRow
                  key={p.id}
                  left={p.customerName}
                  right={npr(p.amount)}
                  sub={`${fmtDate(p.date)} · ${p.mode}`}
                />
              )}
            />
          </CardContent>
        </Card>
      )}

      {type === "expenses" && (
        <Card>
          <CardContent className="p-0 px-4">
            <PaginatedListSection
              items={expenses}
              resetKey={type}
              renderItem={(e) => (
                <ListRow
                  key={e.id}
                  left={e.category}
                  right={npr(e.amount)}
                  sub={`${fmtDate(e.date)}${e.notes ? " · " + e.notes : ""}`}
                />
              )}
            />
          </CardContent>
        </Card>
      )}

      {type === "purchases" && (
        <Card>
          <CardContent className="p-0 px-4">
            <PaginatedListSection
              items={purchases}
              resetKey={type}
              renderItem={(p) => (
                <ListRow
                  key={p.id}
                  left={purchaseDisplayTitle(p)}
                  right={npr(p.total)}
                  sub={purchaseDisplaySubtitle(p)}
                />
              )}
            />
          </CardContent>
        </Card>
      )}

      {type === "supplier-payable" && (
        <Card>
          <CardContent className="p-0 px-4">
            {suppliersOwing.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted">No supplier balances · you&apos;re all caught up.</p>
            ) : (
              <PaginatedListSection
                items={suppliersOwing}
                resetKey={type}
                renderItem={(s) => (
                  <ListRow
                    key={s.id}
                    left={s.name}
                    right={npr(s.outstanding)}
                    sub="Tap to record a supplier payment"
                    onClick={() => navigate("/app/supplier-payments/new")}
                  />
                )}
              />
            )}
          </CardContent>
        </Card>
      )}

      {!["sales", "today-sales", "today-collection", "expenses", "profit", "purchases", "supplier-payable"].includes(
        type,
      ) && (
        <div className="rounded-xl bg-white border border-border-subtle p-8 text-center text-sm text-muted shadow-card">
          This report is not available yet.
        </div>
      )}
    </PageShell>
  );
};
