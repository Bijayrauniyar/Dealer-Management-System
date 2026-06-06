import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams, useLocation } from "react-router-dom";
import { toast } from "sonner";
import type { Sale, BillStatus } from "@/domain/types";
import { Printer, Pencil, CreditCard, RotateCcw, Download, Share2 } from "lucide-react";
import { downloadBillPdf, shareBillPdf } from "@/lib/billExport";
import { printBill, useBillDocumentTitle } from "@/lib/printBill";
import { PageShell } from "@/components/app/PageShell";
import { BillPrintView } from "@/components/app/BillPrintView";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  useSaleByBillQuery,
  useOutstandingBills,
  usePayments,
  useCustomers,
  useDomainBundleLoadState,
  useBusinessSettings,
} from "@/store/domain";
import { DateDisplay } from "@/components/app/DateDisplay";
import { npr, fmtDateDualBs } from "@/lib/utils";
import { PageBackLink } from "@/components/app/PageBackLink";
import { PageActionBar } from "@/components/app/PageActionBar";

function saleFromLocationState(raw: unknown, urlBillNo: string | undefined): Sale | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const s = raw as Partial<Sale>;
  if (typeof s.billNo !== "string" || !Array.isArray(s.lines)) return undefined;
  const fromUrl = (urlBillNo ?? "").trim();
  if (fromUrl) {
    const decoded = decodeURIComponent(fromUrl);
    if (s.billNo !== decoded && s.billNo !== fromUrl) return undefined;
  }
  return s as Sale;
}

function daysOverdue(dueDate: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dueDate);
  d.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - d.getTime()) / 86_400_000);
}

const STATUS_CONFIG: Record<BillStatus, { label: string; variant: "success" | "warning" | "danger" | "teal" }> = {
  paid:    { label: "Fully Paid", variant: "success" },
  current: { label: "Current",   variant: "teal"    },
  partial: { label: "Partial",   variant: "warning"  },
  overdue: { label: "Overdue",   variant: "danger"   },
};

export const BillDetailPage = () => {
  const { billNo }     = useParams<{ billNo: string }>();
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const location       = useLocation();

  // Reactive store lookups — update automatically after commitSale/commitPayment
  const saleQuery         = useSaleByBillQuery(billNo ?? "");
  const fetchedSale       = saleQuery.data;
  const OUTSTANDING_BILLS = useOutstandingBills();
  const PAYMENTS          = usePayments();
  const CUSTOMERS         = useCustomers();

  const loadState = useDomainBundleLoadState();

  const stateSaleRaw = (location.state as { sale?: unknown } | null)?.sale;
  const stateSale = saleFromLocationState(stateSaleRaw, billNo);
  /** DB sale is source of truth after save; navigation state only while loading. */
  const sale = fetchedSale ?? stateSale;
  const obEntry   = OUTSTANDING_BILLS.find((b) => b.billNo === billNo);
  const payments  = PAYMENTS.filter((p) => p.billNo === billNo);
  const customer  = sale ? CUSTOMERS.find((c) => c.id === sale.customerId) : undefined;
  const business  = useBusinessSettings();
  const [exporting, setExporting] = useState(false);

  const handleDownload = async () => {
    if (!sale) return;
    setExporting(true);
    try {
      await downloadBillPdf({ sale, customer, business });
      toast.success("Bill downloaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Download failed");
    } finally {
      setExporting(false);
    }
  };

  const handleShare = async () => {
    if (!sale) return;
    setExporting(true);
    try {
      const result = await shareBillPdf({ sale, customer, business });
      if (result === "shared") toast.success("Shared");
      else toast.success("PDF downloaded — share from your files");
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") {
        toast.error(e instanceof Error ? e.message : "Share failed");
      }
    } finally {
      setExporting(false);
    }
  };

  useBillDocumentTitle(sale?.billNo);

  // Auto-print only after bill card is in the DOM (avoids printing "Loading bill…").
  useEffect(() => {
    if (searchParams.get("print") !== "1" || !sale?.billNo) return;
    let cancelled = false;
    const tryPrint = (attempt = 0) => {
      if (cancelled) return;
      if (document.getElementById("bill-print-root")) {
        printBill(sale.billNo);
        return;
      }
      if (attempt < 20) {
        setTimeout(() => tryPrint(attempt + 1), 150);
      }
    };
    const t = setTimeout(() => tryPrint(), 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [searchParams, sale?.billNo, sale?.lines.length]);

  const waitingForSale =
    !sale && (loadState === "loading" || saleQuery.isLoading || !saleQuery.isFetched);

  if (waitingForSale) {
    return (
      <PageShell>
        <PageBackLink className="mb-0 flex items-center gap-1 text-sm font-medium text-teal-600" />
        <p className="mt-16 text-center text-sm text-slate-600">Loading bill…</p>
      </PageShell>
    );
  }

  if (loadState === "error") {
    return (
      <PageShell>
        <PageBackLink className="mb-0 flex items-center gap-1 text-sm font-medium text-teal-600" />
        <p className="mt-16 text-center text-sm text-slate-600">Could not load shop data. Check your connection and try again.</p>
      </PageShell>
    );
  }

  if (!sale) {
    if (!saleQuery.isFetched) {
      return (
        <PageShell>
          <PageBackLink className="mb-0 flex items-center gap-1 text-sm font-medium text-teal-600" />
          <p className="mt-16 text-center text-sm text-slate-600">Loading bill…</p>
        </PageShell>
      );
    }
    return (
      <PageShell>
        <PageBackLink className="mb-0 flex items-center gap-1 text-sm font-medium text-teal-600" />
        <div className="mx-auto mt-16 max-w-sm space-y-3 px-4 text-center">
          <p className="text-sm text-slate-700">
            No bill <span className="font-mono font-semibold text-slate-900">{billNo ? decodeURIComponent(billNo) : "—"}</span>{" "}
            for this shop.
          </p>
          <p className="text-xs text-slate-500">
            It may have been removed (for example after a data reset), or the link is outdated.
          </p>
          <button
            type="button"
            onClick={() => navigate("/app/home")}
            className="text-sm font-semibold text-teal-600 underline underline-offset-2"
          >
            Go to home
          </button>
        </div>
      </PageShell>
    );
  }

  const status = (obEntry?.status ?? (sale.balance === 0 ? "paid" : "current")) as BillStatus;
  const cfg    = STATUS_CONFIG[status];
  const overDays = daysOverdue(sale.dueDate);

  return (
    <PageShell className="pb-56">
      {/* ── Top bar: back + status + actions ── */}
      <div data-no-print className="mb-4 flex items-center justify-between gap-2">
        <PageBackLink className="mb-0 flex items-center gap-1 text-sm font-medium text-teal-600" />

        <Badge variant={cfg.variant} className="text-xs px-2.5 py-1">{cfg.label}</Badge>
      </div>

      {/* ── Overdue / status alert ── */}
      {status === "overdue" && (
        <div data-no-print className="mb-4 flex items-center justify-between gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm font-semibold text-danger">
            {overDays}d overdue — was due {fmtDateDualBs(sale.dueDate)}
          </p>
          <button
            onClick={() => navigate(`/app/payments/new?customerId=${sale.customerId}`)}
            className="shrink-0 text-xs font-bold text-teal-600 underline"
          >
            Collect now
          </button>
        </div>
      )}

      {/* ── Bill: centered on screen and on A4 print ── */}
      <div className="bill-print-zone mb-4 w-full min-w-0">
        <BillPrintView sale={sale} customer={customer} />
      </div>

      {/* ── Payment history (app-only, hidden on print) ── */}
      {payments.length > 0 && (
        <div data-no-print className="mb-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            Payments received
          </p>
          <Card>
            <CardContent className="p-0 px-4">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between border-b border-border-subtle py-2.5 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-success-foreground">{npr(p.amount)}</p>
                    <p className="text-xs text-muted">
                      <DateDisplay iso={p.date} dual compact /> · {p.mode}{p.reference ? ` · ${p.reference}` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      <PageActionBar
        disabled={exporting}
        rows={[
          [
            {
              label: "Share",
              icon: Share2,
              variant: "secondary",
              onClick: handleShare,
              title: "Share bill PDF",
            },
            {
              label: "Print",
              icon: Printer,
              variant: "secondary",
              onClick: () => sale && printBill(sale.billNo),
              title: "Print bill",
            },
            {
              label: "PDF",
              icon: Download,
              variant: "secondary",
              onClick: handleDownload,
            },
            ...(status !== "paid"
              ? [
                  {
                    label: "Edit bill",
                    icon: Pencil,
                    variant: "icon" as const,
                    onClick: () =>
                      navigate(`/app/sales/edit/${sale.billNo}`, { state: { sale } }),
                  },
                ]
              : []),
          ],
          [
            {
              label: "Return",
              icon: RotateCcw,
              variant: "secondary",
              onClick: () =>
                navigate(
                  `/app/returns/new?customerId=${sale.customerId}&billNo=${sale.billNo}`,
                ),
            },
            ...(sale.balance > 0
              ? [
                  {
                    label: `Collect · ${npr(sale.balance)}`,
                    icon: CreditCard,
                    variant: "primary" as const,
                    onClick: () =>
                      navigate(`/app/payments/new?customerId=${sale.customerId}`),
                  },
                ]
              : []),
          ],
        ]}
      />
    </PageShell>
  );
};
