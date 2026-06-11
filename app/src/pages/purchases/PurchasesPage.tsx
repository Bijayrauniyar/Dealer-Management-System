import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet } from "lucide-react";
import { ListPageHeader, SegmentedTabs } from "@/components/app/patterns";
import { PageShell } from "@/components/app/PageShell";
import { EntityList, EntityListCard } from "@/components/app/EntityListCard";
import { EmptyState } from "@/components/app/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListBrowsePanel, type BrowseFilterOption } from "@/components/app/ListBrowsePanel";
import { ListPagination } from "@/components/app/ListPagination";
import type { PurchaseListItem } from "@/domain/types";
import { purchaseDisplaySubtitle, purchaseDisplayTitle } from "@/lib/purchaseDisplay";
import { browseListSummary } from "@/lib/listBrowseSummary";
import { usePagination } from "@/lib/usePagination";
import {
  useDomainBundleErrorMessage,
  useDomainBundleLoadState,
  usePurchasesList,
  useSuppliers,
} from "@/store/domain";
import { fmtDateDualBs, npr } from "@/lib/utils";

type HubTab = "invoices" | "suppliers";
type PaymentFilter = "all" | "unpaid" | "partial" | "paid";
type SortKey = "date_desc" | "date_asc" | "amount_desc" | "amount_asc" | "supplier_asc";

const PAYMENT_BADGE: Record<
  PurchaseListItem["paymentStatus"],
  { label: string; variant: "success" | "warning" | "danger" }
> = {
  paid: { label: "Paid", variant: "success" },
  partial: { label: "Partial", variant: "warning" },
  unpaid: { label: "Unpaid", variant: "danger" },
};

export const PurchasesPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<HubTab>("invoices");
  const [query, setQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [sort, setSort] = useState<SortKey>("date_desc");
  const [supplierListFilter, setSupplierListFilter] = useState<"all" | "payable">("all");

  const loadState = useDomainBundleLoadState();
  const loadError = useDomainBundleErrorMessage();
  const PURCHASES = usePurchasesList();
  const SUPPLIERS = useSuppliers();

  const purchaseSearchPool = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PURCHASES.filter((p) => {
      if (supplierFilter !== "all" && p.supplierId !== supplierFilter) return false;
      if (!q) return true;
      const title = purchaseDisplayTitle(p).toLowerCase();
      const sub = purchaseDisplaySubtitle(p).toLowerCase();
      return (
        title.includes(q) ||
        sub.includes(q) ||
        p.supplierName.toLowerCase().includes(q) ||
        p.purchaseNo.toLowerCase().includes(q)
      );
    });
  }, [PURCHASES, query, supplierFilter]);

  const filteredPurchases = useMemo(() => {
    const list = purchaseSearchPool.filter((p) => {
      if (paymentFilter === "all") return true;
      return p.paymentStatus === paymentFilter;
    });
    list.sort((a, b) => {
      switch (sort) {
        case "date_asc":
          return a.date.localeCompare(b.date) || a.purchaseNo.localeCompare(b.purchaseNo);
        case "amount_desc":
          return b.total - a.total || b.date.localeCompare(a.date);
        case "amount_asc":
          return a.total - b.total || b.date.localeCompare(a.date);
        case "supplier_asc":
          return (
            a.supplierName.localeCompare(b.supplierName) ||
            b.date.localeCompare(a.date)
          );
        case "date_desc":
        default:
          return b.date.localeCompare(a.date) || b.purchaseNo.localeCompare(a.purchaseNo);
      }
    });
    return list;
  }, [purchaseSearchPool, paymentFilter, sort]);

  const paymentFilterOptions = useMemo((): BrowseFilterOption[] => {
    const base = supplierFilter === "all" ? PURCHASES : PURCHASES.filter((p) => p.supplierId === supplierFilter);
    const pool = query.trim()
      ? base.filter((p) => {
          const q = query.trim().toLowerCase();
          return (
            purchaseDisplayTitle(p).toLowerCase().includes(q) ||
            p.supplierName.toLowerCase().includes(q)
          );
        })
      : base;
    const unpaid = pool.filter((p) => p.paymentStatus === "unpaid").length;
    const partial = pool.filter((p) => p.paymentStatus === "partial").length;
    const paid = pool.filter((p) => p.paymentStatus === "paid").length;
    return [
      { value: "all", label: `All (${pool.length})` },
      { value: "unpaid", label: `Unpaid (${unpaid})` },
      { value: "partial", label: `Partial (${partial})` },
      { value: "paid", label: `Paid (${paid})` },
    ];
  }, [PURCHASES, supplierFilter, query]);

  const supplierFilterOptions = useMemo((): BrowseFilterOption[] => {
    const opts: BrowseFilterOption[] = [
      { value: "all", label: `All suppliers (${PURCHASES.length})` },
    ];
    const ids = [...new Set(PURCHASES.map((p) => p.supplierId))];
    for (const id of ids) {
      const name = PURCHASES.find((p) => p.supplierId === id)?.supplierName ?? "Supplier";
      const n = PURCHASES.filter((p) => p.supplierId === id).length;
      opts.push({ value: id, label: `${name} (${n})` });
    }
    return opts.sort((a, b) => {
      if (a.value === "all") return -1;
      if (b.value === "all") return 1;
      return a.label.localeCompare(b.label);
    });
  }, [PURCHASES]);

  const sortOptions = [
    { value: "date_desc", label: "Date (newest)" },
    { value: "date_asc", label: "Date (oldest)" },
    { value: "amount_desc", label: "Amount (high)" },
    { value: "amount_asc", label: "Amount (low)" },
    { value: "supplier_asc", label: "Supplier (A–Z)" },
  ];

  const purchaseResetKey = `${query}|${paymentFilter}|${supplierFilter}|${sort}`;
  const purchasePage = usePagination(filteredPurchases, undefined, purchaseResetKey);

  const supplierSearchMatched = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SUPPLIERS.filter(
      (s) =>
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.contactPerson.toLowerCase().includes(q),
    );
  }, [SUPPLIERS, query]);

  const filteredSuppliers = useMemo(() => {
    return supplierSearchMatched.filter((s) => {
      if (supplierListFilter === "payable") return s.outstanding > 0;
      return true;
    });
  }, [supplierSearchMatched, supplierListFilter]);

  const supplierStatusFilterOptions = useMemo((): BrowseFilterOption[] => {
    const payableCount = supplierSearchMatched.filter((s) => s.outstanding > 0).length;
    return [
      { value: "all", label: `All (${supplierSearchMatched.length})` },
      { value: "payable", label: `Payable (${payableCount})` },
    ];
  }, [supplierSearchMatched]);

  const supplierResetKey = `${query}|${supplierListFilter}`;
  const supplierPage = usePagination(filteredSuppliers, undefined, supplierResetKey);

  const totalPayable = useMemo(
    () => SUPPLIERS.reduce((s, x) => s + Math.max(0, x.outstanding), 0),
    [SUPPLIERS],
  );

  return (
    <PageShell>
      <ListPageHeader
        title="Purchases"
        addLabel={tab === "invoices" ? "New invoice" : "Add supplier"}
        onAdd={() =>
          navigate(tab === "invoices" ? "/app/purchases/new" : "/app/suppliers/new")
        }
      />

      <SegmentedTabs
        value={tab}
        onChange={setTab}
        className="mb-4"
        options={[
          { id: "invoices", label: `Invoices (${PURCHASES.length})` },
          { id: "suppliers", label: `Suppliers (${SUPPLIERS.length})` },
        ]}
      />

      {tab === "invoices" && totalPayable > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
          <span className="text-sm text-amber-900">
            Total payable: <span className="font-bold">{npr(totalPayable)}</span>
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-amber-300 bg-white"
            onClick={() => navigate("/app/supplier-payments/new")}
          >
            <Wallet size={14} /> Record payment
          </Button>
        </div>
      )}

      {tab === "invoices" ? (
        <>
          <ListBrowsePanel
            search={query}
            onSearchChange={setQuery}
            searchPlaceholder="Search invoice, supplier…"
            filterValue={paymentFilter}
            filterOptions={paymentFilterOptions}
            onFilterChange={(v) => setPaymentFilter(v as PaymentFilter)}
            filterLabel="Payment"
            filterVariant={paymentFilter === "unpaid" ? "danger" : "default"}
            extraFilter={{
              label: "Supplier",
              value: supplierFilter,
              options: supplierFilterOptions,
              onChange: setSupplierFilter,
            }}
            sortValue={sort}
            sortOptions={sortOptions}
            onSortChange={(v) => setSort(v as SortKey)}
            summary={
              filteredPurchases.length > 0
                ? browseListSummary(filteredPurchases.length, purchasePage.showingLabel)
                : undefined
            }
            className="mb-4"
          />

          {loadState === "loading" && (
            <p className="py-10 text-center text-sm text-muted">Loading purchases…</p>
          )}
          {loadState === "error" && (
            <p className="px-4 py-10 text-center text-sm text-danger">
              Could not load purchases.
              {loadError ? ` ${loadError}` : ""}
            </p>
          )}
          {loadState === "ready" && filteredPurchases.length === 0 && (
            <EmptyState
              title={query || paymentFilter !== "all" || supplierFilter !== "all" ? "No matches" : "No purchase invoices yet"}
              body={
                query || paymentFilter !== "all" || supplierFilter !== "all"
                  ? "Try another search or filter."
                  : "Tap New invoice above to record supplier stock inward."
              }
            />
          )}
          {loadState === "ready" && filteredPurchases.length > 0 && (
            <EntityList>
              {purchasePage.visible.map((p) => {
                const cfg = PAYMENT_BADGE[p.paymentStatus];
                const balance = Math.max(0, p.total - p.paid);
                return (
                  <EntityListCard
                    key={p.id}
                    title={purchaseDisplayTitle(p)}
                    subtitle={[
                      fmtDateDualBs(p.date),
                      p.supplierName,
                      p.dueDate ? `Due ${fmtDateDualBs(p.dueDate)}` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                    accent={balance > 0 ? "danger" : "teal"}
                    trailing={
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="text-sm font-semibold tabular-nums text-foreground">
                          {npr(p.total)}
                        </span>
                        <Badge variant={cfg.variant} className="text-[10px]">
                          {balance > 0 ? `${cfg.label} · ${npr(balance)}` : cfg.label}
                        </Badge>
                      </div>
                    }
                    onClick={() => navigate(`/app/purchases/${p.id}`)}
                  />
                );
              })}
            </EntityList>
          )}
          {loadState === "ready" && filteredPurchases.length > 0 && (
            <ListPagination
              page={purchasePage.page}
              totalPages={purchasePage.totalPages}
              total={purchasePage.total}
              hasPrev={purchasePage.hasPrev}
              hasNext={purchasePage.hasNext}
              onPrev={purchasePage.goPrev}
              onNext={purchasePage.goNext}
            />
          )}
        </>
      ) : (
        <>
          <ListBrowsePanel
            search={query}
            onSearchChange={setQuery}
            searchPlaceholder="Search supplier…"
            filterValue={supplierListFilter}
            filterOptions={supplierStatusFilterOptions}
            onFilterChange={(v) => setSupplierListFilter(v as "all" | "payable")}
            filterLabel="Status"
            summary={
              filteredSuppliers.length > 0
                ? browseListSummary(filteredSuppliers.length, supplierPage.showingLabel)
                : undefined
            }
            className="mb-4"
          />

          <p className="mb-3 text-[11px] text-muted leading-snug">
            Tap a supplier to view invoices, edit, or archive. Archived suppliers are under More → Archives.
          </p>

          {loadState === "loading" && (
            <p className="py-10 text-center text-sm text-muted">Loading suppliers…</p>
          )}
          {loadState === "error" && (
            <p className="px-4 py-10 text-center text-sm text-danger">
              Could not load suppliers.
              {loadError ? ` ${loadError}` : ""}
            </p>
          )}
          {loadState === "ready" && filteredSuppliers.length === 0 && (
            <EmptyState
              title={query || supplierListFilter !== "all" ? "No matches" : "No suppliers yet"}
              body={query || supplierListFilter !== "all" ? "Try another search or filter." : "Tap Add supplier above."}
            />
          )}
          {loadState === "ready" && filteredSuppliers.length > 0 && (
            <EntityList>
              {supplierPage.visible.map((s) => (
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
                  onClick={() => navigate(`/app/suppliers/${s.id}/invoices`)}
                />
              ))}
            </EntityList>
          )}
          {loadState === "ready" && filteredSuppliers.length > 0 && (
            <ListPagination
              page={supplierPage.page}
              totalPages={supplierPage.totalPages}
              total={supplierPage.total}
              hasPrev={supplierPage.hasPrev}
              hasNext={supplierPage.hasNext}
              onPrev={supplierPage.goPrev}
              onNext={supplierPage.goNext}
            />
          )}
        </>
      )}
    </PageShell>
  );
};
