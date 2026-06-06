import { useMemo, useState } from "react";
import type { BrowseFilterOption } from "@/components/app/ListBrowsePanel";
import { usePagination } from "@/lib/usePagination";
import {
  filterHint,
  isLowStock,
  matchesProductSearch,
  normalizeCategory,
  productCategories,
  sortProducts,
  type ProductSort,
} from "@/lib/listFilters";
import { useProducts } from "@/store/domain";

export type ProductStatusFilter = "all" | "low_stock";

/** Shared product/stock list browse — filters, pagination, export slug inputs. */
export function useProductBrowse(
  sort: ProductSort = "name_asc",
  initialStatus: ProductStatusFilter = "all",
) {
  const PRODUCTS = useProducts();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProductStatusFilter>(initialStatus);
  const [categoryFilter, setCategoryFilter] = useState("all");

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
  }, [searchMatched.length, lowStockCount]);

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

  const exportSlugParts = () => [
    query.trim() || undefined,
    statusFilter !== "all" ? statusFilter : undefined,
    categoryFilter !== "all" ? categoryFilter : undefined,
  ];

  return {
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
  };
}
