import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Phone, Mail, MapPin, ChevronDown, ChevronUp, Search } from "lucide-react";
import { PageShell } from "@/components/app/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSuppliers } from "@/store/domain";
import type { Supplier } from "@/data/dummy";
import { npr } from "@/lib/utils";
import { usePagination } from "@/lib/usePagination";

const SupplierCard = ({ s }: { s: Supplier }) => {
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

          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              onClick={() => {}}
              className="flex-1 text-xs"
            >
              Record payment
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {}}
              className="flex-1 text-xs"
            >
              View invoices
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export const SuppliersPage = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const SUPPLIERS = useSuppliers();

  const filtered = SUPPLIERS.filter((s) =>
    !query ||
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.contactPerson.toLowerCase().includes(query.toLowerCase()),
  );

  const { visible, hasMore, loadMore, total } = usePagination(filtered);

  return (
    <PageShell>
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm font-medium text-teal-600"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <Button size="sm">
          <Plus size={14} /> Add supplier
        </Button>
      </div>

      <h1 className="mb-4 text-lg font-bold text-foreground">Suppliers</h1>

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
          {visible.map((s) => (
            <SupplierCard key={s.id} s={s} />
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

      <p className="mt-4 text-xs text-center text-muted">
        Tap a supplier to see address, PAN/VAT, and contact details.
      </p>
    </PageShell>
  );
};
