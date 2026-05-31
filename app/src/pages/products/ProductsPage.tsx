import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { ListPageHeader } from "@/components/app/patterns";
import { PageShell } from "@/components/app/PageShell";
import { Badge } from "@/components/ui/badge";
import { ListBrowsePanel, type BrowseFilterOption } from "@/components/app/ListBrowsePanel";
import { ListPagination } from "@/components/app/ListPagination";
import { useBusinessSettings, useProducts } from "@/store/domain";
import { getVatPct } from "@/lib/tax";
import { productMarkupOnCostPct } from "@/lib/productMarkup";
import { minStockLabel } from "@/lib/stockAlert";
import {
  filterHint,
  isLowStock,
  matchesProductSearch,
  normalizeCategory,
  productCategories,
  sortProducts,
  type ProductSort,
} from "@/lib/listFilters";
import { npr } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { downloadFilteredProducts, exportFilterSlug } from "@/lib/export/listExport";
import { usePagination } from "@/lib/usePagination";
import { browseListSummary } from "@/lib/listBrowseSummary";
import { toast } from "sonner";

type StatusFilter = "all" | "low_stock";

export const ProductsPage = () => {
  const navigate = useNavigate();
  const business = useBusinessSettings();
  const vatPct = getVatPct(business);
  const PRODUCTS = useProducts();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const sort: ProductSort = "name_asc";

  const categories = useMemo(() => productCategories(PRODUCTS), [PRODUCTS]);

  const searchMatched = useMemo(
    () => PRODUCTS.filter((p) => matchesProductSearch(p, query)),
    [PRODUCTS, query],
  );

  const statusOptions = useMemo((): BrowseFilterOption[] => {
    return [
      { value: "all", label: `All (${searchMatched.length})` },
      {
        value: "low_stock",
        label: `Low stock (${searchMatched.filter(isLowStock).length})`,
      },
    ];
  }, [searchMatched]);

  const categoryOptions = useMemo((): BrowseFilterOption[] => {
    const opts: BrowseFilterOption[] = [
      { value: "all", label: `All (${searchMatched.length})` },
    ];
    for (const c of categories) {
      const n = searchMatched.filter((p) => normalizeCategory(p.category) === c).length;
      opts.push({ value: c, label: `${c} (${n})` });
    }
    return opts;
  }, [searchMatched, categories]);

  const filtered = useMemo(() => {
    let list = searchMatched;
    if (statusFilter === "low_stock") list = list.filter(isLowStock);
    if (categoryFilter !== "all") {
      list = list.filter((p) => normalizeCategory(p.category) === categoryFilter);
    }
    return sortProducts(list, sort);
  }, [searchMatched, statusFilter, categoryFilter, sort]);

  const emptyHint = useMemo(() => {
    if (filtered.length > 0 || PRODUCTS.length === 0) return null;
    return filterHint([
      query.trim() ? `search “${query.trim()}”` : "",
      statusFilter === "low_stock" ? "low stock only" : "",
      categoryFilter !== "all" ? `category “${categoryFilter}”` : "",
    ]);
  }, [filtered.length, PRODUCTS.length, query, statusFilter, categoryFilter]);

  const resetKey = `${query}|${statusFilter}|${categoryFilter}|${sort}`;
  const page = usePagination(filtered, undefined, resetKey);

  return (
    <PageShell>
      <ListPageHeader
        showBack
        title="Products"
        addLabel="Add product"
        onAdd={() => navigate("/app/products/new")}
      />

      <ListBrowsePanel
        search={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search name, category, or unit…"
        filterValue={statusFilter}
        filterOptions={statusOptions}
        filterLabel="Status"
        onFilterChange={(v) => setStatusFilter(v as StatusFilter)}
        extraFilter={{
          label: "Category",
          value: categoryFilter,
          options: categoryOptions,
          onChange: setCategoryFilter,
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
          downloadFilteredProducts(
            filtered,
            exportFilterSlug([
              query.trim() || undefined,
              statusFilter !== "all" ? statusFilter : undefined,
              categoryFilter !== "all" ? categoryFilter : undefined,
            ]),
          );
          toast.success(`Exported ${filtered.length} products`);
        }}
        exportDisabled={filtered.length === 0}
      />

      {filtered.length === 0 ? (
        <div className="py-16 text-center px-4">
          <p className="text-sm font-medium text-foreground">No products match.</p>
          {emptyHint && <p className="mt-2 text-xs text-muted">{emptyHint}</p>}
          {searchMatched.length > 0 && categoryFilter !== "all" && (
            <p className="mt-2 text-xs text-muted">
              Tip: counts include your search — {searchMatched.length} match search, 0 in this
              category with that search.
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2.5">
            {page.visible.map((p) => {
              const isLow = isLowStock(p);
              const markupPct = productMarkupOnCostPct(p, vatPct);

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => navigate(`/app/products/${p.id}`)}
                  className="flex items-center gap-3 rounded-2xl border border-border-subtle bg-white p-3.5 text-left shadow-sm hover:shadow-md active:scale-[0.99] transition-all"
                >
                  <div
                    className={cn(
                      "flex h-12 w-1.5 shrink-0 rounded-full",
                      isLow ? "bg-red-400" : "bg-teal-400",
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p className="text-sm font-bold text-foreground truncate">{p.name}</p>
                      {isLow && (
                        <Badge variant="danger" className="text-[9px] px-1 py-0 shrink-0">
                          Low
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted">
                      {p.category} · Stock{" "}
                      <strong className={isLow ? "text-red-600" : ""}>{p.onHand}</strong> {p.uom} ·
                      min {minStockLabel(p)}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-[11px] flex-wrap">
                      <span className="text-gray-400">MRP {npr(p.mrp)}</span>
                      <span className="text-gray-300">·</span>
                      <span className="font-semibold text-teal-700">Sell {npr(p.sellingPrice)}</span>
                      <span className="text-gray-300">·</span>
                      <span
                        className={cn(
                          "font-semibold",
                          markupPct < 10 ? "text-red-500" : markupPct < 20 ? "text-amber-600" : "text-green-600",
                        )}
                      >
                        {markupPct}% markup
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={14} className="shrink-0 text-gray-300" />
                </button>
              );
            })}
          </div>
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

      <div className="h-6" />
    </PageShell>
  );
};
