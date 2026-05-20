/**
 * BillPrintView — Sales invoice (screen, print, PDF).
 * Compact letterhead + "Billed to" customer block + line table + totals.
 */
import React from "react";
import type { Sale, Customer, BusinessSettings } from "@/domain/types";
import { useBusinessSettings } from "@/store/domain";
import { billDocumentTitle, sellerTaxId } from "@/lib/billDisplay";
import { nprNum, fmtDate, toMiti, amountInWords } from "@/lib/utils";
import { lineAmountFromMrp } from "@/lib/saleLineMath";

type Props = {
  sale: Sale;
  customer?: Customer;
  isPreview?: boolean;
};

const joinParts = (...parts: (string | undefined | null)[]) =>
  parts
    .map((s) => (s ?? "").trim())
    .filter(Boolean)
    .join(", ");

function sellerAddressLines(b: BusinessSettings): string[] {
  const row1 = joinParts(b.addressLine1, b.addressLine2);
  const row2 = joinParts(b.district, b.province, b.country);
  return [row1, row2].filter(Boolean);
}

/** One name on bill: legal/registered if set, else trading name. */
function sellerBillName(b: BusinessSettings): string {
  const legal = b.legalName.trim();
  const trading = b.name.trim();
  return legal || trading || "—";
}

const rs = (n: number) => `Rs. ${nprNum(n)}`;

const lineAmt = (l: { qty: number; mrp?: number; rate: number; discountPct?: number }) =>
  lineAmountFromMrp({
    qty: l.qty,
    mrp: l.mrp ?? l.rate,
    rate: l.rate,
    discountPct: l.discountPct,
  });

const MIN_TABLE_ROWS = 2;

/** Standard Nepali bill phone label (same on screen, preview, print, PDF). */
function PhLine({ number }: { number: string }) {
  const n = number.trim();
  if (!n) return null;
  return (
    <span className="text-gray-600">
      <span className="text-gray-500">Ph</span>{" "}
      <span className="tabular-nums text-gray-800">{n}</span>
    </span>
  );
}

function TaxIdLine({ label, number }: { label: "PAN" | "VAT"; number: string }) {
  return (
    <span className="whitespace-nowrap text-[10px] text-gray-700">
      <span className="text-gray-500">{label}</span>{" "}
      <span className="font-semibold tabular-nums text-gray-900">{number}</span>
    </span>
  );
}

export const BillPrintView = ({ sale, customer, isPreview }: Props) => {
  const business = useBusinessSettings();
  const lines = Array.isArray(sale.lines) ? sale.lines : [];
  const hasTax = sale.vatRate > 0;
  const hasTerms = sale.billTermsAmount > 0;
  const hasDisc = sale.discountAmount > 0;
  const hasLineDisc = lines.some((l) => (l.discountPct ?? 0) > 0);

  const customerName = sale.customerName || customer?.name || "—";
  const payMode =
    sale.paymentMode?.trim() ||
    (sale.balance <= 0 && sale.paidNow >= sale.grandTotal ? "Cash" : sale.paidNow > 0 ? "Partial" : "Credit");

  const sellerTax = sellerTaxId(business);
  const buyerPan = customer?.panNumber?.trim() ?? "";

  const sellerAddress = sellerAddressLines(business).join(" · ");
  const sellerPhone = (business.mobile || business.phone).trim();
  const sellerContact = joinParts(sellerAddress || null, sellerPhone ? `Ph ${sellerPhone}` : null);

  const customerAddress = customer?.address?.trim() ?? "";
  const customerPhone = customer?.phone?.trim() ?? "";
  const customerArea = customer?.area?.trim() ?? "";
  const showArea =
    customerArea && customerArea.toLowerCase() !== customerAddress.toLowerCase();
  const buyerParts = [
    customerName,
    joinParts(customerAddress || null, showArea ? customerArea : null) || null,
    customerPhone ? `Ph ${customerPhone}` : null,
    buyerPan ? `PAN ${buyerPan}` : null,
  ].filter(Boolean);

  const statusBadge =
    !isPreview && (
      <span
        className={`ml-1 inline-block rounded px-1.5 py-px text-[8px] font-semibold uppercase ${
          sale.balance === 0
            ? "bg-emerald-50 text-emerald-800"
            : "bg-amber-50 text-amber-900"
        }`}
      >
        {sale.balance === 0 ? "Paid" : "Due"}
      </span>
    );

  return (
    <div
      id="bill-print-root"
      className="bill-print-a4 mx-auto w-full max-w-full overflow-hidden rounded-lg border border-gray-200 bg-white text-[10px] leading-tight text-gray-900 shadow-sm print:max-w-none print:rounded-none print:border-0 print:shadow-none"
      style={{ maxWidth: "210mm" }}
    >
      <div className="px-3 py-2 print:px-6 print:py-3">

        {/* ── Seller letterhead (compact) ── */}
        <div className="border-b border-gray-200 pb-1">
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0 flex-1 text-xs font-bold leading-tight text-gray-900" title={sellerBillName(business)}>
              {sellerBillName(business)}
            </p>
            {sellerTax ? <TaxIdLine label={sellerTax.label} number={sellerTax.number} /> : null}
          </div>
          {sellerContact ? (
            <p className="mt-0.5 text-[9px] leading-snug text-gray-600">{sellerContact}</p>
          ) : null}
          <p className="mt-0.5 text-center text-[9px] font-bold uppercase tracking-wide text-gray-800">
            {billDocumentTitle()}
          </p>
        </div>

        {/* ── Bill meta + customer (2 lines) ── */}
        <div className="mt-1 border-b border-dashed border-gray-300 py-1 text-[9px] leading-snug text-gray-800">
          <p className="flex flex-wrap items-center gap-x-1 gap-y-0.5">
            <span>
              <span className="text-gray-500">Bill</span>{" "}
              <span className="font-bold text-gray-900">{sale.billNo}</span>
            </span>
            <span className="text-gray-300">·</span>
            <span>{fmtDate(sale.date)}</span>
            <span className="text-gray-500">({toMiti(sale.date)})</span>
            <span className="text-gray-300">·</span>
            <span>{payMode}</span>
            {statusBadge}
            {sale.dueDate && sale.balance > 0 && !isPreview ? (
              <>
                <span className="text-gray-300">·</span>
                <span className="text-amber-800">Due {fmtDate(sale.dueDate)}</span>
              </>
            ) : null}
          </p>
          <p className="mt-0.5">
            <span className="font-bold uppercase text-gray-500">To</span>{" "}
            <span className="font-semibold text-gray-900">{buyerParts.join(" · ")}</span>
          </p>
        </div>

        {/* ── Line items ── */}
        <div className="mt-1 overflow-x-auto">
          <table className="w-full border-collapse text-[10px]">
            <thead>
              <tr className="bg-teal-600 text-[9px] font-bold uppercase text-white">
                <th className="w-6 border border-teal-700 px-0.5 py-0.5 text-center">S.N.</th>
                <th className="border border-teal-700 px-1 py-0.5 text-left">Particulars</th>
                <th className="w-11 border border-teal-700 px-0.5 py-0.5 text-right">MRP</th>
                <th className="w-8 border border-teal-700 px-0.5 py-0.5 text-right">Qty</th>
                <th className="w-8 border border-teal-700 px-0.5 py-0.5 text-center">Unit</th>
                {hasLineDisc && (
                  <th className="w-8 border border-teal-700 px-0.5 py-0.5 text-right">Disc%</th>
                )}
                <th className="w-12 border border-teal-700 px-0.5 py-0.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, i) => (
                <tr key={i} className="even:bg-gray-50/60">
                  <td className="border border-gray-200 px-0.5 py-0.5 text-center text-gray-500">
                    {i + 1}
                  </td>
                  <td className="border border-gray-200 px-1 py-0.5 font-medium text-gray-900">
                    {line.productName}
                  </td>
                  <td className="whitespace-nowrap border border-gray-200 px-0.5 py-0.5 text-right tabular-nums text-gray-700">
                    {line.mrp ? nprNum(line.mrp) : "—"}
                  </td>
                  <td className="whitespace-nowrap border border-gray-200 px-0.5 py-0.5 text-right tabular-nums">
                    {nprNum(line.qty)}
                  </td>
                  <td className="border border-gray-200 px-0.5 py-0.5 text-center text-gray-600">
                    {line.uom || "PCS"}
                  </td>
                  {hasLineDisc && (
                    <td className="whitespace-nowrap border border-gray-200 px-0.5 py-0.5 text-right text-amber-700">
                      {(line.discountPct ?? 0) > 0 ? `${line.discountPct}%` : "—"}
                    </td>
                  )}
                  <td className="whitespace-nowrap border border-gray-200 px-0.5 py-0.5 text-right font-semibold tabular-nums">
                    {nprNum(lineAmt(line))}
                  </td>
                </tr>
              ))}
              {lines.length < MIN_TABLE_ROWS &&
                Array.from({ length: MIN_TABLE_ROWS - lines.length }).map((_, i) => (
                  <tr key={`empty-${i}`}>
                    <td className="border border-gray-200 px-1 py-1 text-center text-gray-300">
                      {lines.length + i + 1}
                    </td>
                    <td className="border border-gray-200 px-1 py-0.5" colSpan={hasLineDisc ? 6 : 5} />
                  </tr>
                ))}
            </tbody>
          </table>
          <p className="mt-0.5 text-right text-[8px] text-gray-400">NPR</p>
        </div>

        {/* ── Totals + amount in words ── */}
        <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2 md:items-start">
          <div className="rounded border border-gray-200 bg-gray-50 px-2 py-1.5">
            <p className="text-[8px] font-bold uppercase tracking-wider text-gray-400">Amount in words</p>
            <p className="mt-0.5 text-[10px] font-medium leading-snug text-gray-800">
              {amountInWords(sale.grandTotal)}
            </p>
            {business.billFooter ? (
              <p className="mt-2 text-[10px] italic text-gray-500">{business.billFooter}</p>
            ) : null}
          </div>
          <div className="space-y-1 md:ml-auto md:w-full md:max-w-xs">
            <TotalRow label="Subtotal" value={sale.subtotal} />
            {hasDisc && (
              <TotalRow
                label={
                  sale.discountType === "percent"
                    ? `Discount (${sale.discountValue}%)`
                    : "Discount"
                }
                value={-sale.discountAmount}
                negative
              />
            )}
            {hasTerms && (
              <TotalRow label={sale.billTerms || "Add. charges"} value={sale.billTermsAmount} />
            )}
            {hasTax && <TotalRow label={`VAT (${sale.vatRate}%)`} value={sale.vatAmount} />}
            <div className="flex items-center justify-between border-t border-double border-gray-300 pt-2 font-bold text-gray-900">
              <span>Grand total</span>
              <span className="whitespace-nowrap tabular-nums">{rs(sale.grandTotal)}</span>
            </div>
            {sale.paidNow > 0 && (
              <div className="flex items-center justify-between text-emerald-800">
                <span className="font-medium">Paid at billing</span>
                <span className="whitespace-nowrap tabular-nums font-semibold">{rs(sale.paidNow)}</span>
              </div>
            )}
            {sale.balance > 0 && (
              <div className="flex items-center justify-between font-semibold text-amber-900">
                <span>Balance due</span>
                <span className="whitespace-nowrap tabular-nums">{rs(sale.balance)}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Signatures ── */}
        <div className="mt-2 grid grid-cols-2 gap-3 border-t border-dashed border-gray-300 pt-2">
          <div className="text-center">
            <div className="mb-0.5 min-h-[1.25rem] border-b border-gray-400" />
            <p className="text-[9px] font-medium text-gray-600">Authorised signature</p>
          </div>
          <div className="text-center">
            <div className="mb-0.5 min-h-[1.25rem] border-b border-gray-400" />
            <p className="text-[9px] font-medium text-gray-600">Received by</p>
          </div>
        </div>
      </div>
    </div>
  );
};

function TotalRow({
  label,
  value,
  negative,
}: {
  label: React.ReactNode;
  value: number;
  negative?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-gray-700">
      <span className="min-w-0">{label}</span>
      <span className={`shrink-0 whitespace-nowrap tabular-nums ${negative ? "text-red-600" : ""}`}>
        {negative ? `− ${rs(Math.abs(value))}` : rs(value)}
      </span>
    </div>
  );
}
