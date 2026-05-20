import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, AlertTriangle, ChevronRight, Package, X, FilePlus } from "lucide-react";
import { PageShell } from "@/components/app/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBusinessSettings, useCustomers, useProducts, useOutstandingBills } from "@/store/domain";
import { isLowStock, minStockLabel } from "@/lib/stockAlert";
import { npr, fmtDate, toMiti, toDateInput } from "@/lib/utils";

const TODAY = toDateInput();

type Tab = "customers" | "stock";
type CustFilter = "all" | "overdue" | "dues";
type StockFilter = "all" | "low";

export const HomePage = () => {
  const navigate        = useNavigate();
  const business        = useBusinessSettings();
  const OVERDUE_DAYS    = business.overdueDays;

  // Reactive store data — re-renders when commitSale / commitPayment / commitReturn run
  const CUSTOMERS        = useCustomers();
  const PRODUCTS         = useProducts();
  const OUTSTANDING_BILLS = useOutstandingBills();

  // Derived totals (computed fresh on every render)
  const totalOutstanding  = CUSTOMERS.reduce((s, c) => s + c.outstanding, 0);
  const overdueCustomers  = CUSTOMERS.filter((c) => c.oldestBillDays > OVERDUE_DAYS && c.outstanding > 0);
  const openBillsCount    = OUTSTANDING_BILLS.filter((b) => b.balance > 0).length;
  const lowStockProducts  = PRODUCTS.filter(isLowStock);

  const [tab,         setTab]         = useState<Tab>("customers");
  const [search,      setSearch]      = useState("");
  const [custFilter,  setCustFilter]  = useState<CustFilter>("all");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");

  // ── Customer list ──────────────────────────────────────────────────────────
  const customers = useMemo(() => {
    let list = [...CUSTOMERS];
    if (custFilter === "overdue") list = list.filter((c) => c.oldestBillDays > OVERDUE_DAYS && c.outstanding > 0);
    if (custFilter === "dues") list = list.filter((c) => c.outstanding > 0);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.area.toLowerCase().includes(q));
    }
    return list.sort((a, b) => b.outstanding - a.outstanding);
  }, [CUSTOMERS, search, custFilter, OVERDUE_DAYS]);

  // ── Stock list ─────────────────────────────────────────────────────────────
  const products = useMemo(() => {
    let list = [...PRODUCTS];
    if (stockFilter === "low") list = list.filter(isLowStock);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
    return list.sort((a, b) => a.onHand - b.onHand); // lowest stock first
  }, [PRODUCTS, search, stockFilter]);

  const handleTabChange = (t: Tab) => { setTab(t); setSearch(""); };

  return (
    <PageShell>
      {/* ── Business header + Create Bill CTA ── */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground">{business.name}</h1>
          <p className="text-xs text-muted">
            {fmtDate(TODAY)} · Miti {toMiti(TODAY)}
          </p>
        </div>
        <button
          onClick={() => navigate("/app/sales/new")}
          className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 active:bg-teal-800 transition-colors"
        >
          <FilePlus size={15} /> New bill
        </button>
      </div>

      {/* ── Outstanding summary bar — tappable ── */}
      {totalOutstanding > 0 && (
        <button
          type="button"
          onClick={() => navigate("/app/home/outstanding")}
          className="mb-4 w-full rounded-2xl border border-border-subtle bg-white shadow-card px-4 py-3 text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full ${
                overdueCustomers.length > 0 ? "bg-red-100" : "bg-amber-100"
              }`}>
                <AlertTriangle size={16} className={overdueCustomers.length > 0 ? "text-danger" : "text-warning"} />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{npr(totalOutstanding)} outstanding</p>
                <p className="text-xs text-muted">
                  {openBillsCount} open bills ·{" "}
                  {overdueCustomers.length > 0
                    ? <span className="text-danger font-medium">{overdueCustomers.length} overdue</span>
                    : "all current"}
                </p>
              </div>
            </div>
            <ChevronRight size={16} className="text-muted" />
          </div>
          {overdueCustomers.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {overdueCustomers.slice(0, 3).map((c) => (
                <span key={c.id} className="rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] text-danger font-medium">
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

      {/* ── Tab bar ── */}
      <div className="mb-3 flex rounded-xl bg-surface-card border border-border-subtle overflow-hidden">
        {(["customers", "stock"] as Tab[]).map((t) => (
          <button
            key={t}
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

      {/* ── Search bar ── */}
      <div className="mb-3 relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={tab === "customers" ? "Search customer name or area…" : "Search product name or category…"}
          className="w-full rounded-xl border border-border-subtle bg-white px-9 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">
            <X size={14} />
          </button>
        )}
      </div>

      {/* ── Customer tab ── */}
      {tab === "customers" && (
        <>
          {/* Filter chips */}
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
            {(["all", "overdue", "dues"] as CustFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setCustFilter(f)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold border transition-colors ${
                  custFilter === f
                    ? "bg-teal-600 border-teal-600 text-white"
                    : "border-border-subtle bg-white text-muted"
                }`}
              >
                {f === "all"     ? `All (${CUSTOMERS.length})` :
                 f === "overdue" ? `Overdue (${overdueCustomers.length})` :
                 `Has dues (${CUSTOMERS.filter(c => c.outstanding > 0).length})`}
              </button>
            ))}
          </div>

          {customers.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">No customers match your search.</p>
          ) : (
            <Card>
              <CardContent className="p-0 px-4">
                {customers.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => navigate(`/app/customers/${c.id}`)}
                    className="flex w-full items-center justify-between border-b border-border-subtle py-3.5 last:border-0 text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
                      <p className="text-xs text-muted">{c.area}</p>
                    </div>
                    <div className="ml-3 flex flex-col items-end gap-1 shrink-0">
                      {c.outstanding > 0 ? (
                        <span className={`text-sm font-bold ${
                          c.oldestBillDays > 7 ? "text-danger" : "text-warning"
                        }`}>
                          {npr(c.outstanding)}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-success-foreground">Clear</span>
                      )}
                      {c.outstanding > 0 && (
                        <Badge variant={c.oldestBillDays > 30 ? "danger" : c.oldestBillDays > 7 ? "warning" : "teal"}
                          className="text-[10px] px-1.5 py-0">
                          {c.oldestBillDays}d
                        </Badge>
                      )}
                    </div>
                    <ChevronRight size={14} className="ml-2 shrink-0 text-muted" />
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ── Stock tab ── */}
      {tab === "stock" && (
        <>
          {/* Low stock alert */}
          {lowStockProducts.length > 0 && stockFilter === "all" && (
            <div className="mb-3 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5">
              <Package size={15} className="shrink-0 text-danger" />
              <p className="text-xs text-danger">
                <span className="font-semibold">{lowStockProducts.length} products</span> at or below minimum stock level
              </p>
              <button onClick={() => setStockFilter("low")}
                className="ml-auto shrink-0 text-xs font-semibold text-teal-600 underline">
                Show
              </button>
            </div>
          )}

          {/* Filter chips */}
          <div className="mb-3 flex gap-2">
            {(["all", "low"] as StockFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setStockFilter(f)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold border transition-colors ${
                  stockFilter === f
                    ? "bg-teal-600 border-teal-600 text-white"
                    : "border-border-subtle bg-white text-muted"
                }`}
              >
                {f === "all" ? `All SKUs (${PRODUCTS.length})` : `Low stock (${lowStockProducts.length})`}
              </button>
            ))}
          </div>

          {products.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">No products match your search.</p>
          ) : (
            <Card>
              <CardContent className="p-0 px-4">
                {products.map((p) => {
                  const isLow = isLowStock(p);
                  return (
                    <div key={p.id} className="flex items-center justify-between border-b border-border-subtle py-3.5 last:border-0">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                          {isLow && (
                            <Badge variant="danger" className="text-[10px] px-1.5 py-0 shrink-0">Low</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted">
                          {p.category} · Min {minStockLabel(p)}
                        </p>
                      </div>
                      <div className="ml-3 text-right shrink-0">
                        <p className={`text-sm font-bold ${isLow ? "text-danger" : "text-foreground"}`}>
                          {p.onHand} <span className="text-xs font-normal text-muted">{p.uom}</span>
                        </p>
                        <p className="text-xs text-muted">{npr(p.sellingPrice)} / {p.uom}</p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Stock value summary */}
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
