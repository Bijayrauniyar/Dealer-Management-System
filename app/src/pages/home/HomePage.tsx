import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ChevronRight, FilePlus } from "lucide-react";
import { PageShell } from "@/components/app/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ListBrowsePanel, type BrowseFilterOption } from "@/components/app/ListBrowsePanel";
import { ListPagination } from "@/components/app/ListPagination";
import { useBusinessSettings, useCustomers, useProducts, useOutstandingBills, useSchemes } from "@/store/domain";
import { isLowStock, minStockLabel } from "@/lib/stockAlert";
import { pickBestScheme, productIdsWithActiveSchemes, schemeSummaryLabel } from "@/lib/schemeApply";
import {
  filterHint,
  matchesCustomerSearch,
  matchesProductSearch,
  normalizeCategory,
  customerAreas,
  productCategories,
  sortCustomers,
  sortProducts,
  type CustomerSort,
  type ProductSort,
} from "@/lib/listFilters";
import {
  downloadFilteredCustomers,
  downloadFilteredProducts,
  exportFilterSlug,
} from "@/lib/export/listExport";
import { usePagination } from "@/lib/usePagination";
import { browseListSummary } from "@/lib/listBrowseSummary";
import { SALES_INVOICE_LABEL } from "@/lib/actionLabels";
import { npr, fmtDate, toMiti, toDateInput } from "@/lib/utils";
import { toast } from "sonner";

const TODAY = toDateInput();

type Tab = "customers" | "stock";
type CustFilter = "all" | "overdue" | "dues";
type StockFilter = "all" | "low" | "scheme";

export const HomePage = () => {
  const navigate = useNavigate();
  const business = useBusinessSettings();
  const OVERDUE_DAYS = business.overdueDays;

  const CUSTOMERS = useCustomers();
  const PRODUCTS = useProducts();
  const SCHEMES = useSchemes();
  const OUTSTANDING_BILLS = useOutstandingBills();

  const totalOutstanding = CUSTOMERS.reduce((s, c) => s + c.outstanding, 0);
  const overdueCustomers = CUSTOMERS.filter(
    (c) => c.oldestBillDays > OVERDUE_DAYS && c.outstanding > 0,
  );
  const openBillsCount = OUTSTANDING_BILLS.filter((b) => b.balance > 0).length;
  const schemeProductIds = useMemo(
    () => productIdsWithActiveSchemes(SCHEMES, TODAY),
    [SCHEMES],
  );
  const stockCategories = useMemo(() => productCategories(PRODUCTS), [PRODUCTS]);

  const [tab, setTab] = useState<Tab>("customers");
  const [search, setSearch] = useState("");
  const [custFilter, setCustFilter] = useState<CustFilter>("all");
  const [custArea, setCustArea] = useState("all");
  const [custSort, setCustSort] = useState<CustomerSort>("dues_desc");
  const customerAreaList = useMemo(() => customerAreas(CUSTOMERS), [CUSTOMERS]);
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [stockCategory, setStockCategory] = useState<string>("all");
  const [stockSort, setStockSort] = useState<ProductSort>("stock_asc");

  const custSearchMatched = useMemo(
    () => CUSTOMERS.filter((c) => matchesCustomerSearch(c, search)),
    [CUSTOMERS, search],
  );

  const customers = useMemo(() => {
    let list = custSearchMatched;
    if (custFilter === "overdue") {
      list = list.filter((c) => c.oldestBillDays > OVERDUE_DAYS && c.outstanding > 0);
    }
    if (custFilter === "dues") list = list.filter((c) => c.outstanding > 0);
    if (custArea !== "all") {
      list = list.filter((c) => (c.area ?? "").trim() === custArea);
    }
    return sortCustomers(list, custSort);
  }, [custSearchMatched, custFilter, custArea, custSort, OVERDUE_DAYS]);

  const custResetKey = `${tab}|${search}|${custFilter}|${custArea}|${custSort}`;
  const custPage = usePagination(customers, undefined, custResetKey);
  const { visible: visibleCustomers, total: totalCustomers } = custPage;

  const stockSearchMatched = useMemo(
    () => PRODUCTS.filter((p) => matchesProductSearch(p, search)),
    [PRODUCTS, search],
  );

  const products = useMemo(() => {
    let list = stockSearchMatched;
    if (stockFilter === "low") list = list.filter(isLowStock);
    if (stockFilter === "scheme") list = list.filter((p) => schemeProductIds.has(p.id));
    if (stockCategory !== "all") {
      list = list.filter((p) => normalizeCategory(p.category) === stockCategory);
    }
    return sortProducts(list, stockSort);
  }, [stockSearchMatched, stockFilter, stockCategory, stockSort, schemeProductIds]);

  const stockResetKey = `${tab}|${search}|${stockFilter}|${stockCategory}|${stockSort}`;
  const stockPage = usePagination(products, undefined, stockResetKey);
  const { visible: visibleProducts, total: totalProducts } = stockPage;

  const custEmptyHint = useMemo(() => {
    if (customers.length > 0 || CUSTOMERS.length === 0) return null;
    return filterHint([
      search.trim() ? `search “${search.trim()}”` : "",
      custFilter === "overdue" ? "overdue only" : "",
      custFilter === "dues" ? "on credit only" : "",
      custArea !== "all" ? `area “${custArea}”` : "",
    ]);
  }, [customers.length, CUSTOMERS.length, search, custFilter, custArea]);

  const stockEmptyHint = useMemo(() => {
    if (products.length > 0 || PRODUCTS.length === 0) return null;
    return filterHint([
      search.trim() ? `search “${search.trim()}”` : "",
      stockFilter === "low" ? "low stock only" : "",
      stockFilter === "scheme" ? "on scheme only" : "",
      stockCategory !== "all" ? `category “${stockCategory}”` : "",
    ]);
  }, [products.length, PRODUCTS.length, search, stockFilter, stockCategory]);

  const custFilterOptions = useMemo((): BrowseFilterOption[] => {
    return (["all", "overdue", "dues"] as CustFilter[]).map((f) => {
      const count =
        f === "all"
          ? custSearchMatched.length
          : f === "overdue"
            ? custSearchMatched.filter(
                (c) => c.oldestBillDays > OVERDUE_DAYS && c.outstanding > 0,
              ).length
            : custSearchMatched.filter((c) => c.outstanding > 0).length;
      const name = f === "all" ? "All" : f === "overdue" ? "Overdue" : "On credit";
      return { value: f, label: `${name} (${count})` };
    });
  }, [custSearchMatched, OVERDUE_DAYS]);

  const custAreaOptions = useMemo((): BrowseFilterOption[] => {
    const opts: BrowseFilterOption[] = [
      { value: "all", label: `All areas (${custSearchMatched.length})` },
    ];
    for (const area of customerAreaList) {
      const n = custSearchMatched.filter((c) => (c.area ?? "").trim() === area).length;
      opts.push({ value: area, label: `${area} (${n})` });
    }
    return opts;
  }, [custSearchMatched, customerAreaList]);

  const stockStatusOptions = useMemo((): BrowseFilterOption[] => {
    const lowCount = stockSearchMatched.filter(isLowStock).length;
    const schemeCount = stockSearchMatched.filter((p) => schemeProductIds.has(p.id)).length;
    return [
      { value: "all", label: `All (${stockSearchMatched.length})` },
      { value: "low", label: `Low stock (${lowCount})` },
      { value: "scheme", label: `On scheme (${schemeCount})` },
    ];
  }, [stockSearchMatched, schemeProductIds]);

  const stockCategoryOptions = useMemo((): BrowseFilterOption[] => {
    const opts: BrowseFilterOption[] = [
      { value: "all", label: `All categories (${stockSearchMatched.length})` },
    ];
    for (const cat of stockCategories) {
      const n = stockSearchMatched.filter((p) => normalizeCategory(p.category) === cat).length;
      opts.push({ value: cat, label: `${cat} (${n})` });
    }
    return opts;
  }, [stockSearchMatched, stockCategories]);

  const handleTabChange = (t: Tab) => {
    setTab(t);
    setSearch("");
    setStockCategory("all");
    setCustFilter("all");
    setCustArea("all");
    setStockFilter("all");
    setStockCategory("all");
  };

  return (
    <PageShell>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground">{business.name}</h1>
          <p className="text-xs text-muted">
            {fmtDate(TODAY)} · Miti {toMiti(TODAY)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/app/sales/new")}
          className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 active:bg-teal-800 transition-colors"
        >
          <FilePlus size={15} /> {SALES_INVOICE_LABEL}
        </button>
      </div>

      {totalOutstanding > 0 && (
        <button
          type="button"
          onClick={() => navigate("/app/home/outstanding")}
          className="mb-4 w-full rounded-2xl border border-border-subtle bg-white shadow-card px-4 py-3 text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full ${
                  overdueCustomers.length > 0 ? "bg-red-100" : "bg-amber-100"
                }`}
              >
                <AlertTriangle
                  size={16}
                  className={overdueCustomers.length > 0 ? "text-danger" : "text-warning"}
                />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{npr(totalOutstanding)} outstanding</p>
                <p className="text-xs text-muted">
                  {openBillsCount} open bills ·{" "}
                  {overdueCustomers.length > 0 ? (
                    <span className="text-danger font-medium">{overdueCustomers.length} overdue</span>
                  ) : (
                    "all current"
                  )}
                </p>
              </div>
            </div>
            <ChevronRight size={16} className="text-muted" />
          </div>
          {overdueCustomers.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {overdueCustomers.slice(0, 3).map((c) => (
                <span
                  key={c.id}
                  className="rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] text-danger font-medium"
                >
                  {c.name} · {npr(c.outstanding)}
                </span>
              ))}
              {overdueCustomers.length > 3 && (
                <span className="rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] text-danger font-medium">
                  +{overdueCustomers.length - 3} more
                </span>
              )}
            </div>
          )}
        </button>
      )}

      <div className="mb-3 flex rounded-xl bg-surface-card border border-border-subtle overflow-hidden">
        {(["customers", "stock"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => handleTabChange(t)}
            className={`flex-1 py-2.5 text-sm font-semibold capitalize transition-colors ${
              tab === t ? "bg-teal-600 text-white" : "text-muted"
            }`}
          >
            {t === "customers"
              ? `Customers (${CUSTOMERS.length})`
              : `Stock (${PRODUCTS.length} SKUs)`}
          </button>
        ))}
      </div>

      {tab === "customers" && (
        <>
          <ListBrowsePanel
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search customer name, area, or phone…"
            filterValue={custFilter}
            filterOptions={custFilterOptions}
            filterLabel="Status"
            onFilterChange={(v) => setCustFilter(v as CustFilter)}
            extraFilter={{
              label: "Area",
              value: custArea,
              options: custAreaOptions,
              onChange: setCustArea,
            }}
            sortValue={custSort}
            sortOptions={[
              { value: "dues_desc", label: "Credit high → low" },
              { value: "dues_asc", label: "Credit low → high" },
              { value: "name_asc", label: "Name A–Z" },
              { value: "name_desc", label: "Name Z–A" },
            ]}
            onSortChange={(v) => setCustSort(v as CustomerSort)}
            summary={
              customers.length > 0
                ? browseListSummary(customers.length, custPage.showingLabel)
                : undefined
            }
            exportCount={customers.length}
            onExport={() => {
              if (customers.length === 0) {
                toast.error("Nothing to export — adjust filters.");
                return;
              }
              downloadFilteredCustomers(
                customers,
                exportFilterSlug([
                  search.trim() || undefined,
                  custFilter !== "all" ? custFilter : undefined,
                  custArea !== "all" ? custArea : undefined,
                ]),
              );
              toast.success(`Exported ${customers.length} customers`);
            }}
            exportDisabled={customers.length === 0}
          />

          {customers.length === 0 ? (
            <div className="py-10 text-center px-4">
              <p className="text-sm text-muted">No customers match.</p>
              {custEmptyHint && <p className="mt-2 text-xs text-muted">{custEmptyHint}</p>}
            </div>
          ) : (
            <>
              <Card>
                <CardContent className="p-0 px-4">
                  {visibleCustomers.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => navigate(`/app/customers/${c.id}`)}
                      className="flex w-full items-center justify-between border-b border-border-subtle py-3.5 last:border-0 text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
                        <p className="text-xs text-muted">{c.area}</p>
                      </div>
                      <div className="ml-3 flex flex-col items-end gap-1 shrink-0">
                        {c.outstanding > 0 ? (
                          <span
                            className={`text-sm font-bold ${
                              c.oldestBillDays > 7 ? "text-danger" : "text-warning"
                            }`}
                          >
                            {npr(c.outstanding)}
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-success-foreground">Clear</span>
                        )}
                        {c.outstanding > 0 && (
                          <Badge
                            variant={
                              c.oldestBillDays > 30
                                ? "danger"
                                : c.oldestBillDays > 7
                                  ? "warning"
                                  : "teal"
                            }
                            className="text-[10px] px-1.5 py-0"
                          >
                            {c.oldestBillDays}d
                          </Badge>
                        )}
                      </div>
                      <ChevronRight size={14} className="ml-2 shrink-0 text-muted" />
                    </button>
                  ))}
                </CardContent>
              </Card>
              <ListPagination
                page={custPage.page}
                totalPages={custPage.totalPages}
                total={totalCustomers}
                hasPrev={custPage.hasPrev}
                hasNext={custPage.hasNext}
                onPrev={custPage.goPrev}
                onNext={custPage.goNext}
                showingLabel={custPage.showingLabel}
              />
            </>
          )}
        </>
      )}

      {tab === "stock" && (
        <>
          <ListBrowsePanel
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search product name, category, or unit…"
            filterValue={stockFilter}
            filterOptions={stockStatusOptions}
            filterLabel="Status"
            onFilterChange={(v) => setStockFilter(v as StockFilter)}
            extraFilter={{
              label: "Category",
              value: stockCategory,
              options: stockCategoryOptions,
              onChange: setStockCategory,
            }}
            sortValue={stockSort}
            sortOptions={[
              { value: "stock_asc", label: "Stock low → high" },
              { value: "stock_desc", label: "Stock high → low" },
              { value: "name_asc", label: "Name A–Z" },
              { value: "name_desc", label: "Name Z–A" },
              { value: "sell_asc", label: "Price low → high" },
              { value: "sell_desc", label: "Price high → low" },
            ]}
            onSortChange={(v) => setStockSort(v as ProductSort)}
            summary={
              products.length > 0
                ? browseListSummary(products.length, stockPage.showingLabel)
                : undefined
            }
            exportCount={products.length}
            onExport={() => {
              if (products.length === 0) {
                toast.error("Nothing to export — adjust filters.");
                return;
              }
              downloadFilteredProducts(
                products,
                exportFilterSlug([
                  search.trim() || undefined,
                  stockFilter !== "all" ? stockFilter : undefined,
                  stockCategory !== "all" ? stockCategory : undefined,
                ]),
              );
              toast.success(`Exported ${products.length} products`);
            }}
            exportDisabled={products.length === 0}
          />

          {products.length === 0 ? (
            <div className="py-10 text-center px-4">
              <p className="text-sm text-muted">No products match.</p>
              {stockEmptyHint && <p className="mt-2 text-xs text-muted">{stockEmptyHint}</p>}
            </div>
          ) : (
            <>
              <Card>
                <CardContent className="p-0 px-4">
                  {visibleProducts.map((p) => {
                    const isLow = isLowStock(p);
                    const scheme = pickBestScheme(SCHEMES, p.id, TODAY);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => navigate(`/app/products/${p.id}`)}
                        className="flex w-full items-center justify-between border-b border-border-subtle py-3.5 last:border-0 text-left hover:bg-slate-50 active:bg-slate-100 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                            {isLow && (
                              <Badge variant="danger" className="text-[10px] px-1.5 py-0 shrink-0">
                                Low
                              </Badge>
                            )}
                            {scheme && (
                              <Badge className="text-[10px] px-1.5 py-0 shrink-0 bg-pink-100 text-pink-800 border-pink-200">
                                {schemeSummaryLabel(scheme)}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted">
                            {p.category} · Min {minStockLabel(p)}
                            {scheme ? ` · ${scheme.schemeName}` : ""}
                          </p>
                        </div>
                        <div className="ml-3 text-right shrink-0">
                          <p className={`text-sm font-bold ${isLow ? "text-danger" : "text-foreground"}`}>
                            {p.onHand} <span className="text-xs font-normal text-muted">{p.uom}</span>
                          </p>
                          <p className="text-xs text-muted">
                            {npr(p.sellingPrice)} / {p.uom}
                          </p>
                        </div>
                        <ChevronRight size={14} className="ml-1 shrink-0 text-muted" />
                      </button>
                    );
                  })}
                </CardContent>
              </Card>
              <ListPagination
                page={stockPage.page}
                totalPages={stockPage.totalPages}
                total={totalProducts}
                hasPrev={stockPage.hasPrev}
                hasNext={stockPage.hasNext}
                onPrev={stockPage.goPrev}
                onNext={stockPage.goNext}
                showingLabel={stockPage.showingLabel}
              />
            </>
          )}

          <div className="mt-3 rounded-xl bg-surface-card border border-border-subtle px-4 py-3 flex items-center justify-between">
            <p className="text-sm text-muted">Total stock value (at cost)</p>
            <p className="text-sm font-bold text-foreground">
              {npr(PRODUCTS.reduce((s, p) => s + p.onHand * p.costPrice, 0))}
            </p>
          </div>
        </>
      )}

      <div className="h-6" />
    </PageShell>
  );
};
