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
import type { Sale, Customer } from "@/data/dummy";
import { useBusinessSettings } from "@/store/domain";
import { npr, nprNum, fmtDate, toMiti, amountInWords } from "@/lib/utils";

type Props = {
  sale: Sale;
  customer?: Customer;
  /** Hide payment-history section (used during preview before first payment) */
  isPreview?: boolean;
};

const lineAmt = (l: { qty: number; rate: number; discountPct?: number }) =>
  Math.round(l.qty * l.rate * (1 - (l.discountPct ?? 0) / 100));

export const BillPrintView = ({ sale, customer, isPreview }: Props) => {
  const business  = useBusinessSettings();
  const hasTax      = sale.vatRate > 0;
  const hasTerms    = sale.billTermsAmount > 0;
  const hasDisc     = sale.discountAmount > 0;
  const hasLineDisc = sale.lines.some((l) => (l.discountPct ?? 0) > 0);

  return (
    <div className="mx-auto max-w-xl bg-white text-gray-800 shadow-md print:shadow-none">

      {/* ── 1. Seller letterhead ── */}
      <div className="bg-teal-700 px-6 py-5 text-white">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-widest text-teal-200">
              {hasTax ? "Tax Invoice" : "Sales Bill"}
            </p>
            <h1 className="mt-0.5 text-xl font-extrabold leading-tight">{business.name}</h1>
            <p className="text-sm font-medium text-teal-100">{business.legalName}</p>
          </div>
          <div className="text-right text-[11px] text-teal-200 shrink-0">
            <p>{business.addressLine1}, {business.addressLine2}</p>
            <p>{business.district}, {business.province}</p>
            <p>Ph: {business.mobile}</p>
            <p className="mt-1 font-semibold text-white">PAN: {business.panNumber}</p>
            {business.vatRegistered && (
              <p className="font-semibold text-white">VAT: {business.vatNumber || business.panNumber}</p>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 py-5 space-y-5">

        {/* ── 2. Bill header ── */}
        <div className="grid grid-cols-2 gap-4 border-b border-dashed border-gray-300 pb-4">
          <div className="space-y-1">
            <Row label="Bill No." value={sale.billNo} bold />
            <Row label="Date (AD)" value={fmtDate(sale.date)} />
            <Row label="Miti (BS)" value={toMiti(sale.date)} />
          </div>
          <div className="space-y-1 text-right">
            {customer?.address && <Row label="Delivery to" value={customer.address} right />}
            {!isPreview && (
              <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                sale.balance === 0
                  ? "bg-green-100 text-green-700"
                  : "bg-amber-100 text-amber-700"
              }`}>
                {sale.balance === 0 ? "Paid" : "Balance due"}
              </span>
            )}
          </div>
        </div>

        {/* ── 3. Buyer details ── */}
        <div className="grid grid-cols-2 gap-2 text-sm border-b border-dashed border-gray-300 pb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Billed to</p>
            <p className="font-bold text-gray-900">{sale.customerName || customer?.name || "—"}</p>
            {customer?.address && <p className="text-gray-500 text-[11px]">{customer.address}</p>}
            {customer?.phone && <p className="text-gray-500 text-[11px]">Ph: {customer.phone}</p>}
          </div>
          {customer?.panNumber && (
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Buyer PAN / VAT</p>
              <p className="font-mono font-semibold text-gray-800">{customer.panNumber}</p>
            </div>
          )}
        </div>

        {/* ── 4. Line-item table ── */}
        <div>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-500">
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
              {sale.lines.map((line, i) => (
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
              {sale.lines.length < 4 && Array.from({ length: 4 - sale.lines.length }).map((_, i) => (
                <tr key={`empty-${i}`}>
                  <td className="border border-gray-200 px-2 py-2 text-gray-300 text-center">{sale.lines.length + i + 1}</td>
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
          <div className="flex items-center justify-between border-t border-double border-gray-400 pt-2">
            <span className="text-sm font-extrabold uppercase tracking-wide text-gray-800">Grand Total</span>
            <span className="text-base font-extrabold text-teal-700">NPR {nprNum(sale.grandTotal)}</span>
          </div>
        </div>

        {/* ── 6. Amount in words ── */}
        <div className="rounded border border-gray-200 bg-gray-50 px-4 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Amount in words</p>
          <p className="mt-0.5 text-sm font-medium text-gray-700 leading-snug">
            {amountInWords(sale.grandTotal)}
          </p>
        </div>

        {/* ── 7. Payment summary ── */}
        <div className="grid grid-cols-2 gap-3 text-sm border-t border-dashed border-gray-300 pt-4">
          {sale.paidNow > 0 && (
            <div className="rounded border border-green-200 bg-green-50 px-3 py-2">
              <p className="text-[10px] font-bold uppercase text-green-600">Paid at billing</p>
              <p className="text-base font-extrabold text-green-700">NPR {nprNum(sale.paidNow)}</p>
              <p className="text-[11px] text-green-600">{sale.paymentMode}</p>
            </div>
          )}
          {sale.balance > 0 && (
            <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2">
              <p className="text-[10px] font-bold uppercase text-amber-600">Balance due</p>
              <p className="text-base font-extrabold text-amber-700">NPR {nprNum(sale.balance)}</p>
              {sale.dueDate && (
                <p className="text-[11px] text-amber-600">by {fmtDate(sale.dueDate)}</p>
              )}
            </div>
          )}
          {sale.balance === 0 && !isPreview && (
            <div className="col-span-2 rounded border border-green-200 bg-green-50 px-3 py-2 text-center">
              <p className="text-sm font-bold text-green-700">✓ Fully paid</p>
            </div>
          )}
        </div>

        {/* ── 8. Footer + signatures ── */}
        <div className="border-t border-gray-200 pt-4">
          {business.billFooter && (
            <p className="mb-4 text-center text-[11px] text-gray-500 italic">{business.billFooter}</p>
          )}
          <div className="mt-2 grid grid-cols-2 gap-6">
            <div className="text-center">
              <div className="mb-1 border-b border-gray-400" />
              <p className="text-[11px] text-gray-500 font-medium">Authorised Signature</p>
              <p className="text-[10px] text-gray-400">{business.name}</p>
            </div>
            <div className="text-center">
              <div className="mb-1 border-b border-gray-400" />
              <p className="text-[11px] text-gray-500 font-medium">Received by</p>
              <p className="text-[10px] text-gray-400">{sale.customerName || "Customer"}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// ── Small helpers ─────────────────────────────────────────────────────────────
const Row = ({
  label, value, bold, right,
}: { label: string; value: string; bold?: boolean; right?: boolean }) => (
  <div className={`flex gap-2 text-[12px] ${right ? "justify-end" : ""}`}>
    <span className="text-gray-400 shrink-0">{label}:</span>
    <span className={bold ? "font-bold text-gray-900" : "text-gray-700"}>{value}</span>
  </div>
);

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
