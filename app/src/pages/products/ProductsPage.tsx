import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Plus, ChevronRight } from "lucide-react";
import { PageShell } from "@/components/app/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/store/domain";
import { isLowStock, minStockLabel } from "@/lib/stockAlert";
import { npr } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { usePagination } from "@/lib/usePagination";

type Filter = "all" | "low_stock" | string; // string = category name

export const ProductsPage = () => {
  const navigate  = useNavigate();
  const PRODUCTS  = useProducts();
  const [query,  setQuery]  = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  // All unique categories
  const categories = Array.from(new Set(PRODUCTS.map((p) => p.category))).sort();

  const chips: { id: Filter; label: string; count: number }[] = [
    { id: "all",       label: "All",       count: PRODUCTS.length },
    { id: "low_stock", label: "Low stock", count: PRODUCTS.filter(isLowStock).length },
    ...categories.map((c) => ({ id: c, label: c, count: PRODUCTS.filter((p) => p.category === c).length })),
  ];

  const filtered = PRODUCTS.filter((p) => {
    const matchSearch = !query ||
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.category.toLowerCase().includes(query.toLowerCase());
    const matchFilter =
      filter === "all"       ? true :
      filter === "low_stock" ? isLowStock(p) :
      p.category === filter;
    return matchSearch && matchFilter;
  });

  const { visible, hasMore, loadMore, total } = usePagination(filtered);

  return (
    <PageShell>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm font-medium text-teal-600">
          <ArrowLeft size={16} /> Back
        </button>
        <Button size="sm" onClick={() => navigate("/app/products/new")}>
          <Plus size={14} /> Add product
        </Button>
      </div>
      <h1 className="mb-4 text-lg font-bold">Products</h1>

      {/* Search */}
      <div className="mb-3 flex items-center gap-2 rounded-xl border border-border-subtle bg-white px-3 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-teal-500">
        <Search size={14} className="shrink-0 text-muted" />
        <input
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted/60"
          placeholder="Search product or category…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Filter chips */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {chips.map((chip) => (
          <button
            key={chip.id}
            onClick={() => setFilter(chip.id)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              filter === chip.id
                ? "border-teal-600 bg-teal-600 text-white"
                : "border-border-subtle bg-white text-muted hover:border-teal-300 hover:text-teal-600",
            )}
          >
            {chip.label}
            <span className={cn(
              "rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
              filter === chip.id ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500",
            )}>
              {chip.count}
            </span>
          </button>
        ))}
      </div>

      {/* Product list */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-muted">No products match.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {visible.map((p) => {
            const isLow  = isLowStock(p);
            const margin = p.costPrice > 0
              ? Math.round(((p.sellingPrice - p.costPrice) / p.costPrice) * 100)
              : 0;

            return (
              <button
                key={p.id}
                onClick={() => navigate(`/app/products/edit/${p.id}`)}
                className="flex items-center gap-3 rounded-2xl border border-border-subtle bg-white p-3.5 text-left shadow-sm hover:shadow-md active:scale-[0.99] transition-all"
              >
                {/* Stock indicator bar */}
                <div className={cn(
                  "flex h-12 w-1.5 shrink-0 rounded-full",
                  isLow ? "bg-red-400" : "bg-teal-400",
                )} />

                <div className="flex-1 min-w-0">
                  {/* Name + badges */}
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <p className="text-sm font-bold text-foreground truncate">{p.name}</p>
                    {isLow    && <Badge variant="danger" className="text-[9px] px-1 py-0 shrink-0">Low</Badge>}
                  </div>
                  {/* Sub-line: category + stock */}
                  <p className="text-[11px] text-muted">
                    {p.category} · Stock <strong className={isLow ? "text-red-600" : ""}>{p.onHand}</strong> {p.uom} · min {minStockLabel(p)}
                  </p>
                  {/* Pricing row */}
                  <div className="mt-1 flex items-center gap-2 text-[11px]">
                    <span className="text-gray-400">MRP {npr(p.mrp)}</span>
                    <span className="text-gray-300">·</span>
                    <span className="font-semibold text-teal-700">Sell {npr(p.sellingPrice)}</span>
                    <span className="text-gray-300">·</span>
                    <span className={cn(
                      "font-semibold",
                      margin < 10 ? "text-red-500" : margin < 20 ? "text-amber-600" : "text-green-600",
                    )}>
                      {margin}% margin
                    </span>
                  </div>
                </div>

                <ChevronRight size={14} className="shrink-0 text-gray-300" />
              </button>
            );
          })}
        </div>
      )}

      {hasMore && (
        <button
          onClick={loadMore}
          className="mt-3 w-full rounded-xl border border-border-subtle bg-white py-2.5 text-sm font-medium text-teal-600 hover:bg-teal-50 active:bg-teal-100 transition-colors"
        >
          Show more · {total - visible.length} remaining
        </button>
      )}

      <div className="h-6" />
    </PageShell>
  );
};
