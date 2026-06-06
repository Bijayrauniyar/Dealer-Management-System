import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { PageShell } from "@/components/app/PageShell";
import { FormPageHeader, SegmentedTabs } from "@/components/app/patterns";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { ListPagination } from "@/components/app/ListPagination";
import { Button } from "@/components/ui/button";
import type { Customer, Product, Supplier } from "@/domain/types";
import {
  commitSetCustomerActive,
  commitSetProductActive,
  commitSetSupplierActive,
  useCustomersCatalog,
  useProductsCatalog,
  useSuppliersCatalog,
} from "@/store/domain";
import { usePagination } from "@/lib/usePagination";
import { npr } from "@/lib/utils";
import { toast } from "sonner";

type ArchiveTab = "products" | "customers" | "suppliers";

export function ArchivesPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<ArchiveTab>("products");
  const [query, setQuery] = useState("");
  const [restoreTarget, setRestoreTarget] = useState<{
    tab: ArchiveTab;
    id: string;
    name: string;
  } | null>(null);
  const [restoring, setRestoring] = useState(false);

  const archivedProducts = useProductsCatalog().filter((p) => !p.isActive);
  const archivedCustomers = useCustomersCatalog().filter((c) => !c.isActive);
  const archivedSuppliers = useSuppliersCatalog().filter((s) => !s.isActive);

  const counts = {
    products: archivedProducts.length,
    customers: archivedCustomers.length,
    suppliers: archivedSuppliers.length,
  };

  const q = query.trim().toLowerCase();

  const filteredProducts = useMemo(() => {
    if (!q) return archivedProducts;
    return archivedProducts.filter(
      (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q),
    );
  }, [archivedProducts, q]);

  const filteredCustomers = useMemo(() => {
    if (!q) return archivedCustomers;
    return archivedCustomers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.area.toLowerCase().includes(q),
    );
  }, [archivedCustomers, q]);

  const filteredSuppliers = useMemo(() => {
    if (!q) return archivedSuppliers;
    return archivedSuppliers.filter(
      (s) => s.name.toLowerCase().includes(q) || s.phone.toLowerCase().includes(q),
    );
  }, [archivedSuppliers, q]);

  const productPage = usePagination(filteredProducts, undefined, `products|${query}`);
  const customerPage = usePagination(filteredCustomers, undefined, `customers|${query}`);
  const supplierPage = usePagination(filteredSuppliers, undefined, `suppliers|${query}`);

  const activeList =
    tab === "products"
      ? filteredProducts
      : tab === "customers"
        ? filteredCustomers
        : filteredSuppliers;

  const page =
    tab === "products" ? productPage : tab === "customers" ? customerPage : supplierPage;

  const runRestore = async () => {
    if (!restoreTarget) return;
    setRestoring(true);
    try {
      if (restoreTarget.tab === "products") {
        await commitSetProductActive(restoreTarget.id, true);
      } else if (restoreTarget.tab === "customers") {
        await commitSetCustomerActive(restoreTarget.id, true);
      } else {
        await commitSetSupplierActive(restoreTarget.id, true);
      }
      setRestoreTarget(null);
      toast.success(`${restoreTarget.name} restored.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not restore.");
    } finally {
      setRestoring(false);
    }
  };

  const tabLabel =
    tab === "products" ? "product" : tab === "customers" ? "customer" : "supplier";

  const renderProduct = (p: Product) => (
    <li key={p.id} className="flex items-center gap-2 px-3 py-2.5">
      <button
        type="button"
        className="min-w-0 flex-1 text-left"
        onClick={() => navigate(`/app/products/${p.id}`)}
      >
        <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
        <p className="text-[11px] text-muted">{p.category || "—"}</p>
      </button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setRestoreTarget({ tab: "products", id: p.id, name: p.name })}
      >
        Restore
      </Button>
    </li>
  );

  const renderCustomer = (c: Customer) => (
    <li key={c.id} className="flex items-center gap-2 px-3 py-2.5">
      <button
        type="button"
        className="min-w-0 flex-1 text-left"
        onClick={() => navigate(`/app/customers/${c.id}`)}
      >
        <p className="truncate text-sm font-medium text-foreground">{c.name}</p>
        <p className="text-[11px] text-muted">{c.area || "—"}</p>
      </button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setRestoreTarget({ tab: "customers", id: c.id, name: c.name })}
      >
        Restore
      </Button>
    </li>
  );

  const renderSupplier = (s: Supplier) => (
    <li key={s.id} className="flex items-center gap-2 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{s.name}</p>
        <p className="text-[11px] text-muted">
          {s.phone || "—"}
          {s.outstanding > 0 ? ` · Due ${npr(s.outstanding)}` : ""}
        </p>
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setRestoreTarget({ tab: "suppliers", id: s.id, name: s.name })}
      >
        Restore
      </Button>
      <button
        type="button"
        className="shrink-0 text-muted"
        aria-label="Edit supplier"
        onClick={() => navigate(`/app/suppliers/edit/${s.id}`)}
      >
        <ChevronRight size={16} />
      </button>
    </li>
  );

  return (
    <PageShell>
      <FormPageHeader
        title="Archives"
        subtitle="Inactive products, customers, and suppliers. Records are kept for your books — restore when you need them again."
      />

      <SegmentedTabs
        value={tab}
        onChange={setTab}
        className="mb-4"
        options={[
          { id: "products", label: `Products (${counts.products})` },
          { id: "customers", label: `Customers (${counts.customers})` },
          { id: "suppliers", label: `Suppliers (${counts.suppliers})` },
        ]}
      />

      <div className="mb-3 flex items-center gap-2 rounded-lg border border-border-subtle bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-teal-500/40">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search archived ${tab}…`}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted/60"
          aria-label="Search archives"
        />
      </div>

      {activeList.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted">
          {counts[tab] === 0
            ? `No archived ${tab}.`
            : `No archived ${tab} match your search.`}
        </p>
      ) : (
        <>
          <ul className="divide-y divide-border-subtle rounded-xl border border-border-subtle bg-white">
            {tab === "products" && productPage.visible.map(renderProduct)}
            {tab === "customers" && customerPage.visible.map(renderCustomer)}
            {tab === "suppliers" && supplierPage.visible.map(renderSupplier)}
          </ul>
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

      <ConfirmDialog
        open={restoreTarget !== null}
        title={restoreTarget ? `Restore ${restoreTarget.name}?` : ""}
        description={`This ${tabLabel} will appear on active lists and pickers again.`}
        confirmLabel="Restore"
        cancelLabel="Cancel"
        loading={restoring}
        onConfirm={() => void runRestore()}
        onCancel={() => {
          if (!restoring) setRestoreTarget(null);
        }}
      />
    </PageShell>
  );
}
