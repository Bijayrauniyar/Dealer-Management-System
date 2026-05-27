import type { BusinessSettings, PurchaseDetail, Supplier } from "@/domain/types";
import {
  sellerBillName,
  sellerContactLine,
  sellerTaxId,
} from "@/lib/billDisplay";
import { getVatPct } from "@/lib/tax";
import { purchaseDisplayTitle } from "@/lib/purchaseDisplay";
import { fmtDate, npr, toMiti } from "@/lib/utils";

type Props = {
  purchase: PurchaseDetail;
  supplier: Supplier;
  business: BusinessSettings;
};

function BillCell({
  children,
  align = "left",
  className = "",
}: {
  children: React.ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
}) {
  const justify =
    align === "right" ? "justify-end" : align === "center" ? "justify-center" : "justify-start";
  return (
    <div className={`bill-cell-inner flex min-h-[1.35rem] w-full items-center ${justify} ${className}`}>
      {children}
    </div>
  );
}

function supplierTaxId(s: Supplier): { label: "VAT" | "PAN"; number: string } | null {
  const vat = s.vatNumber.trim();
  const pan = s.panNumber.trim();
  if (vat) return { label: "VAT", number: vat };
  if (pan) return { label: "PAN", number: pan };
  return null;
}

export const PurchaseBillView = ({ purchase, supplier, business }: Props) => {
  const vatPct = getVatPct(business);
  const sellerTax = sellerTaxId(business);
  const sellerContact = sellerContactLine(business);
  const supTax = supplierTaxId(supplier);
  const balance = Math.max(0, purchase.total - purchase.paid);
  const title = purchaseDisplayTitle(purchase);

  const supplierAddr = [
    supplier.addressLine1,
    supplier.addressLine2,
    supplier.district,
    supplier.country,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div
      id="purchase-bill-print-root"
      className="bill-print-a4 mx-auto w-full min-w-0 max-w-[210mm] overflow-x-hidden rounded-lg border border-gray-200 bg-white text-[10px] leading-tight text-gray-900 shadow-sm print:overflow-visible print:rounded-none print:border-0 print:shadow-none"
    >
      <div className="px-3 py-2 print:px-6 print:pb-3 print:pt-5">
        <div className="border-b border-gray-200 pb-1.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold leading-tight text-gray-900">{sellerBillName(business)}</p>
              {sellerContact ? (
                <p className="mt-0.5 text-[9px] leading-snug text-gray-600">{sellerContact}</p>
              ) : null}
            </div>
            {sellerTax ? (
              <div className="shrink-0 text-right text-[9px]">
                <span className="text-gray-500">{sellerTax.label}</span>{" "}
                <span className="font-bold text-gray-900">{sellerTax.number}</span>
              </div>
            ) : null}
          </div>
          <p className="mt-1.5 text-center text-[9px] font-bold uppercase tracking-wide text-gray-800">
            Purchase invoice
          </p>
        </div>

        <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5 border-b border-dashed border-gray-300 py-1.5 text-[9px] leading-snug text-gray-800">
          <div className="min-w-0">
            <p className="font-bold text-gray-900">{supplier.name}</p>
            {supplierAddr ? <p className="text-gray-600">{supplierAddr}</p> : null}
            {supplier.phone ? <p className="text-gray-600">Ph {supplier.phone}</p> : null}
          </div>
          <div className="min-w-0 text-right">
            <p className="font-bold text-gray-900">{title}</p>
            <p className="text-gray-600">{fmtDate(purchase.date)}</p>
            <p className="text-gray-500">{toMiti(purchase.date)}</p>
            {supTax ? (
              <p className="mt-0.5 text-gray-800">
                <span className="text-gray-500">{supTax.label}</span>{" "}
                <span className="font-semibold">{supTax.number}</span>
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-1 overflow-x-auto">
          <table className="w-full min-w-[280px] border-collapse text-[9px]">
            <thead>
              <tr className="border-b border-gray-300 bg-gray-50 text-gray-600">
                <th className="px-1 py-1 text-left font-semibold">Item</th>
                <th className="px-1 py-1 text-right font-semibold">Qty</th>
                <th className="px-1 py-1 text-left font-semibold">UOM</th>
                <th className="px-1 py-1 text-right font-semibold">Rate excl</th>
                {vatPct > 0 ? (
                  <th className="px-1 py-1 text-right font-semibold">VAT</th>
                ) : null}
                <th className="px-1 py-1 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {purchase.lines.map((line) => (
                <tr key={`${line.productId}-${line.qty}`} className="border-b border-gray-100">
                  <td className="px-1 py-1 align-top">
                    <BillCell>{line.productName}</BillCell>
                  </td>
                  <td className="px-1 py-1">
                    <BillCell align="right">{line.qty}</BillCell>
                  </td>
                  <td className="px-1 py-1">
                    <BillCell>{line.uom}</BillCell>
                  </td>
                  <td className="px-1 py-1">
                    <BillCell align="right">{npr(line.rateExcl)}</BillCell>
                  </td>
                  {vatPct > 0 ? (
                    <td className="px-1 py-1">
                      <BillCell align="right">{npr(line.vatAmount)}</BillCell>
                    </td>
                  ) : null}
                  <td className="px-1 py-1">
                    <BillCell align="right" className="font-semibold">
                      {npr(line.amount)}
                    </BillCell>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-2 border-t border-gray-300 pt-2 text-[9px]">
          <div className="ml-auto w-full max-w-[12rem] space-y-0.5">
            <div className="flex justify-between gap-2">
              <span className="text-gray-600">Subtotal (excl. VAT)</span>
              <span className="font-semibold tabular-nums">{npr(purchase.subtotalExcl)}</span>
            </div>
            {vatPct > 0 && (
              <div className="flex justify-between gap-2">
                <span className="text-gray-600">VAT ({vatPct}%)</span>
                <span className="font-semibold tabular-nums">{npr(purchase.vatAmount)}</span>
              </div>
            )}
            <div className="flex justify-between gap-2 border-t border-gray-200 pt-1 text-[10px]">
              <span className="font-bold text-gray-900">
                {vatPct > 0 ? `Total (incl. ${vatPct}% VAT)` : "Total"}
              </span>
              <span className="font-bold tabular-nums">{npr(purchase.total)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-gray-600">Paid</span>
              <span className="font-semibold text-emerald-800 tabular-nums">{npr(purchase.paid)}</span>
            </div>
            {balance > 0 && (
              <div className="flex justify-between gap-2">
                <span className="text-gray-600">Balance due</span>
                <span className="font-bold text-red-700 tabular-nums">{npr(balance)}</span>
              </div>
            )}
          </div>
        </div>

        {purchase.notes ? (
          <p className="mt-2 text-[9px] italic text-gray-600">{purchase.notes}</p>
        ) : null}
      </div>
    </div>
  );
};
