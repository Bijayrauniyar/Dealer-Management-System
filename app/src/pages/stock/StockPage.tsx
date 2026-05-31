import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {AlertTriangle} from "lucide-react";
import { PageShell } from "@/components/app/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { ListBrowsePanel, type BrowseFilterOption } from "@/components/app/ListBrowsePanel";
import { ListPagination } from "@/components/app/ListPagination";
import { useBusinessSettings, useProducts } from "@/store/domain";
import { downloadFilteredProducts, exportFilterSlug } from "@/lib/export/listExport";
import {
  isLowStock,
  matchesProductSearch,
  normalizeCategory,
  productCategories,
  sortProducts,
  type ProductSort,
} from "@/lib/listFilters";
import { usePagination } from "@/lib/usePagination";
import { browseListSummary } from "@/lib/listBrowseSummary";
import { toast } from "sonner";
import { PageBackLink } from "@/components/app/PageBackLink";

type StatusFilter = "all" | "low_stock";

export const StockPage = () => {
  const navigate = useNavigate();
  const PRODUCTS = useProducts();
  const business = useBusinessSettings();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const sort: ProductSort = "stock_asc";

  const categories = useMemo(() => productCategories(PRODUCTS), [PRODUCTS]);

  const searchMatched = useMemo(
    () => PRODUCTS.filter((p) => matchesProductSearch(p, query)),
    [PRODUCTS, query],
  );

  const lowStockCount = useMemo(
    () => searchMatched.filter(isLowStock).length,
    [searchMatched],
  );

  const statusOptions = useMemo((): BrowseFilterOption[] => {
    return [
      { value: "all", label: `All (${searchMatched.length})` },
      { value: "low_stock", label: `Low stock (${lowStockCount})` },
    ];
  }, [searchMatched, lowStockCount]);

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

  const page = usePagination(filtered, undefined, `${query}|${statusFilter}|${categoryFilter}|${sort}`);

  const showLowStockBanner =
    lowStockCount > 0 && statusFilter !== "low_stock";

  return (
    <PageShell>
      <PageBackLink className="flex items-center gap-1 text-sm font-medium text-teal-600" />
      <h1 className="mb-1 text-lg font-semibold">Stock</h1>
      <p className="mb-4 text-sm text-muted">
        On hand = opening + purchased + adjustments − sold − damage + returns
      </p>

      {business.allowStockAdjustment && (
        <button
          type="button"
          onClick={() => navigate("/app/stock-adjustment/new")}
          className="mb-4 w-full rounded-xl border border-teal-200 bg-teal-50 py-2.5 text-sm font-medium text-teal-700"
        >
          Stock adjustment (+/−)
        </button>
      )}

      {showLowStockBanner && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertTriangle size={18} className="shrink-0 text-danger" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-danger">
              {lowStockCount} SKU{lowStockCount !== 1 ? "s" : ""} below minimum
            </p>
            <p className="text-xs text-red-700/80">Use filters below or tap Show list.</p>
          </div>
          <button
            type="button"
            onClick={() => setStatusFilter("low_stock")}
            className="shrink-0 text-xs font-semibold text-teal-600 underline"
          >
            Show list
          </button>
        </div>
      )}

      <ListBrowsePanel
        search={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search product name, category, or unit…"
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
            toast.error("Nothing to export — adjust filters.");
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

      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-4 gap-1 border-b border-border-subtle px-3 py-2 text-[10px] font-semibold text-muted">
            <span className="col-span-2">Product</span>
            <span className="text-right">On hand</span>
            <span className="text-right">Open·Buy</span>
          </div>
          {filtered.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted">No products match.</p>
          ) : (
            page.visible.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => navigate(`/app/products/${p.id}`)}
                className={`grid w-full grid-cols-4 gap-1 border-b border-border-subtle px-3 py-2.5 text-sm last:border-0 text-left hover:bg-slate-50 active:bg-slate-100 transition-colors ${isLowStock(p) ? "bg-danger-light/40" : ""}`}
              >
                <span className="col-span-2 truncate font-medium text-foreground">{p.name}</span>
                <span
                  className={`text-right font-semibold ${isLowStock(p) ? "text-danger" : "text-foreground"}`}
                >
                  {p.onHand}
                </span>
                <span className="text-right text-[11px] text-muted">
                  {p.openingStock ?? 0} · {p.purchased ?? 0}
                </span>
              </button>
            ))
          )}
        </CardContent>
      </Card>

      {filtered.length > 0 && (
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
