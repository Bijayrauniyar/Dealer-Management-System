import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";
import { PageShell } from "@/components/app/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProducts } from "@/store/domain";
import { isLowStock, minStockLabel } from "@/lib/stockAlert";
import { usePagination } from "@/lib/usePagination";

export const StockPage = () => {
  const navigate  = useNavigate();
  const PRODUCTS  = useProducts();
  const [query, setQuery] = useState("");

  const lowStock = PRODUCTS.filter(isLowStock);
  const filtered = PRODUCTS.filter((p) =>
    !query || p.name.toLowerCase().includes(query.toLowerCase()),
  );

  const { visible, hasMore, loadMore, total } = usePagination(filtered, 20);

  return (
    <PageShell>
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm font-medium text-teal-600">
        <ArrowLeft size={16} /> Back
      </button>
      <h1 className="mb-1 text-lg font-semibold">Stock</h1>
      <p className="mb-4 text-sm text-muted">Updated on each purchase and sale</p>

      {lowStock.length > 0 && (
        <div className="mb-4 rounded-xl bg-danger-light border border-danger/20 px-4 py-3">
          <p className="text-sm font-medium text-danger-foreground">{lowStock.length} SKUs below minimum</p>
          <p className="text-xs text-danger-foreground/70">{lowStock.map((p) => p.name).join(", ")}</p>
        </div>
      )}

      {/* Search */}
      <div className="mb-3 flex items-center gap-2 rounded-lg border border-border-subtle bg-white px-3 py-2 shadow-card focus-within:ring-2 focus-within:ring-teal-500">
        <Search size={14} className="text-muted" />
        <input
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          placeholder="Search product…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-3 gap-2 border-b border-border-subtle px-4 py-2 text-xs font-semibold text-muted">
            <span>Product</span><span className="text-right">On hand</span><span className="text-right">Min</span>
          </div>
          {visible.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => navigate(`/app/products/${p.id}`)}
              className={`grid w-full grid-cols-3 gap-2 border-b border-border-subtle px-4 py-2.5 text-sm last:border-0 text-left hover:bg-slate-50 active:bg-slate-100 transition-colors ${isLowStock(p) ? "bg-danger-light/40" : ""}`}
            >
              <span className="truncate font-medium text-foreground">{p.name}</span>
              <span className="text-right font-semibold text-foreground">{p.onHand}</span>
              <div className="flex items-center justify-end gap-1">
                <span className="text-muted text-[11px]">{minStockLabel(p)}</span>
                {isLowStock(p) && <Badge variant="danger">Low</Badge>}
              </div>
            </button>
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
    </PageShell>
  );
};
