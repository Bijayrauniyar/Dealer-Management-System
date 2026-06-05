import { useNavigate, useSearchParams } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { EntityList, EntityListCard } from "@/components/app/EntityListCard";
import { ListPageHeader } from "@/components/app/patterns";
import { PageShell } from "@/components/app/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListBrowsePanel } from "@/components/app/ListBrowsePanel";
import { ListPagination } from "@/components/app/ListPagination";
import { useBusinessSettings, useProducts } from "@/store/domain";
import { getVatPct } from "@/lib/tax";
import { productMarkupOnCostPct } from "@/lib/productMarkup";
import { npr } from "@/lib/utils";
import { downloadFilteredProducts, exportFilterSlug } from "@/lib/export/listExport";
import { isLowStock } from "@/lib/listFilters";
import { useProductBrowse, type ProductStatusFilter } from "@/lib/useProductBrowse";
import { browseListSummary } from "@/lib/listBrowseSummary";
import { toast } from "sonner";

export const ProductsPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const business = useBusinessSettings();
  const vatPct = getVatPct(business);
  const PRODUCTS = useProducts();
  const lowStockFromUrl = params.get("filter") === "low";
  const initialStatus: ProductStatusFilter = lowStockFromUrl ? "low_stock" : "all";

  const {
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    statusOptions,
    categoryOptions,
    filtered,
    searchMatched,
    emptyHint,
    page,
    lowStockCount,
    exportSlugParts,
  } = useProductBrowse("name_asc", initialStatus);

  const showLowStockBanner = lowStockCount > 0 && statusFilter !== "low_stock";

  return (
    <PageShell>
      <ListPageHeader
        showBack
        title="Stock"
        addLabel="Add product"
        onAdd={() => navigate("/app/products/new")}
      >
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => navigate("/app/purchases/new")}
        >
          Add purchase
        </Button>
      </ListPageHeader>

      <p className="-mt-2 mb-4 text-sm text-muted">
        Products and on-hand quantity — add stock via purchase or new product.
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
            <p className="text-xs text-red-700/80">Filter to low stock or record a purchase.</p>
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
        searchPlaceholder="Search name, category, or unit…"
        filterValue={statusFilter}
        filterOptions={statusOptions}
        filterLabel="Status"
        onFilterChange={(v) => setStatusFilter(v as ProductStatusFilter)}
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
          downloadFilteredProducts(filtered, exportFilterSlug(exportSlugParts()));
          toast.success(`Exported ${filtered.length} products`);
        }}
        exportDisabled={filtered.length === 0}
      />

      {filtered.length === 0 ? (
        <div className="px-4 py-16 text-center">
          <p className="text-sm font-medium text-foreground">
            {PRODUCTS.length === 0 ? "No products yet" : "No products match"}
          </p>
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
          <EntityList>
            {page.visible.map((p) => {
              const isLow = isLowStock(p);
              const markupPct = productMarkupOnCostPct(p, vatPct);

              return (
                <EntityListCard
                  key={p.id}
                  title={p.name}
                  subtitle={`${p.category} · ${p.onHand} ${p.uom} · Sell ${npr(p.sellingPrice)} · ${markupPct}%`}
                  badge={
                    isLow ? (
                      <Badge variant="danger" className="shrink-0 px-1 py-0 text-[9px]">
                        Low
                      </Badge>
                    ) : undefined
                  }
                  accent={isLow ? "danger" : "teal"}
                  onClick={() => navigate(`/app/products/${p.id}`)}
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

      <div className="h-6" />
    </PageShell>
  );
};
