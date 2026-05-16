import { useEffect } from "react";
import { useNavigate, useParams, useSearchParams, useLocation } from "react-router-dom";
import type { Sale, BillStatus } from "@/domain/types";
import { ArrowLeft, Printer, Pencil, CreditCard, RotateCcw } from "lucide-react";
import { PageShell } from "@/components/app/PageShell";
import { BillPrintView } from "@/components/app/BillPrintView";
import { Card, CardContent } from "@/components/ui/card";
import { Card, CardContent } from "@/components/ui/card";
import { useSaleByBill, useOutstandingBills, usePayments, useCustomers, useDomainBundleLoadState } from "@/store/domain";
import { npr, fmtDate } from "@/lib/utils";

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
  const storeSale         = useSaleByBill(billNo ?? "");
  const OUTSTANDING_BILLS = useOutstandingBills();
  const PAYMENTS          = usePayments();
  const CUSTOMERS         = useCustomers();

  const loadState = useDomainBundleLoadState();

  const stateSaleRaw = (location.state as { sale?: unknown } | null)?.sale;
  const stateSale = saleFromLocationState(stateSaleRaw, billNo);
  const sale      = stateSale ?? storeSale;
  const obEntry   = OUTSTANDING_BILLS.find((b) => b.billNo === billNo);
  const payments  = PAYMENTS.filter((p) => p.billNo === billNo);
  const customer  = sale ? CUSTOMERS.find((c) => c.id === sale.customerId) : undefined;

  useEffect(() => {
    if (searchParams.get("print") === "1" && sale) {
      const t = setTimeout(() => window.print(), 600);
      return () => clearTimeout(t);
    }
  }, [searchParams, sale]);

  if (loadState === "loading") {
    return (
      <PageShell>
        <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm font-medium text-teal-600">
          <ArrowLeft size={16} /> Back
        </button>
        <p className="mt-16 text-center text-sm text-slate-600">Loading bill…</p>
      </PageShell>
    );
  }

  if (loadState === "error") {
    return (
      <PageShell>
        <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm font-medium text-teal-600">
          <ArrowLeft size={16} /> Back
        </button>
        <p className="mt-16 text-center text-sm text-slate-600">Could not load shop data. Check your connection and try again.</p>
      </PageShell>
    );
  }

  if (!sale) return (
    <PageShell>
      <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm font-medium text-teal-600">
        <ArrowLeft size={16} /> Back
      </button>
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

  const status = (obEntry?.status ?? (sale.balance === 0 ? "paid" : "current")) as BillStatus;
  const cfg    = STATUS_CONFIG[status];
  const overDays = daysOverdue(sale.dueDate);

  return (
    <PageShell>
      {/* ── Top bar: back + status + actions ── */}
      <div data-no-print className="mb-4 flex items-center justify-between gap-2">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm font-medium text-teal-600"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <Badge variant={cfg.variant} className="text-xs px-2.5 py-1">{cfg.label}</Badge>
      </div>

      {/* ── Overdue / status alert ── */}
      {status === "overdue" && (
        <div data-no-print className="mb-4 flex items-center justify-between gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm font-semibold text-danger">
            {overDays}d overdue — was due {fmtDate(sale.dueDate)}
          </p>
          <button
            onClick={() => navigate(`/app/payments/new?customerId=${sale.customerId}`)}
            className="shrink-0 text-xs font-bold text-teal-600 underline"
          >
            Collect now
          </button>
        </div>
      )}

      {/* ── Bill (invoice print view) ── */}
      <div className="mb-5 overflow-hidden rounded-2xl border border-border-subtle shadow-card">
        <BillPrintView sale={sale} customer={customer} isPreview={Boolean(stateSale)} />
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
                <div key={p.id} className="flex items-center justify-between border-b border-border-subtle py-3 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-success-foreground">{npr(p.amount)}</p>
                    <p className="text-xs text-muted">
                      {fmtDate(p.date)} · {p.mode}{p.reference ? ` · ${p.reference}` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="h-24" />

      {/* ── Sticky bottom action bar ── */}
      <div data-no-print className="fixed bottom-16 left-0 right-0 z-20 mx-auto max-w-xl px-4 pb-2">
        <div className="flex gap-2 rounded-2xl border border-border-subtle bg-white/95 p-2 shadow-card-md backdrop-blur">
          <button
            onClick={() => window.print()}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-border-subtle bg-white px-3 py-3 text-sm font-medium text-muted hover:bg-slate-50 active:bg-slate-100 transition-colors"
          >
            <Printer size={15} />
          </button>
          {status !== "paid" && (
            <button
              onClick={() => navigate(`/app/sales/edit/${sale.billNo}`, { state: { sale } })}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-border-subtle bg-white px-3 py-3 text-sm font-medium text-muted hover:bg-slate-50 active:bg-slate-100 transition-colors"
            >
              <Pencil size={15} />
            </button>
          )}
          <button
            onClick={() => navigate(`/app/returns/new?customerId=${sale.customerId}&billNo=${sale.billNo}`)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border-subtle bg-white px-3 py-3 text-sm font-semibold text-foreground hover:bg-slate-50 active:bg-slate-100 transition-colors"
          >
            <RotateCcw size={15} /> Return
          </button>
          {sale.balance > 0 && (
            <button
              onClick={() => navigate(`/app/payments/new?customerId=${sale.customerId}`)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-3 py-3 text-sm font-bold text-white shadow-sm hover:bg-teal-700 active:bg-teal-800 transition-colors"
            >
              <CreditCard size={15} /> Collect · {npr(sale.balance)}
            </button>
          )}
        </div>
      </div>
    </PageShell>
  );
};
