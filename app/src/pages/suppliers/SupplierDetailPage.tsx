import { useNavigate, useParams } from "react-router-dom";
import { FileText, Mail, MapPin, Pencil, Phone, Wallet } from "lucide-react";
import { PageShell } from "@/components/app/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DetailActions } from "@/components/app/DetailActions";
import { KpiCard } from "@/components/app/KpiCard";
import { commitSetSupplierActive, useSuppliersCatalog } from "@/store/domain";
import { MasterArchiveAction } from "@/components/app/MasterArchiveAction";
import { npr } from "@/lib/utils";
import { PageBackLink } from "@/components/app/PageBackLink";

export const SupplierDetailPage = () => {
  const { supplierId } = useParams<{ supplierId: string }>();
  const navigate = useNavigate();
  const SUPPLIERS = useSuppliersCatalog();
  const supplier = SUPPLIERS.find((s) => s.id === supplierId);

  if (!supplier) {
    return (
      <PageShell>
        <PageBackLink className="flex items-center gap-1 text-sm font-medium text-teal-600" />
        <p className="mt-8 text-center text-sm text-muted">Supplier not found.</p>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageBackLink className="flex items-center gap-1 text-sm font-medium text-teal-600" />

      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold text-foreground">{supplier.name}</h1>
          <p className="mt-0.5 text-sm text-muted">
            {supplier.contactPerson || "—"} · {supplier.paymentTermsDays}d terms
          </p>
        </div>
        {!supplier.isActive && <Badge variant="warning">Archived</Badge>}
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <KpiCard
          label="Payable"
          value={npr(supplier.outstanding)}
          variant={supplier.outstanding > 0 ? "warning" : "default"}
        />
        <KpiCard label="Payment terms" value={`${supplier.paymentTermsDays} days`} />
      </div>

      <Card className="mb-4">
        <CardContent className="space-y-3 p-4 text-sm">
          {supplier.legalName !== supplier.name && (
            <div>
              <p className="text-xs text-muted">Legal name</p>
              <p className="font-medium text-foreground">{supplier.legalName}</p>
            </div>
          )}
          <div className="flex gap-2">
            <MapPin size={14} className="shrink-0 text-muted mt-0.5" />
            <span className="text-foreground">
              {supplier.addressLine1}
              {supplier.addressLine2 ? `, ${supplier.addressLine2}` : ""}
              {supplier.district ? `, ${supplier.district}` : ""}, {supplier.country}
            </span>
          </div>
          {supplier.phone && (
            <a href={`tel:${supplier.phone}`} className="flex gap-2 text-teal-600">
              <Phone size={14} className="shrink-0" />
              <span>{supplier.phone}</span>
            </a>
          )}
          {supplier.email && (
            <a href={`mailto:${supplier.email}`} className="flex gap-2 text-teal-600">
              <Mail size={14} className="shrink-0" />
              <span>{supplier.email}</span>
            </a>
          )}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <p className="text-xs text-muted">PAN</p>
              <p className="font-semibold">{supplier.panNumber || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted">VAT</p>
              <p className="font-semibold">{supplier.vatNumber || "Not registered"}</p>
            </div>
          </div>
          {supplier.notes && (
            <p className="border-t border-border-subtle pt-2 text-xs italic text-muted">
              {supplier.notes}
            </p>
          )}
        </CardContent>
      </Card>

      <DetailActions
        actions={[
          ...(supplier.isActive && supplier.outstanding > 0
            ? [
                {
                  label: "Record supplier payment",
                  icon: Wallet,
                  variant: "primary" as const,
                  onClick: () =>
                    navigate("/app/supplier-payments/new", { state: { supplierId: supplier.id } }),
                },
              ]
            : []),
          ...(supplier.isActive
            ? [
                {
                  label: "Purchase invoices",
                  icon: FileText,
                  variant: "outline" as const,
                  onClick: () => navigate(`/app/suppliers/${supplier.id}/invoices`),
                },
                {
                  label: "Edit supplier",
                  icon: Pencil,
                  variant: supplier.outstanding > 0 ? ("outline" as const) : ("primary" as const),
                  onClick: () => navigate(`/app/suppliers/edit/${supplier.id}`),
                },
              ]
            : [
                {
                  label: "View supplier",
                  icon: Pencil,
                  variant: "outline" as const,
                  onClick: () => navigate(`/app/suppliers/edit/${supplier.id}`),
                },
              ]),
        ]}
      />

      {supplier.isActive && (
        <div className="mt-4">
          <MasterArchiveAction
            entityLabel="supplier"
            onSetActive={(active) => commitSetSupplierActive(supplier.id, active)}
            isActive={supplier.isActive}
            onArchived={() => navigate("/app/suppliers")}
          />
        </div>
      )}
    </PageShell>
  );
};
