import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Search, Plus } from "lucide-react";
import { PageShell } from "@/components/app/PageShell";
import { ListRow } from "@/components/app/ListRow";
import { EmptyState } from "@/components/app/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCustomers } from "@/store/domain";
import { npr } from "@/lib/utils";
import { usePagination } from "@/lib/usePagination";

export const CustomersPage = () => {
  const navigate  = useNavigate();
  const [params]  = useSearchParams();
  const [query, setQuery] = useState("");
  const CUSTOMERS = useCustomers();

  const filtered = CUSTOMERS.filter((c) => {
    const matchesQuery = c.name.toLowerCase().includes(query.toLowerCase()) || c.area.toLowerCase().includes(query.toLowerCase());
    if (params.get("filter") === "outstanding") return matchesQuery && c.outstanding > 0;
    return matchesQuery;
  });

  const { visible, hasMore, loadMore, total } = usePagination(filtered);

  return (
    <PageShell>
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm font-medium text-teal-600">
          <ArrowLeft size={16} /> Back
        </button>
        <Button size="sm" onClick={() => navigate("/app/customers/new")}>
          <Plus size={14} /> New
        </Button>
      </div>
      <h1 className="mb-4 text-lg font-semibold">
        Customers
        {params.get("filter") === "outstanding" && <span className="ml-2 text-sm font-normal text-muted">(with balance)</span>}
      </h1>

      {/* Search */}
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-border-subtle bg-white px-3 py-2 shadow-card focus-within:ring-2 focus-within:ring-teal-500">
        <Search size={14} className="text-muted" />
        <input
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          placeholder="Search by name or area"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No customers found" />
      ) : (
        <>
          <Card>
            <CardContent className="p-0 px-4">
              {visible.map((c) => (
                <ListRow
                  key={c.id}
                  left={c.name}
                  right={c.outstanding > 0 ? <Badge variant="warning">{npr(c.outstanding)}</Badge> : <span className="text-xs text-success-foreground">Clear</span>}
                  sub={`${c.area} · limit ${npr(c.creditLimit)}`}
                  onClick={() => navigate(`/app/customers/${c.id}`)}
                />
              ))}
            </CardContent>
          </Card>
          {hasMore && (
            <button
              onClick={loadMore}
              className="mt-3 w-full rounded-xl border border-border-subtle bg-white py-2.5 text-sm font-medium text-teal-600 hover:bg-teal-50 active:bg-teal-100 transition-colors"
            >
              Show more · {total - visible.length} remaining
            </button>
          )}
        </>
      )}
    </PageShell>
  );
};
