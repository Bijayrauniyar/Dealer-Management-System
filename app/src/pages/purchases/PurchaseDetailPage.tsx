import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FilePlus, Wallet } from "lucide-react";
import { PageShell } from "@/components/app/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PurchaseDetail } from "@/domain/types";
import { fetchPurchaseDetailLive } from "@/lib/live/domainLive";
import { npr, fmtDate } from "@/lib/utils";

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

      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold text-foreground">{detail.purchaseNo}</h1>
          <p className="text-sm text-muted">{fmtDate(detail.date)} · {detail.supplierName}</p>
        </div>
        <Badge variant={cfg.variant}>{cfg.label}</Badge>
      </div>

      <div className="mb-4 flex gap-2">
        {balance > 0 && (
          <Button
            size="sm"
            className="flex-1"
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
          className="flex-1"
          type="button"
          onClick={() =>
            navigate("/app/purchases/new", { state: { supplierId: detail.supplierId } })
          }
        >
          <FilePlus size={14} /> New purchase
        </Button>
      </div>

      <Card className="mb-4">
        <CardContent className="space-y-2 p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Subtotal</span>
            <span className="font-semibold">{npr(detail.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Total</span>
            <span className="font-bold">{npr(detail.total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Paid</span>
            <span className="font-semibold text-success-foreground">{npr(detail.paid)}</span>
          </div>
          {balance > 0 && (
            <div className="flex justify-between border-t border-border-subtle pt-2">
              <span className="text-muted">Balance due</span>
              <span className="font-bold text-danger">{npr(balance)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 px-4">
          <p className="border-b border-border-subtle py-2 text-[10px] font-semibold uppercase tracking-wide text-muted">
            Line items
          </p>
          {detail.lines.map((line) => (
            <div
              key={`${line.productId}-${line.qty}-${line.rate}`}
              className="flex justify-between gap-2 border-b border-border-subtle py-3 last:border-0"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{line.productName}</p>
                <p className="text-xs text-muted">
                  {line.qty} × {npr(line.rate)}
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold">{npr(line.amount)}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {detail.notes && (
        <p className="mt-4 text-sm text-muted italic">{detail.notes}</p>
      )}

      <p className="mt-4 text-center text-xs text-muted">
        Purchases are read-only after save. To correct stock or amounts, contact support or record an adjusting entry manually.
      </p>
    </PageShell>
  );
};
