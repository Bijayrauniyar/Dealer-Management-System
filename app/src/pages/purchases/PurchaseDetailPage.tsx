import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FilePlus, Pencil, Wallet } from "lucide-react";
import { PageShell } from "@/components/app/PageShell";
import { PurchaseBillView } from "@/components/app/PurchaseBillView";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PurchaseDetail, Supplier } from "@/domain/types";
import { fetchPurchaseDetailLive } from "@/lib/live/domainLive";
import { useBusinessSettings, useSuppliers } from "@/store/domain";

const PAYMENT_BADGE: Record<
  PurchaseDetail["paymentStatus"],
  { label: string; variant: "success" | "warning" | "danger" }
> = {
  paid: { label: "Paid", variant: "success" },
  partial: { label: "Partial", variant: "warning" },
  unpaid: { label: "Unpaid", variant: "danger" },
};

export const PurchaseDetailPage = () => {
  const { purchaseId } = useParams<{ purchaseId: string }>();
  const navigate = useNavigate();
  const business = useBusinessSettings();
  const SUPPLIERS = useSuppliers();
  const [detail, setDetail] = useState<PurchaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!purchaseId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    void fetchPurchaseDetailLive(purchaseId)
      .then((d) => {
        if (!cancelled) setDetail(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load purchase");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [purchaseId]);

  if (loading) {
    return (
      <PageShell>
        <p className="text-sm text-muted">Loading purchase…</p>
      </PageShell>
    );
  }

  if (error || !detail) {
    return (
      <PageShell>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-1 text-sm font-medium text-teal-600"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <p className="text-sm text-danger">{error ?? "Purchase not found."}</p>
      </PageShell>
    );
  }

  const supplier: Supplier | undefined = SUPPLIERS.find((s) => s.id === detail.supplierId);
  const cfg = PAYMENT_BADGE[detail.paymentStatus];
  const balance = Math.max(0, detail.total - detail.paid);

  return (
    <PageShell>
      <button
        type="button"
        onClick={() => navigate(`/app/suppliers/${detail.supplierId}/invoices`)}
        className="mb-4 flex items-center gap-1 text-sm font-medium text-teal-600"
      >
        <ArrowLeft size={16} /> {detail.supplierName}
      </button>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Badge variant={cfg.variant}>{cfg.label}</Badge>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Button
          size="sm"
          className="flex-1 min-w-[8rem]"
          type="button"
          onClick={() => navigate(`/app/purchases/edit/${detail.id}`)}
        >
          <Pencil size={14} /> Edit purchase
        </Button>
        {balance > 0 && (
          <Button
            size="sm"
            variant="outline"
            className="flex-1 min-w-[8rem]"
            type="button"
            onClick={() =>
              navigate("/app/supplier-payments/new", {
                state: { supplierId: detail.supplierId },
              })
            }
          >
            <Wallet size={14} /> Record payment
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          className="flex-1 min-w-[8rem]"
          type="button"
          onClick={() =>
            navigate("/app/purchases/new", { state: { supplierId: detail.supplierId } })
          }
        >
          <FilePlus size={14} /> New purchase
        </Button>
      </div>

      {supplier ? (
        <PurchaseBillView purchase={detail} supplier={supplier} business={business} />
      ) : (
        <p className="text-sm text-muted">Supplier details unavailable.</p>
      )}

    </PageShell>
  );
};
