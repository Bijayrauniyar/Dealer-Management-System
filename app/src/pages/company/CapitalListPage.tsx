import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { PageShell } from "@/components/app/PageShell";
import { KpiCard } from "@/components/app/KpiCard";
import { ListRow } from "@/components/app/ListRow";
import { EmptyState } from "@/components/app/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CAPITAL_CATEGORIES } from "@/domain/catalogs";
import { summarizeCapital } from "@/lib/capitalSummary";
import { useCapitalEntries } from "@/store/domain";
import { PaginatedListSection } from "@/components/app/PaginatedListSection";
import { npr, fmtDate } from "@/lib/utils";

const categoryLabel = (cat: string) =>
  CAPITAL_CATEGORIES.find((c) => c.value === cat)?.label ?? cat;

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

export const CapitalListPage = () => {
  const navigate = useNavigate();
  const entries = useCapitalEntries();
  const sorted = useMemo(
    () => [...entries].sort((a, b) => b.date.localeCompare(a.date)),
    [entries],
  );
  const summary = summarizeCapital(entries);

  return (
    <PageShell>
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm font-medium text-teal-600">
          <ArrowLeft size={16} /> Back
        </button>
        <Button size="sm" onClick={() => navigate("/app/capital/new")}>
          <Plus size={14} /> Add entry
        </Button>
      </div>

      <h1 className="mb-1 text-lg font-semibold">Capital entries</h1>
      <p className="mb-4 text-sm text-muted">
        Assets, owner capital, deposits, inventory, and loans from day one.
      </p>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <KpiCard
          label="Total invested"
          value={npr(summary.totalCapitalInvested)}
          sub="Excludes loans"
        />
        <KpiCard
          label="Loans taken"
          value={npr(summary.totalLoans)}
          variant="danger"
          sub="Borrowed capital"
        />
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          title="No capital entries yet"
          body="Record your first investment, asset, or loan."
          action={
            <Button size="sm" onClick={() => navigate("/app/capital/new")}>
              Add entry
            </Button>
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0 px-4">
            <PaginatedListSection
              items={sorted}
              renderItem={(entry) => (
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
              )}
            />
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
};
