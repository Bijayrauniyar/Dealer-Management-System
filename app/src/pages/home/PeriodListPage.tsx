import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageShell } from "@/components/app/PageShell";
import { ListRow } from "@/components/app/ListRow";
import { Card, CardContent } from "@/components/ui/card";
import { KpiCard } from "@/components/app/KpiCard";
import { EXPENSES, DASHBOARD } from "@/data/dummy";
import { usePayments, useSales } from "@/store/domain";
import { npr, fmtDate } from "@/lib/utils";

const CONFIG: Record<string, { title: string; description: string }> = {
  "sales":              { title: "Sales (period)",            description: "All sales in selected period" },
  "purchases":          { title: "Purchases (period)",        description: "Purchases from suppliers" },
  "expenses":           { title: "Expenses (period)",         description: "Operating expenses" },
  "returns":            { title: "Returns / Credit (period)", description: "Customer return credits" },
  "profit":             { title: "Net profit breakdown",      description: "Sales − Purchase − Expenses ± Returns" },
  "supplier-payable":   { title: "Supplier payable",          description: "Open bills to suppliers" },
  "damages":            { title: "Damage entries (period)",   description: "Written-off / damaged stock" },
  "freezer":            { title: "Freezer deposits",          description: "Active scheme / equipment deposits" },
  "today-sales":        { title: "Today's sales",             description: "Bills raised today" },
  "today-collection":   { title: "Today's collection",        description: "Payments received today" },
};

export const PeriodListPage = () => {
  const { type = "sales" } = useParams();
  const navigate = useNavigate();
  const SALES     = useSales();
  const PAYMENTS  = usePayments();
  const cfg = CONFIG[type] ?? { title: type, description: "" };

  return (
    <PageShell>
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm font-medium text-teal-600">
        <ArrowLeft size={16} /> Back
      </button>
      <h1 className="mb-1 text-lg font-semibold">{cfg.title}</h1>
      <p className="mb-5 text-sm text-muted">{cfg.description}</p>

      {type === "profit" && (
        <div className="mb-5 grid grid-cols-2 gap-3">
          <KpiCard label="Sales"    value={npr(DASHBOARD.totalSales)} />
          <KpiCard label="Purchase" value={npr(DASHBOARD.totalPurchase)} />
          <KpiCard label="Expenses" value={npr(DASHBOARD.totalExpenses)} />
          <KpiCard label="Returns"  value={npr(DASHBOARD.returnsCredit)} variant="success" />
          <KpiCard
            label="Net profit"
            value={npr(DASHBOARD.netProfit)}
            variant={DASHBOARD.netProfit >= 0 ? "success" : "danger"}
            className="col-span-2"
          />
        </div>
      )}

      {(type === "sales" || type === "today-sales") && (
        <Card>
          <CardContent className="p-0 px-4">
            {SALES.map((s) => (
              <ListRow
                key={s.id}
                left={s.customerName}
                right={npr(s.total)}
                sub={`${fmtDate(s.date)} · ${s.billNo}`}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {(type === "today-collection") && (
        <Card>
          <CardContent className="p-0 px-4">
            {PAYMENTS.map((p) => (
              <ListRow
                key={p.id}
                left={p.customerName}
                right={npr(p.amount)}
                sub={`${fmtDate(p.date)} · ${p.mode}`}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {type === "expenses" && (
        <Card>
          <CardContent className="p-0 px-4">
            {EXPENSES.map((e) => (
              <ListRow
                key={e.id}
                left={e.category}
                right={npr(e.amount)}
                sub={`${fmtDate(e.date)}${e.notes ? " · " + e.notes : ""}`}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {!["sales","today-sales","today-collection","expenses","profit"].includes(type) && (
        <div className="rounded-xl bg-white border border-border-subtle p-8 text-center text-sm text-muted shadow-card">
          Detailed data will appear here once the backend is connected.
        </div>
      )}
    </PageShell>
  );
};
