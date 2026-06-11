import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Download, Eye, FilePlus, Pencil, Printer, Share2, Wallet, X } from "lucide-react";
import { toast } from "sonner";
import { DetailActions } from "@/components/app/DetailActions";
import { PageShell } from "@/components/app/PageShell";
import { PageActionBar } from "@/components/app/PageActionBar";
import { PURCHASE_INVOICE_LABEL } from "@/lib/actionLabels";
import { PurchaseBillView } from "@/components/app/PurchaseBillView";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PurchaseDetail, Supplier } from "@/domain/types";
import { downloadDocumentPdf, shareDocumentPdf } from "@/lib/documentExport";
import { fetchPurchaseDetailLive } from "@/lib/live/domainLive";
import { printPurchaseBill } from "@/lib/printBill";
import { useBusinessSettings, useSuppliers } from "@/store/domain";
import { PageBackLink } from "@/components/app/PageBackLink";

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
  const [previewOpen, setPreviewOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

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

  const supplier: Supplier | undefined = detail
    ? SUPPLIERS.find((s) => s.id === detail.supplierId)
    : undefined;

  const pdfFilename = () => {
    const ref = detail?.supplierInvoiceNo?.trim() || detail?.id?.slice(0, 8) || "purchase";
    return `${ref.replace(/[^\w.-]+/g, "_")}.pdf`;
  };

  const handleShare = async () => {
    if (!detail) return;
    setExporting(true);
    try {
      const result = await shareDocumentPdf(
        "purchase-bill-print-root",
        pdfFilename(),
        `Purchase ${detail.supplierInvoiceNo || detail.id}`,
      );
      if (result === "shared") toast.success("Shared");
      else toast.success("PDF downloaded — share from your files");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Share failed");
    } finally {
      setExporting(false);
    }
  };

  const handleDownload = async () => {
    if (!detail) return;
    setExporting(true);
    try {
      await downloadDocumentPdf("purchase-bill-print-root", pdfFilename());
      toast.success("PDF downloaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Download failed");
    } finally {
      setExporting(false);
    }
  };

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
        <PageBackLink className="flex items-center gap-1 text-sm font-medium text-teal-600" />
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
        onClick={() => navigate("/app/purchases")}
        className="mb-4 flex items-center gap-1 text-sm font-medium text-teal-600"
      >
        <ArrowLeft size={16} /> Purchases
      </button>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Badge variant={cfg.variant}>{cfg.label}</Badge>
      </div>

      <DetailActions
        className="mb-4"
        actions={[
          ...(balance > 0
            ? [
                {
                  label: "Record supplier payment",
                  icon: Wallet,
                  variant: "primary" as const,
                  onClick: () =>
                    navigate("/app/supplier-payments/new", {
                      state: { supplierId: detail.supplierId },
                    }),
                },
              ]
            : []),
          {
            label: "Edit purchase",
            icon: Pencil,
            variant: balance > 0 ? "outline" : "primary",
            onClick: () => navigate(`/app/purchases/edit/${detail.id}`),
          },
          {
            label: PURCHASE_INVOICE_LABEL,
            icon: FilePlus,
            variant: "outline",
            onClick: () =>
              navigate("/app/purchases/new", { state: { supplierId: detail.supplierId } }),
          },
        ]}
      />

      <div className="bill-print-zone mb-4 w-full min-w-0">
        {supplier ? (
          <PurchaseBillView purchase={detail} supplier={supplier} business={business} />
        ) : (
          <p className="text-sm text-muted">Supplier details unavailable.</p>
        )}
      </div>

      <PageActionBar
        disabled={exporting || !supplier}
        rows={[
          [
            {
              label: "Share",
              icon: Share2,
              variant: "secondary",
              onClick: () => void handleShare(),
              title: "Share purchase PDF",
            },
            {
              label: "Print",
              icon: Printer,
              variant: "secondary",
              onClick: () => printPurchaseBill(),
              title: "Print purchase",
            },
            {
              label: "Preview",
              icon: Eye,
              variant: "secondary",
              onClick: () => setPreviewOpen(true),
              title: "Full-screen preview",
            },
            {
              label: "PDF",
              icon: Download,
              variant: "secondary",
              onClick: () => void handleDownload(),
            },
          ],
        ]}
      />

      {previewOpen && supplier ? (
        <div className="fixed inset-0 z-[80] flex flex-col bg-white print:hidden">
          <div className="flex items-center justify-between border-b border-border-subtle px-3 py-2">
            <p className="text-sm font-semibold">Purchase preview</p>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="secondary" onClick={() => printPurchaseBill()}>
                <Printer size={14} /> Print
              </Button>
              <Button type="button" size="sm" onClick={() => setPreviewOpen(false)}>
                <X size={14} /> Close
              </Button>
            </div>
          </div>
          <div className="bill-print-zone flex-1 overflow-y-auto p-2 sm:p-4">
            <PurchaseBillView purchase={detail} supplier={supplier} business={business} />
          </div>
        </div>
      ) : null}
    </PageShell>
  );
};
