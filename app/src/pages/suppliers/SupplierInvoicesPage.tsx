import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, FilePlus, Wallet } from "lucide-react";
import { PageShell } from "@/components/app/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePurchasesList, useSuppliers } from "@/store/domain";
import type { PurchaseListItem } from "@/domain/types";
import { npr, fmtDate } from "@/lib/utils";

const PAYMENT_BADGE: Record<
  PurchaseListItem["paymentStatus"],
  { label: string; variant: "success" | "warning" | "danger" }
> = {
  paid: { label: "Paid", variant: "success" },
  partial: { label: "Partial", variant: "warning" },
  unpaid: { label: "Unpaid", variant: "danger" },
};

export const SupplierInvoicesPage = () => {
  const { supplierId } = useParams<{ supplierId: string }>();
  const navigate = useNavigate();
  const SUPPLIERS = useSuppliers();
  const PURCHASES = usePurchasesList();

  const supplier = SUPPLIERS.find((s) => s.id === supplierId);
  const invoices = PURCHASES.filter((p) => p.supplierId === supplierId).sort((a, b) =>
    b.date.localeCompare(a.date),
  );

  if (!supplier) {
    return (
      <PageShell>
        <button
          type="button"
          onClick={() => navigate("/app/suppliers")}
          className="mb-4 flex items-center gap-1 text-sm font-medium text-teal-600"
        >
          <ArrowLeft size={16} /> Suppliers
        </button>
        <p className="text-sm text-muted">Supplier not found.</p>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mb-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => navigate("/app/suppliers")}
          className="flex items-center gap-1 text-sm font-medium text-teal-600"
        >
          <ArrowLeft size={16} /> Suppliers
        </button>
        <Button
          size="sm"
          type="button"
          onClick={() =>
            navigate("/app/purchases/new", { state: { supplierId: supplier.id } })
          }
        >
          <FilePlus size={14} /> New purchase
        </Button>
      </div>

      <h1 className="text-lg font-bold text-foreground">{supplier.name}</h1>
      <p className="mb-4 text-sm text-muted">Purchase invoices · {supplier.paymentTermsDays}d terms</p>

      {supplier.outstanding > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <span className="text-sm text-amber-900">Outstanding payable</span>
          <span className="font-bold text-amber-900">{npr(supplier.outstanding)}</span>
        </div>
      )}

      <div className="mb-4 flex gap-2">
        <Button
          size="sm"
          className="flex-1"
          type="button"
          onClick={() =>
            navigate("/app/supplier-payments/new", { state: { supplierId: supplier.id } })
          }
        >
          <Wallet size={14} /> Record payment
        </Button>
      </div>

      <Card>
        <CardContent className="p-0 px-4">
          {invoices.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">
              No purchases recorded for this supplier yet.
            </p>
          ) : (
            invoices.map((inv) => {
              const cfg = PAYMENT_BADGE[inv.paymentStatus];
              const balance = Math.max(0, inv.total - inv.paid);
              return (
                <button
                  key={inv.id}
                  type="button"
                  className="flex w-full items-center justify-between gap-2 border-b border-border-subtle py-3.5 text-left last:border-0"
                  onClick={() => navigate(`/app/purchases/${inv.id}`)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-teal-600">{inv.purchaseNo}</span>
                      <Badge variant={cfg.variant} className="text-[10px]">
                        {cfg.label}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted">{fmtDate(inv.date)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">{npr(inv.total)}</p>
                      {balance > 0 && inv.paymentStatus !== "paid" && (
                        <p className="text-[10px] text-danger">Due {npr(balance)}</p>
                      )}
                    </div>
                    <ChevronRight size={14} className="text-muted" />
                  </div>
                </button>
              );
            })
          )}
        </CardContent>
      </Card>

      <p className="mt-4 text-center text-xs text-muted">
        Tap an invoice to view line items. Purchases cannot be edited after save — record a new purchase if needed.
      </p>
    </PageShell>
  );
};
