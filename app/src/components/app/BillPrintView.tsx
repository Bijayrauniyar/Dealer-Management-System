/**
 * BillPrintView — Sales invoice (screen, print, PDF).
 * Compact letterhead + "Billed to" customer block + line table + totals.
 */
import React, { useEffect, useState } from "react";
import type { Sale, Customer } from "@/domain/types";
import { useBusinessSettings } from "@/store/domain";
import { BillLetterhead } from "@/components/app/BillLetterhead";
import {
  billDocumentTitleDisplay,
  billBalanceDueLabel,
  billPaymentModeDisplay,
  billPaymentStatusLabel,
  billFooterDiscountLabel,
  billShowsFooterDiscount,
  billShowsLineDiscColumn,
  billSubtotalForDisplay,
  sellerLetterheadFromBusiness,
} from "@/lib/billDisplay";
import { nprNum, fmtDate, toMiti, amountInWords } from "@/lib/utils";
import {
  billLineDiscDisplay,
  billLineParticulars,
  isFocSaleLine,
} from "@/lib/billFoc";
import {
  billLineUnitPriceDisplay,
  salesBillUnitPriceHeaderPrint,
  showsSalesBillPaymentQr,
} from "@/lib/billPriceDisplay";
import { createSalesBillQrSignedUrl } from "@/lib/salesBillQrStorage";
import { roundMoney } from "@/lib/money";
import { billLineAmount, saleLineDisplayMrp } from "@/lib/saleLineMath";

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

const rs = (n: number) => `Rs. ${nprNum(n)}`;

/** Implied line discount when amount < qty × MRP (e.g. sell rate below MRP). */
function lineDiscPct(line: { qty: number; mrp?: number; rate: number; discountPct?: number }): number {
  if ((line.discountPct ?? 0) > 0) return line.discountPct ?? 0;
  const mrp = saleLineDisplayMrp(line);
  const qty = Number(line.qty) || 0;
  if (mrp <= 0 || qty <= 0) return 0;
  const gross = roundMoney(qty * mrp);
  const amt = billLineAmount(line);
  if (amt >= gross) return 0;
  return Math.round((1 - amt / gross) * 100);
}

/** Flex wrapper — vertical center in table/totals (screen, print, PDF capture). */
function BillCellInner({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "center" | "right";
}) {
  const justify =
    align === "center" ? "justify-center" : align === "right" ? "justify-end" : "justify-start";
  const text =
    align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";
  return (
    <div className={`bill-cell-inner flex min-h-[1.35rem] w-full items-center ${justify} ${text}`}>
      {children}
    </div>
  );
}

export const BillPrintView = ({ sale, customer, isPreview }: Props) => {
  const business = useBusinessSettings();
  const lines = Array.isArray(sale.lines) ? sale.lines : [];
  const hasTax = sale.vatRate > 0;
  const hasTerms = sale.billTermsAmount > 0;
  const hasFooterDisc = billShowsFooterDiscount(sale);
  const hasLineDisc = billShowsLineDiscColumn(lines, sale);
  const subtotalOnBill = billSubtotalForDisplay(sale);

  const customerName = sale.customerName || customer?.name || "—";
  const payMode = billPaymentModeDisplay(sale);
  const paymentStatus = billPaymentStatusLabel(sale);

  const buyerPan = customer?.panNumber?.trim() ?? "";
  const buyerVat = customer?.vatNumber?.trim() ?? "";

  const letterhead = sellerLetterheadFromBusiness(business);
  const unitPriceHeader = salesBillUnitPriceHeaderPrint(business);
  const priceColPct = "16%";
  const nameColPct = hasLineDisc ? "31%" : "35%";
  const showPaymentQr = showsSalesBillPaymentQr(business, sale.balance);
  const [qrImageSrc, setQrImageSrc] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!showPaymentQr) {
      setQrImageSrc("");
      return;
    }
    const objectPath = business.salesBillQrObjectPath?.trim();
    const legacyUrl = business.salesBillQrImageUrl?.trim() ?? "";
    if (objectPath) {
      void createSalesBillQrSignedUrl(objectPath)
        .then((url) => {
          if (!cancelled) setQrImageSrc(url);
        })
        .catch(() => {
          if (!cancelled) setQrImageSrc(legacyUrl);
        });
    } else {
      setQrImageSrc(legacyUrl);
    }
    return () => {
      cancelled = true;
    };
  }, [showPaymentQr, business.salesBillQrObjectPath, business.salesBillQrImageUrl]);

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
    buyerVat ? `VAT ${buyerVat}` : null,
  ].filter(Boolean);

  return (
    <div
      id="bill-print-root"
      className="bill-print-a4 mx-auto w-full min-w-0 max-w-[210mm] overflow-x-hidden rounded-lg border border-gray-200 bg-white text-[10px] leading-tight text-gray-900 shadow-sm print:overflow-visible print:rounded-none print:border-0 print:shadow-none"
      style={{ width: "100%", maxWidth: "min(100%, 210mm)" }}
    >
      <div className="px-3 py-2 print:px-6 print:pb-3 print:pt-5">

        <BillLetterhead
          head={letterhead}
          documentTitle={billDocumentTitleDisplay(business)}
        />

        {/* ── Bill meta + customer (2 lines) ── */}
        <div className="mt-1 border-b border-dashed border-gray-300 py-1.5 text-[9px] leading-snug text-gray-800">
          <p className="flex flex-wrap items-center gap-x-1 gap-y-0.5 pb-0.5">
            <span>
              <span className="text-gray-500">Bill</span>{" "}
              <span className="font-bold text-gray-900">{sale.billNo}</span>
            </span>
            <span className="text-gray-300">·</span>
            <span>{fmtDate(sale.date)}</span>
            <span className="text-gray-500">({toMiti(sale.date)})</span>
            <span className="text-gray-300">·</span>
            <span>{payMode}</span>
            {paymentStatus ? (
              <>
                <span className="text-gray-300">·</span>
                <span
                  className={
                    sale.balance <= 0
                      ? "font-medium text-emerald-800"
                      : sale.dueDate
                        ? "font-medium text-amber-800"
                        : "font-medium text-amber-900"
                  }
                >
                  {paymentStatus}
                </span>
              </>
            ) : null}
          </p>
          <p className="mt-2 pt-0.5">
            <span className="mr-1 font-bold uppercase text-gray-500">To:</span>
            <span className="font-semibold text-gray-900">{buyerParts.join(" · ")}</span>
          </p>
        </div>

        {/* ── Line items (fits phone width — no horizontal scroll) ── */}
        <div className="mt-1 w-full min-w-0">
          <table className="bill-lines-table w-full table-fixed border-collapse text-[8px] leading-normal sm:text-[10px]">
            <colgroup>
              <col className="bill-col-sn" style={{ width: hasLineDisc ? "7%" : "8%" }} />
              <col style={{ width: nameColPct }} />
              <col style={{ width: priceColPct }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "11%" }} />
              {hasLineDisc ? <col style={{ width: "9%" }} /> : null}
              <col style={{ width: hasLineDisc ? "16%" : "20%" }} />
            </colgroup>
            <thead>
              <tr className="bg-teal-600 font-bold uppercase text-white">
                <th className="bill-cell whitespace-nowrap border border-teal-700 p-0">
                  <BillCellInner align="center">S.N.</BillCellInner>
                </th>
                <th className="bill-cell border border-teal-700 p-0">
                  <BillCellInner align="center">Particulars</BillCellInner>
                </th>
                <th className="bill-cell border border-teal-700 p-0">
                  <BillCellInner align="center">
                    <span className="block whitespace-nowrap text-[7px] leading-tight sm:text-[8px]">
                      {unitPriceHeader}
                    </span>
                  </BillCellInner>
                </th>
                <th className="bill-cell whitespace-nowrap border border-teal-700 p-0">
                  <BillCellInner align="center">Unit</BillCellInner>
                </th>
                <th className="bill-cell whitespace-nowrap border border-teal-700 p-0">
                  <BillCellInner align="center">Qty</BillCellInner>
                </th>
                {hasLineDisc && (
                  <th className="bill-cell whitespace-nowrap border border-teal-700 p-0">
                    <BillCellInner align="center">Disc%</BillCellInner>
                  </th>
                )}
                <th className="bill-cell whitespace-nowrap border border-teal-700 p-0">
                  <BillCellInner align="center">Amt</BillCellInner>
                </th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, i) => {
                const foc = isFocSaleLine(line);
                const { title, subtitle } = billLineParticulars(line);
                const unitPriceCell = billLineUnitPriceDisplay(line, business.salesBillPriceMode);
                return (
                <tr key={i} className={foc ? "bg-pink-50/50 text-gray-700" : "even:bg-gray-50/60"}>
                  <td className="bill-cell border border-gray-300 p-0 text-gray-500">
                    <BillCellInner align="center">{i + 1}</BillCellInner>
                  </td>
                  <td className="bill-cell break-words border border-gray-300 p-0 font-medium text-gray-900">
                    <BillCellInner align="center">
                      <span className="block leading-tight">
                        <span className={foc ? "text-gray-800" : ""}>{title}</span>
                        {subtitle ? (
                          <span className="mt-0.5 block text-[7px] font-semibold uppercase tracking-wide text-pink-800 sm:text-[8px]">
                            {subtitle}
                          </span>
                        ) : null}
                      </span>
                    </BillCellInner>
                  </td>
                  <td className="bill-cell border border-gray-300 p-0 tabular-nums text-gray-700">
                    <BillCellInner align="center">{unitPriceCell}</BillCellInner>
                  </td>
                  <td className="bill-cell border border-gray-300 p-0 text-[7px] text-gray-600 sm:text-[8px]">
                    <BillCellInner align="center">{line.uom || "PCS"}</BillCellInner>
                  </td>
                  <td className="bill-cell border border-gray-300 p-0 tabular-nums">
                    <BillCellInner align="center">{nprNum(line.qty)}</BillCellInner>
                  </td>
                  {hasLineDisc && (
                    <td className="bill-cell border border-gray-300 p-0 text-amber-700">
                      <BillCellInner align="center">
                        {billLineDiscDisplay(line, lineDiscPct)}
                      </BillCellInner>
                    </td>
                  )}
                  <td className="bill-cell border border-gray-300 p-0 font-semibold tabular-nums">
                    <BillCellInner align="center">{nprNum(billLineAmount(line))}</BillCellInner>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Totals: stack on narrow screens so amounts are not clipped ── */}
        <div className="bill-print-summary mt-1.5 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 min-[480px]:items-end">
          <div className="min-w-0 rounded border border-gray-200 bg-gray-50 px-2 py-1.5">
            <p className="text-[8px] font-bold uppercase tracking-wider text-gray-400">Amount in words</p>
            <p className="mt-0.5 text-[10px] font-medium leading-snug text-gray-800">
              {amountInWords(sale.grandTotal)}
            </p>
            {business.billFooter ? (
              <p className="mt-2 text-[10px] italic text-gray-500">{business.billFooter}</p>
            ) : null}
          </div>
          <table className="bill-totals-table w-full min-w-0 table-fixed border-collapse text-[10px]">
            <colgroup>
              <col />
              <col className="w-[6.75rem]" />
            </colgroup>
            <tbody>
              <tr
                className={
                  !hasFooterDisc && !hasTerms && !hasTax ? "bill-totals-before-rule" : undefined
                }
              >
                <td className="bill-totals-cell p-0 pr-3 text-gray-700">
                  <BillCellInner align="left">Subtotal</BillCellInner>
                </td>
                <td className="bill-totals-cell bill-totals-amount p-0 tabular-nums text-gray-900">
                  <BillCellInner align="right">{rs(subtotalOnBill)}</BillCellInner>
                </td>
              </tr>
              {hasFooterDisc && (
                <tr className={!hasTerms && !hasTax ? "bill-totals-before-rule" : undefined}>
                  <td className="bill-totals-cell p-0 pr-3 text-gray-700">
                    <BillCellInner align="left">{billFooterDiscountLabel(sale)}</BillCellInner>
                  </td>
                  <td className="bill-totals-cell bill-totals-amount p-0 tabular-nums text-red-600">
                    <BillCellInner align="right">- {rs(sale.discountAmount)}</BillCellInner>
                  </td>
                </tr>
              )}
              {hasTerms && (
                <tr className={!hasTax ? "bill-totals-before-rule" : undefined}>
                  <td className="bill-totals-cell p-0 pr-3 text-gray-700">
                    <BillCellInner align="left">{sale.billTerms || "Add. charges"}</BillCellInner>
                  </td>
                  <td className="bill-totals-cell bill-totals-amount p-0 tabular-nums">
                    <BillCellInner align="right">{rs(sale.billTermsAmount)}</BillCellInner>
                  </td>
                </tr>
              )}
              {hasTax && (
                <tr className="bill-totals-before-rule">
                  <td className="bill-totals-cell pr-3 text-gray-700">
                    <BillCellInner align="left">VAT ({sale.vatRate}%)</BillCellInner>
                  </td>
                  <td className="bill-totals-cell bill-totals-amount tabular-nums">
                    <BillCellInner align="right">{rs(sale.vatAmount)}</BillCellInner>
                  </td>
                </tr>
              )}
              <tr className="bill-totals-rule" aria-hidden="true">
                <td colSpan={2} className="bill-totals-rule-cell">
                  <div className="bill-totals-rule-line" />
                </td>
              </tr>
              <tr className="bill-totals-grand">
                <td className="bill-totals-cell pr-3 font-bold text-gray-900">
                  <BillCellInner align="left">Grand total (NPR)</BillCellInner>
                </td>
                <td className="bill-totals-cell bill-totals-amount font-bold tabular-nums text-gray-900">
                  <BillCellInner align="right">{rs(sale.grandTotal)}</BillCellInner>
                </td>
              </tr>
              {sale.paidNow > 0 && (
                <tr>
                  <td className="bill-totals-cell p-0 pr-3 font-medium text-emerald-800">
                    <BillCellInner align="left">Paid at billing</BillCellInner>
                  </td>
                  <td className="bill-totals-cell bill-totals-amount p-0 font-semibold tabular-nums text-emerald-800">
                    <BillCellInner align="right">{rs(sale.paidNow)}</BillCellInner>
                  </td>
                </tr>
              )}
              {sale.balance > 0 && (
                <tr>
                  <td className="bill-totals-cell p-0 pr-3 font-semibold text-amber-900">
                    <BillCellInner align="left">{billBalanceDueLabel()}</BillCellInner>
                  </td>
                  <td className="bill-totals-cell bill-totals-amount p-0 font-semibold tabular-nums text-amber-900">
                    <BillCellInner align="right">{rs(sale.balance)}</BillCellInner>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {showPaymentQr ? (
          <div className="bill-payment-qr mt-2 flex flex-wrap items-start justify-between gap-3 rounded border border-gray-200 bg-gray-50 px-2 py-2">
            <div className="min-w-0 flex-1 text-[9px] leading-snug text-gray-700">
              <p className="font-bold uppercase tracking-wide text-gray-500">Pay by QR</p>
              {business.salesBillQrBankText ? (
                <p className="mt-1 font-medium text-gray-800">{business.salesBillQrBankText}</p>
              ) : null}
              <p className="mt-1 text-gray-600">
                Ref: <span className="font-semibold text-gray-900">{sale.billNo}</span>
                {sale.balance > 0 ? (
                  <>
                    {" "}
                    · Due <span className="font-semibold tabular-nums">{rs(sale.balance)}</span>
                  </>
                ) : null}
              </p>
            </div>
            {qrImageSrc ? (
              <img
                src={qrImageSrc}
                alt="Payment QR"
                className="h-20 w-20 shrink-0 object-contain sm:h-24 sm:w-24"
                crossOrigin="anonymous"
              />
            ) : null}
          </div>
        ) : null}

        {/* ── Signatures ── */}
        <div className="bill-signatures mt-2 grid grid-cols-2 gap-3 border-t border-dashed border-gray-300 pt-2 sm:mt-1.5 sm:pt-1.5">
          <div className="text-center">
            <div className="mb-0.5 min-h-[1rem] border-b border-gray-400" />
            <p className="text-[9px] font-medium text-gray-600">Authorised signature</p>
          </div>
          <div className="text-center">
            <div className="mb-0.5 min-h-[1rem] border-b border-gray-400" />
            <p className="text-[9px] font-medium text-gray-600">Received by</p>
          </div>
        </div>
      </div>
    </div>
  );
};
