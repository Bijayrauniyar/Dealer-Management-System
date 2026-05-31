import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {Plus, Phone, Mail, MapPin, ChevronDown, ChevronUp, Search, Pencil, Wallet, FileText} from "lucide-react";
import { DetailActions } from "@/components/app/DetailActions";
import { PageShell } from "@/components/app/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDomainBundleErrorMessage, useDomainBundleLoadState, useSuppliers } from "@/store/domain";
import type { Supplier } from "@/domain/types";
import { npr } from "@/lib/utils";
import { ListPagination } from "@/components/app/ListPagination";
import { usePagination } from "@/lib/usePagination";
import { ListPageHeader } from "@/components/app/patterns";

const SupplierCard = ({
  s,
  onRecordPayment,
  onViewPurchases,
  onEdit,
}: {
  s: Supplier;
  onRecordPayment: (supplierId: string) => void;
  onViewPurchases: (supplierId: string) => void;
  onEdit: (supplierId: string) => void;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border-subtle last:border-0 py-3.5">
      {/* Summary row */}
      <div
        className="flex items-start justify-between gap-2 cursor-pointer"
        onClick={() => setOpen((v) => !v)}
        role="button"
        aria-expanded={open}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-foreground truncate">{s.name}</p>
            {s.panNumber && (
              <span className="text-[10px] text-muted bg-surface-card border border-border-subtle rounded px-1.5 py-0.5">
                PAN {s.panNumber}
              </span>
            )}
            {s.vatNumber && (
              <span className="text-[10px] text-teal-700 bg-teal-50 border border-teal-200 rounded px-1.5 py-0.5">
                VAT ✓
              </span>
            )}
          </div>
          <p className="text-xs text-muted mt-0.5">
            {s.contactPerson} · {s.paymentTermsDays}d terms
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {s.outstanding > 0 && (
            <Badge variant="warning" className="text-xs">{npr(s.outstanding)}</Badge>
          )}
          {open
            ? <ChevronUp size={15} className="text-muted" />
            : <ChevronDown size={15} className="text-muted" />}
        </div>
      </div>

      {/* Expanded details */}
      {open && (
        <div className="mt-3 space-y-2 rounded-xl bg-surface-card border border-border-subtle px-4 py-3 text-xs">
          <p className="font-semibold text-muted uppercase tracking-wide text-[10px] mb-2">
            Supplier details
          </p>

          {s.legalName !== s.name && (
            <div className="flex gap-2">
              <span className="w-24 shrink-0 text-muted">Legal name</span>
              <span className="text-foreground font-medium">{s.legalName}</span>
            </div>
          )}

          <div className="flex gap-2">
            <MapPin size={12} className="shrink-0 text-muted mt-0.5" />
            <span className="text-foreground">
              {s.addressLine1}{s.addressLine2 ? `, ${s.addressLine2}` : ""}
              {s.district ? `, ${s.district}` : ""}, {s.country}
            </span>
          </div>

          {s.phone && (
            <a href={`tel:${s.phone}`} className="flex gap-2 text-teal-600">
              <Phone size={12} className="shrink-0 mt-0.5" />
              <span>{s.phone}</span>
            </a>
          )}

          {s.email && (
            <a href={`mailto:${s.email}`} className="flex gap-2 text-teal-600">
              <Mail size={12} className="shrink-0 mt-0.5" />
              <span>{s.email}</span>
            </a>
          )}

          <div className="flex gap-4 pt-1">
            <div>
              <p className="text-muted">PAN</p>
              <p className="font-semibold text-foreground">{s.panNumber || "—"}</p>
            </div>
            <div>
              <p className="text-muted">VAT</p>
              <p className="font-semibold text-foreground">{s.vatNumber || "Not registered"}</p>
            </div>
            <div>
              <p className="text-muted">Payment terms</p>
              <p className="font-semibold text-foreground">{s.paymentTermsDays} days</p>
            </div>
          </div>

          {s.notes && (
            <p className="pt-1 text-muted italic border-t border-border-subtle">{s.notes}</p>
          )}

          <div
            className="pt-2"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="presentation"
          >
            <DetailActions
              actions={[
                ...(s.outstanding > 0
                  ? [
                      {
                        label: "Record supplier payment",
                        icon: Wallet,
                        variant: "primary" as const,
                        onClick: () => onRecordPayment(s.id),
                      },
                    ]
                  : []),
                {
                  label: "Edit supplier",
                  icon: Pencil,
                  variant: s.outstanding > 0 ? "outline" : "primary",
                  onClick: () => onEdit(s.id),
                },
                {
                  label: "View purchase invoices",
                  icon: FileText,
                  variant: "outline",
                  onClick: () => onViewPurchases(s.id),
                },
              ]}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export const SuppliersPage = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const loadState = useDomainBundleLoadState();
  const loadError = useDomainBundleErrorMessage();
  const SUPPLIERS = useSuppliers();

  const filtered = SUPPLIERS.filter((s) =>
    !query ||
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.contactPerson.toLowerCase().includes(query.toLowerCase()),
  );

  const page = usePagination(filtered, undefined, query);

  return (
    <PageShell>
      <ListPageHeader
        showBack
        title="Suppliers"
        addLabel="Add supplier"
        onAdd={() => navigate("/app/suppliers/new")}
      />

      {/* Search */}
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-border-subtle bg-white px-3 py-2 shadow-card focus-within:ring-2 focus-within:ring-teal-500">
        <Search size={14} className="text-muted" />
        <input
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          placeholder="Search supplier…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="p-0 px-4">
          {loadState === "loading" && (
            <p className="py-10 text-center text-sm text-muted">Loading suppliers…</p>
          )}
          {loadState === "error" && (
            <p className="py-10 px-4 text-center text-sm text-danger">
              Could not load suppliers.
              {loadError ? ` ${loadError}` : ""}
            </p>
          )}
          {loadState === "ready" && filtered.length === 0 && (
            <p className="py-10 text-center text-sm text-muted">
              {query ? "No suppliers match your search." : "No suppliers yet. Tap Add supplier above."}
            </p>
          )}
          {page.visible.map((s) => (
            <SupplierCard
              key={s.id}
              s={s}
              onRecordPayment={(id) =>
                navigate("/app/supplier-payments/new", { state: { supplierId: id } })
              }
              onViewPurchases={(id) => navigate(`/app/suppliers/${id}/invoices`)}
              onEdit={(id) => navigate(`/app/suppliers/edit/${id}`)}
            />
          ))}
        </CardContent>
      </Card>

      {loadState === "ready" && filtered.length > 0 && (
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

      <p className="mt-4 text-xs text-center text-muted">
        Tap a supplier to see address, PAN/VAT, and contact details.
      </p>
    </PageShell>
  );
};
