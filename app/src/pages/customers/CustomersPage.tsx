import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ListPageHeader } from "@/components/app/patterns";
import { PageShell } from "@/components/app/PageShell";
import { EntityList, EntityListCard } from "@/components/app/EntityListCard";
import { EmptyState } from "@/components/app/EmptyState";
import { Badge } from "@/components/ui/badge";
import { useBusinessSettings, useCustomers } from "@/store/domain";
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
  const business = useBusinessSettings();
  const CUSTOMERS = useCustomers();

  const outstandingOnly = params.get("filter") === "outstanding";
  const overdueOnly = params.get("filter") === "overdue";
  const advanceOnly = params.get("filter") === "advance";
  const [listFilter, setListFilter] = useState<"all" | "credit" | "overdue" | "advance">(
    advanceOnly ? "advance" : overdueOnly ? "overdue" : outstandingOnly ? "credit" : "all",
  );
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
      if (listFilter === "advance") return c.outstanding < -0.01;
      if (listFilter === "overdue") {
        return c.outstanding > 0 && c.oldestBillDays > business.overdueDays;
      }
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
    const advanceCount = searchMatched.filter((c) => c.outstanding < -0.01).length;
    const overdueCount = searchMatched.filter(
      (c) => c.outstanding > 0 && c.oldestBillDays > business.overdueDays,
    ).length;
    return [
      { value: "all", label: `All (${searchMatched.length})` },
      { value: "credit", label: `On credit (${creditCount})` },
      { value: "advance", label: `Advance (${advanceCount})` },
      { value: "overdue", label: `Overdue (${overdueCount})` },
    ];
  }, [searchMatched, business.overdueDays]);

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
        filterVariant={listFilter === "overdue" ? "danger" : "default"}
        onFilterChange={(v) => setListFilter(v as "all" | "credit" | "overdue" | "advance")}
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
          <EntityList>
            {page.visible.map((c) => {
              const isOverdue =
                c.outstanding > 0 && c.oldestBillDays > business.overdueDays;
              return (
                <EntityListCard
                  key={c.id}
                  title={c.name}
                  subtitle={`${c.area || "—"} · limit ${npr(c.creditLimit)}`}
                  accent={isOverdue ? "danger" : "teal"}
                  trailing={
                    c.outstanding > 0 ? (
                      <Badge variant={isOverdue ? "danger" : "warning"} className="text-[11px]">
                        {npr(c.outstanding)}
                      </Badge>
                    ) : c.outstanding < -0.01 ? (
                      <Badge variant="info" className="text-[11px]">
                        Credit {npr(Math.abs(c.outstanding))}
                      </Badge>
                    ) : (
                      <span className="text-[11px] font-medium text-success-foreground">Clear</span>
                    )
                  }
                  onClick={() => navigate(`/app/customers/${c.id}`)}
                />
              );
            })}
          </EntityList>
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
