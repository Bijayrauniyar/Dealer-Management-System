import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ListPageHeader } from "@/components/app/patterns";
import { PageShell } from "@/components/app/PageShell";
import { EntityList, EntityListCard } from "@/components/app/EntityListCard";
import { EmptyState } from "@/components/app/EmptyState";
import { Badge } from "@/components/ui/badge";
import {
  useDomainBundleErrorMessage,
  useDomainBundleLoadState,
  useSuppliers,
} from "@/store/domain";
import { npr } from "@/lib/utils";
import { ListBrowsePanel, type BrowseFilterOption } from "@/components/app/ListBrowsePanel";
import { ListPagination } from "@/components/app/ListPagination";
import { usePagination } from "@/lib/usePagination";
import { browseListSummary } from "@/lib/listBrowseSummary";

export const SuppliersPage = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [listFilter, setListFilter] = useState<"all" | "payable">("all");
  const loadState = useDomainBundleLoadState();
  const loadError = useDomainBundleErrorMessage();
  const SUPPLIERS = useSuppliers();

  const searchMatched = useMemo(
    () =>
      SUPPLIERS.filter(
        (s) =>
          !query ||
          s.name.toLowerCase().includes(query.toLowerCase()) ||
          s.contactPerson.toLowerCase().includes(query.toLowerCase()),
      ),
    [SUPPLIERS, query],
  );

  const filtered = useMemo(() => {
    return searchMatched.filter((s) => {
      if (listFilter === "payable") return s.outstanding > 0;
      return true;
    });
  }, [searchMatched, listFilter]);

  const filterOptions = useMemo((): BrowseFilterOption[] => {
    const payableCount = searchMatched.filter((s) => s.outstanding > 0).length;
    return [
      { value: "all", label: `All (${searchMatched.length})` },
      { value: "payable", label: `Payable (${payableCount})` },
    ];
  }, [searchMatched]);

  const resetKey = `${query}|${listFilter}`;
  const page = usePagination(filtered, undefined, resetKey);

  return (
    <PageShell>
      <ListPageHeader
        showBack
        title="Suppliers"
        addLabel="Add supplier"
        onAdd={() => navigate("/app/suppliers/new")}
      />

      <ListBrowsePanel
        search={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search supplier…"
        filterOptions={filterOptions}
        filterValue={listFilter}
        onFilterChange={(v) => setListFilter(v as "all" | "payable")}
        filterLabel="Status"
        summary={
          filtered.length > 0 ? browseListSummary(filtered.length, page.showingLabel) : undefined
        }
        className="mb-4"
      />

      {loadState === "loading" && (
        <p className="py-10 text-center text-sm text-muted">Loading suppliers…</p>
      )}
      {loadState === "error" && (
        <p className="px-4 py-10 text-center text-sm text-danger">
          Could not load suppliers.
          {loadError ? ` ${loadError}` : ""}
        </p>
      )}
      {loadState === "ready" && filtered.length === 0 && (
        <EmptyState
          title={query || listFilter !== "all" ? "No matches" : "No suppliers yet"}
          body={query || listFilter !== "all" ? "Try another search or filter." : "Tap Add supplier above."}
        />
      )}
      {loadState === "ready" && filtered.length > 0 && (
        <EntityList>
          {page.visible.map((s) => (
            <EntityListCard
              key={s.id}
              title={s.name}
              subtitle={`${s.contactPerson || "—"} · ${s.paymentTermsDays}d terms`}
              accent={s.outstanding > 0 ? "danger" : "teal"}
              trailing={
                s.outstanding > 0 ? (
                  <Badge variant="warning" className="text-[11px]">
                    {npr(s.outstanding)}
                  </Badge>
                ) : undefined
              }
              onClick={() => navigate(`/app/suppliers/${s.id}`)}
            />
          ))}
        </EntityList>
      )}

      {loadState === "ready" && filtered.length > 0 && (
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
      )}
    </PageShell>
  );
};
