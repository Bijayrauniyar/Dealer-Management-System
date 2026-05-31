import { useState } from "react";
import { toast } from "sonner";
import { Download, Archive } from "lucide-react";
import { FormField } from "@/components/app/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { downloadCsv } from "@/lib/export/csv";
import {
  buildCustomersExport,
  buildOutstandingExport,
  buildProductsExport,
  buildPurchasesRegisterExport,
  buildSalesLinesExport,
  buildSalesRegisterExport,
  buildStockSnapshotExport,
  buildVatPeriodSummaryExport,
  CUSTOMER_COLUMNS,
  OUTSTANDING_COLUMNS,
  PRODUCT_COLUMNS,
  PURCHASE_REGISTER_COLUMNS,
  SALES_LINES_COLUMNS,
  SALES_REGISTER_COLUMNS,
  STOCK_COLUMNS,
  VAT_SUMMARY_COLUMNS,
} from "@/lib/export/buildRegisters";
import { downloadFullBackupZip } from "@/lib/export/backupZip";
import { toDateInput } from "@/lib/utils";

function defaultRange() {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 30);
  return { from: toDateInput(from), to: toDateInput(to) };
}

export function ExportSection() {
  const [range, setRange] = useState(defaultRange);
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (label: string, fn: () => Promise<void>) => {
    setBusy(label);
    try {
      await fn();
      toast.success(`${label} downloaded`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : `Export failed: ${label}`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        CSV exports for your accountant (UTF-8, opens in Excel). Full backup is owner data only — keep files private.
      </p>

      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-teal-600">Quick export</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            variant="secondary"
            disabled={!!busy}
            onClick={() =>
              void run("Products", async () => {
                const rows = await buildProductsExport(true);
                downloadCsv(`products-${range.to}`, rows, [...PRODUCT_COLUMNS]);
              })
            }
          >
            <Download size={16} className="mr-2" />
            Products
          </Button>
          <Button
            variant="secondary"
            disabled={!!busy}
            onClick={() =>
              void run("Customers", async () => {
                const rows = await buildCustomersExport();
                downloadCsv(`customers-${range.to}`, rows, [...CUSTOMER_COLUMNS]);
              })
            }
          >
            <Download size={16} className="mr-2" />
            Customers
          </Button>
          <Button
            variant="secondary"
            disabled={!!busy}
            onClick={() =>
              void run("Stock", async () => {
                const rows = await buildStockSnapshotExport();
                downloadCsv(`stock-${range.to}`, rows, [...STOCK_COLUMNS]);
              })
            }
          >
            <Download size={16} className="mr-2" />
            Stock snapshot
          </Button>
          <Button
            variant="secondary"
            disabled={!!busy}
            onClick={() =>
              void run("Outstanding", async () => {
                const rows = await buildOutstandingExport();
                downloadCsv(`customer-outstanding-${range.to}`, rows, [...OUTSTANDING_COLUMNS]);
              })
            }
          >
            <Download size={16} className="mr-2" />
            Credit outstanding
          </Button>
        </div>
      </div>

      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-teal-600">Period registers</p>
        <div className="mb-4 grid grid-cols-2 gap-3">
          <FormField label="From">
            <Input type="date" value={range.from} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} />
          </FormField>
          <FormField label="To">
            <Input type="date" value={range.to} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} />
          </FormField>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            variant="secondary"
            disabled={!!busy}
            onClick={() =>
              void run("Sales register", async () => {
                const rows = await buildSalesRegisterExport(range);
                downloadCsv(`sales-register-${range.from}-${range.to}`, rows, [...SALES_REGISTER_COLUMNS]);
              })
            }
          >
            Sales register
          </Button>
          <Button
            variant="secondary"
            disabled={!!busy}
            onClick={() =>
              void run("Sales lines", async () => {
                const rows = await buildSalesLinesExport(range);
                downloadCsv(`sales-lines-${range.from}-${range.to}`, rows, [...SALES_LINES_COLUMNS]);
              })
            }
          >
            Sales lines
          </Button>
          <Button
            variant="secondary"
            disabled={!!busy}
            onClick={() =>
              void run("Purchases", async () => {
                const rows = await buildPurchasesRegisterExport(range);
                downloadCsv(`purchases-${range.from}-${range.to}`, rows, [...PURCHASE_REGISTER_COLUMNS]);
              })
            }
          >
            Purchase register
          </Button>
          <Button
            variant="secondary"
            disabled={!!busy}
            onClick={() =>
              void run("VAT summary", async () => {
                const rows = await buildVatPeriodSummaryExport(range);
                downloadCsv(`vat-summary-${range.from}-${range.to}`, rows, [...VAT_SUMMARY_COLUMNS]);
              })
            }
          >
            VAT period summary
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="mb-2 text-sm font-semibold text-amber-900">Full backup (ZIP)</p>
        <p className="mb-3 text-xs text-amber-800/90">
          Masters + period registers in one file. Large tenants may take a minute.
        </p>
        <Button
          disabled={!!busy}
          onClick={() =>
            void run("Backup ZIP", async () => {
              await downloadFullBackupZip(range);
            })
          }
        >
          <Archive size={16} className="mr-2" />
          Download backup ZIP
        </Button>
      </div>
    </div>
  );
}
