import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ListPageHeader } from "@/components/app/patterns";
import { PageShell } from "@/components/app/PageShell";
import { ListRow } from "@/components/app/ListRow";
import { EmptyState } from "@/components/app/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCustomers } from "@/store/domain";
import { npr } from "@/lib/utils";
import { ListBrowsePanel, type BrowseFilterOption } from "@/components/app/ListBrowsePanel";
import { ListPagination } from "@/components/app/ListPagination";
import { customerAreas } from "@/lib/listFilters";
import { downloadFilteredCustomers, exportFilterSlug } from "@/lib/export/listExport";
import { usePagination } from "@/lib/usePagination";
import { browseListSummary } from "@/lib/listBrowseSummary";
import { toast } from "sonner";

export const CustomersPage = () => {
  const navigate  = useNavigate();
  const [params]  = useSearchParams();
  const [query, setQuery] = useState("");
  const CUSTOMERS = useCustomers();

  const outstandingOnly = params.get("filter") === "outstanding";
  const [listFilter, setListFilter] = useState<"all" | "credit">(outstandingOnly ? "credit" : "all");
  const [areaFilter, setAreaFilter] = useState("all");
  const areaList = useMemo(() => customerAreas(CUSTOMERS), [CUSTOMERS]);

  const sort = "name_asc" as const;

  const filtered = useMemo(() => {
    const list = CUSTOMERS.filter((c) => {
      const matchesQuery =
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.area.toLowerCase().includes(query.toLowerCase());
      if (!matchesQuery) return false;
      if (listFilter === "credit") return c.outstanding > 0;
      if (areaFilter !== "all" && (c.area ?? "").trim() !== areaFilter) return false;
      return true;
    });
    list.sort((a, b) =>
      sort === "name_asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name),
    );
    return list;
  }, [CUSTOMERS, query, listFilter, areaFilter, sort]);

  const searchMatched = useMemo(
    () =>
      CUSTOMERS.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.area.toLowerCase().includes(query.toLowerCase()),
      ),
    [CUSTOMERS, query],
  );

  const filterOptions = useMemo((): BrowseFilterOption[] => {
    const creditCount = searchMatched.filter((c) => c.outstanding > 0).length;
    return [
      { value: "all", label: `All (${searchMatched.length})` },
      { value: "credit", label: `On credit (${creditCount})` },
    ];
  }, [searchMatched]);

  const areaOptions = useMemo((): BrowseFilterOption[] => {
    const opts: BrowseFilterOption[] = [
      { value: "all", label: `All (${searchMatched.length})` },
    ];
    for (const area of areaList) {
      const n = searchMatched.filter((c) => (c.area ?? "").trim() === area).length;
      opts.push({ value: area, label: `${area} (${n})` });
    }
    return opts;
  }, [searchMatched, areaList]);

  const resetKey = `${query}|${listFilter}|${areaFilter}|${sort}`;
  const page = usePagination(filtered, undefined, resetKey);

  return (
    <PageShell>
      <ListPageHeader
        showBack
        title={
          outstandingOnly ? "Customers (with balance)" : "Customers"
        }
        addLabel="Add customer"
        onAdd={() => navigate("/app/customers/new")}
      />

      <ListBrowsePanel
        search={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search by name or area…"
        filterValue={listFilter}
        filterOptions={filterOptions}
        filterLabel="Status"
        onFilterChange={(v) => setListFilter(v as "all" | "credit")}
        extraFilter={{
          label: "Area",
          value: areaFilter,
          options: areaOptions,
          onChange: setAreaFilter,
        }}
        summary={
          filtered.length > 0 ? browseListSummary(filtered.length, page.showingLabel) : undefined
        }
        exportCount={filtered.length}
        onExport={() => {
          if (filtered.length === 0) {
            toast.error("No rows to export.");
            return;
          }
          downloadFilteredCustomers(
            filtered,
            exportFilterSlug([
              query.trim() || undefined,
              listFilter !== "all" ? listFilter : undefined,
              areaFilter !== "all" ? areaFilter : undefined,
            ]),
          );
          toast.success(`Exported ${filtered.length} customers`);
        }}
        exportDisabled={filtered.length === 0}
      />

      {filtered.length === 0 ? (
        <EmptyState title="No customers found" />
      ) : (
        <>
          <Card>
            <CardContent className="p-0 px-4">
              {page.visible.map((c) => (
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
          <ListPagination
            page={page.page}
            totalPages={page.totalPages}
            total={page.total}
            hasPrev={page.hasPrev}
            hasNext={page.hasNext}
            onPrev={page.goPrev}
            onNext={page.goNext}
            showingLabel={page.showingLabel}
          />
        </>
      )}
    </PageShell>
  );
};
