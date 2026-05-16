/**
 * BillPrintView
 *
 * Renders a sale bill in proper printed-invoice format.
 * Used on BillDetailPage and as a live preview inside SaleEntryPage.
 *
 * Layout mirrors a standard Nepali sales / tax invoice:
 *   1. Seller letterhead (name, address, PAN/VAT)
 *   2. Bill header (bill no, AD date, BS miti, status)
 *   3. Buyer details (name, address, PAN)
 *   4. Line-item table (S.No | Particulars | Qty | Unit | Rate | Amount)
 *   5. Totals block (subtotal → discount → bill terms → VAT → grand total)
 *   6. Amount in words
 *   7. Payment summary (paid at billing / balance due / due date)
 *   8. Footer text + signature strip
 */
import React from "react";
import type { Sale, Customer, BusinessSettings } from "@/domain/types";
import { useBusinessSettings } from "@/store/domain";
import { nprNum, fmtDate, toMiti, amountInWords } from "@/lib/utils";

type Props = {
  sale: Sale;
  customer?: Customer;
  /** Hide payment-history section (used during preview before first payment) */
  isPreview?: boolean;
};

const joinParts = (...parts: (string | undefined | null)[]) =>
  parts
    .map((s) => (s ?? "").trim())
    .filter(Boolean)
    .join(", ");

/** Multi-line seller address: only non-empty segments, no orphan commas. */
function sellerAddressLines(b: BusinessSettings): string[] {
  const row1 = joinParts(b.addressLine1, b.addressLine2);
  const row2 = joinParts(b.district, b.province, b.country);
  return [row1, row2].filter(Boolean);
}

const lineAmt = (l: { qty: number; rate: number; discountPct?: number }) =>
  Math.round(l.qty * l.rate * (1 - (l.discountPct ?? 0) / 100));

/** Bordered PAN/VAT panel — common on formal tax invoices; shows — until Settings filled. */
function TaxRegistrationBlock({ business, hasTax }: { business: BusinessSettings; hasTax: boolean }) {
  const pan = business.panNumber.trim();
  const vat = business.vatNumber.trim();
  const vatDisplay = business.vatRegistered ? vat || pan || "—" : null;
  return (
    <div className="w-full max-w-[13.5rem] shrink-0 rounded border-2 border-gray-800 bg-white px-3 py-2 shadow-sm md:justify-self-end">
      <p className="border-b border-gray-200 pb-1.5 text-center text-[9px] font-bold uppercase tracking-[0.12em] text-gray-700">
        {hasTax ? "Tax registration" : "Seller registration"}
      </p>
      <dl className="mt-2 space-y-2 text-[11px] leading-tight">
        <div className="flex items-baseline justify-between gap-2">
          <dt className="shrink-0 text-gray-700">PAN</dt>
          <dd className="min-w-0 break-all text-right font-mono font-semibold tabular-nums text-gray-900">{pan || "—"}</dd>
        </div>
        {business.vatRegistered ? (
          <div className="flex items-baseline justify-between gap-2">
            <dt className="shrink-0 text-gray-700">VAT</dt>
            <dd className="min-w-0 break-all text-right font-mono font-semibold tabular-nums text-gray-900">{vatDisplay}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}

export const BillPrintView = ({ sale, customer, isPreview }: Props) => {
  const business  = useBusinessSettings();
  const lines       = Array.isArray(sale.lines) ? sale.lines : [];
  const hasTax      = sale.vatRate > 0;
  const hasTerms    = sale.billTermsAmount > 0;
  const hasDisc     = sale.discountAmount > 0;
  const hasLineDisc = lines.some((l) => (l.discountPct ?? 0) > 0);

  return (
    <div className="mx-auto w-full max-w-lg overflow-hidden rounded-xl border border-gray-300 bg-white text-gray-900 shadow-sm print:max-w-none print:border-0 print:shadow-none">

      {/* ── 1. Letterhead: narrow doc, company left + registration panel (typical tax-invoice pattern) ── */}
      <div className="border-b-2 border-gray-900 bg-white px-4 py-4 md:px-5 md:py-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start md:gap-5">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-600">
              {hasTax ? "Tax invoice" : "Sales bill"}
            </p>
            <h1 className="mt-1.5 break-words text-lg font-bold leading-snug tracking-tight text-gray-900 md:text-xl">
              {business.name}
            </h1>
            {business.legalName.trim() ? (
              <p className="mt-1 text-sm font-medium text-gray-700">{business.legalName}</p>
            ) : null}
            <div className="mt-3 space-y-1 text-xs leading-relaxed text-gray-700">
              {sellerAddressLines(business).map((line, i) => (
                <p key={`seller-addr-${i}`}>{line}</p>
              ))}
              {(business.mobile || business.phone).trim() ? (
                <p>
                  <span className="text-gray-600">Tel.</span>{" "}
                  <span className="font-semibold text-gray-900">{business.mobile || business.phone}</span>
                </p>
              ) : null}
              {business.email.trim() ? (
                <p className="break-all">
                  <span className="text-gray-600">Email</span>{" "}
                  <span className="font-medium text-gray-900">{business.email}</span>
                </p>
              ) : null}
            </div>
          </div>
          <TaxRegistrationBlock business={business} hasTax={hasTax} />
        </div>
      </div>

      <div className="space-y-5 px-4 py-4 md:px-5">

        {/* ── 2. Bill header (aligned label column like printed forms) ── */}
        <div className="grid grid-cols-1 gap-5 border-b border-dashed border-gray-300 pb-4 md:grid-cols-2 md:gap-8">
          <dl className="w-full max-w-xs text-sm">
            <div className="grid grid-cols-[5.5rem_1fr] items-baseline gap-x-3 gap-y-2">
              <dt className="text-gray-600">Bill No.</dt>
              <dd className="break-all font-semibold text-gray-900">{sale.billNo}</dd>
              <dt className="text-gray-600">Date (AD)</dt>
              <dd className="text-gray-900">{fmtDate(sale.date)}</dd>
              <dt className="text-gray-600">Miti (BS)</dt>
              <dd className="tabular-nums text-gray-900">{toMiti(sale.date)}</dd>
            </div>
          </dl>
          <div className="flex flex-col items-start gap-2 md:items-end md:text-right">
            {customer?.address?.trim() ? (
              <dl className="grid w-full max-w-xs grid-cols-1 gap-1 text-sm md:justify-items-end">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Ship / delivery</dt>
                <dd className="text-gray-800">{customer.address.trim()}</dd>
              </dl>
            ) : null}
            {!isPreview && (
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  sale.balance === 0
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border border-amber-200 bg-amber-50 text-amber-900"
                }`}
              >
                {sale.balance === 0 ? "Paid" : "Balance due"}
              </span>
            )}
          </div>
        </div>

        {/* ── 3. Buyer details ── */}
        <div className="grid grid-cols-1 gap-4 border-b border-dashed border-gray-300 pb-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">Billed to</p>
            <p className="font-semibold text-gray-900">{sale.customerName || customer?.name || "—"}</p>
            {customer?.area?.trim() ? (
              <p className="mt-0.5 text-xs text-gray-600">{customer.area}</p>
            ) : null}
            {customer?.address?.trim() ? (
              <p className="mt-1 text-xs leading-relaxed text-gray-600">{customer.address.trim()}</p>
            ) : null}
            {customer?.phone?.trim() ? (
              <p className="mt-1 text-xs text-gray-600">
                <span className="text-gray-500">Ph</span> {customer.phone.trim()}
              </p>
            ) : null}
          </div>
          {customer?.panNumber?.trim() ? (
            <div className="sm:text-right">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">Buyer PAN / VAT</p>
              <p className="font-mono text-sm font-semibold tabular-nums text-gray-900">{customer.panNumber.trim()}</p>
            </div>
          ) : null}
        </div>

        {/* ── 4. Line-item table ── */}
        <div>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-600">
                <th className="border border-gray-200 px-2 py-2 text-center w-8">S.N</th>
                <th className="border border-gray-200 px-3 py-2 text-left">Particulars</th>
                <th className="border border-gray-200 px-2 py-2 text-right w-16">MRP</th>
                <th className="border border-gray-200 px-2 py-2 text-right w-12">Qty</th>
                <th className="border border-gray-200 px-2 py-2 text-center w-12">Unit</th>
                <th className="border border-gray-200 px-2 py-2 text-right w-20">Rate</th>
                {hasLineDisc && (
                  <th className="border border-gray-200 px-2 py-2 text-right w-14">Disc%</th>
                )}
                <th className="border border-gray-200 px-2 py-2 text-right w-24">Amount</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, i) => (
                <tr key={i} className="even:bg-gray-50/50">
                  <td className="border border-gray-200 px-2 py-2 text-center text-gray-500">{i + 1}</td>
                  <td className="border border-gray-200 px-3 py-2 font-medium text-gray-800">{line.productName}</td>
                  <td className="border border-gray-200 px-2 py-2 text-right text-gray-400 text-[11px]">
                    {line.mrp ? nprNum(line.mrp) : "—"}
                  </td>
                  <td className="border border-gray-200 px-2 py-2 text-right">{nprNum(line.qty)}</td>
                  <td className="border border-gray-200 px-2 py-2 text-center text-gray-500 text-[11px]">{line.uom || "PCS"}</td>
                  <td className="border border-gray-200 px-2 py-2 text-right">{nprNum(line.rate)}</td>
                  {hasLineDisc && (
                    <td className="border border-gray-200 px-2 py-2 text-right text-amber-600 text-[11px] font-medium">
                      {(line.discountPct ?? 0) > 0 ? `${line.discountPct}%` : "—"}
                    </td>
                  )}
                  <td className="border border-gray-200 px-2 py-2 text-right font-medium">{nprNum(lineAmt(line))}</td>
                </tr>
              ))}
              {/* Filler rows so table always looks full */}
              {lines.length < 4 && Array.from({ length: 4 - lines.length }).map((_, i) => (
                <tr key={`empty-${i}`}>
                  <td className="border border-gray-200 px-2 py-2 text-gray-300 text-center">{lines.length + i + 1}</td>
                  <td className="border border-gray-200 px-3 py-2" />
                  <td className="border border-gray-200 px-2 py-2" />
                  <td className="border border-gray-200 px-2 py-2" />
                  <td className="border border-gray-200 px-2 py-2" />
                  <td className="border border-gray-200 px-2 py-2" />
                  {hasLineDisc && <td className="border border-gray-200 px-2 py-2" />}
                  <td className="border border-gray-200 px-2 py-2" />
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── 5. Totals block ── */}
        <div className="ml-auto w-full max-w-xs space-y-1 border-t border-gray-200 pt-3">
          <TotalRow label="Subtotal" value={sale.subtotal} />
          {hasDisc && (
            <TotalRow
              label={
                sale.discountType === "percent"
                  ? `Discount (${sale.discountValue}% of subtotal)`
                  : `Discount (flat amount)`
              }
              value={-sale.discountAmount}
              colored="text-red-600"
            />
          )}
          {hasTerms && (
            <TotalRow label={sale.billTerms || "Add. charges"} value={sale.billTermsAmount} colored="text-gray-700" />
          )}
          {hasTax && (
            <TotalRow label={`VAT (${sale.vatRate}%)`} value={sale.vatAmount} colored="text-gray-700" />
          )}
          <div className="flex items-center justify-between border-t-2 border-gray-800 pt-2">
            <span className="text-sm font-bold uppercase tracking-wide text-gray-900">Grand total</span>
            <span className="text-base font-bold tabular-nums text-gray-900">NPR {nprNum(sale.grandTotal)}</span>
          </div>
        </div>

        {/* ── 6. Amount in words ── */}
        <div className="rounded-lg border border-gray-200 bg-gray-50/80 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Amount in words</p>
          <p className="mt-1 text-sm font-medium leading-snug text-gray-800">{amountInWords(sale.grandTotal)}</p>
        </div>

        {/* ── 7. Payment summary ── */}
        <div className="grid grid-cols-1 gap-3 border-t border-dashed border-gray-300 pt-4 text-sm sm:grid-cols-2">
          {sale.paidNow > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white px-3 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Paid at billing</p>
              <p className="text-base font-bold tabular-nums text-gray-900">NPR {nprNum(sale.paidNow)}</p>
              <p className="text-[11px] text-gray-600">{sale.paymentMode}</p>
            </div>
          )}
          {sale.balance > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white px-3 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Balance due</p>
              <p className="text-base font-bold tabular-nums text-gray-900">NPR {nprNum(sale.balance)}</p>
              {sale.dueDate ? (
                <p className="text-[11px] text-gray-600">Due {fmtDate(sale.dueDate)}</p>
              ) : null}
            </div>
          )}
          {sale.balance === 0 && !isPreview && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 px-3 py-2.5 text-center sm:col-span-2">
              <p className="text-sm font-semibold text-emerald-800">Fully paid</p>
            </div>
          )}
        </div>

        {/* ── 8. Footer + signatures ── */}
        <div className="border-t border-gray-200 pt-4">
          {business.billFooter && (
            <p className="mb-4 text-center text-[11px] text-gray-500 italic">{business.billFooter}</p>
          )}
          <div className="mt-3 grid grid-cols-2 gap-8">
            <div className="text-center">
              <div className="mb-2 min-h-[2.5rem] border-b border-gray-400" />
              <p className="text-[11px] font-medium text-gray-600">Authorised signature</p>
              <p className="text-[10px] text-gray-500">{business.name}</p>
            </div>
            <div className="text-center">
              <div className="mb-2 min-h-[2.5rem] border-b border-gray-400" />
              <p className="text-[11px] font-medium text-gray-600">Received by</p>
              <p className="text-[10px] text-gray-500">{sale.customerName || "Customer"}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// ── Small helpers ─────────────────────────────────────────────────────────────
const TotalRow = ({
  label, value, colored,
}: { label: React.ReactNode; value: number; colored?: string }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-gray-500">{label}</span>
    <span className={colored ?? "text-gray-800"}>
      {value < 0 ? `− NPR ${nprNum(Math.abs(value))}` : `NPR ${nprNum(value)}`}
    </span>
  </div>
);
