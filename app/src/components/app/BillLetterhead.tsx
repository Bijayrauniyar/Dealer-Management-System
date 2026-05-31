/**
 * Sales / purchase bill letterhead — IRD-aligned layout.
 * See docs/IRD_BILL_LETTERHEAD.md
 */
import type { SellerLetterhead } from "@/lib/sellerLetterhead";

function TaxIdLine({ label, number }: { label: "PAN" | "VAT"; number: string }) {
  return (
    <p className="whitespace-nowrap text-[10px] text-gray-700">
      <span className="text-gray-500">{label}</span>{" "}
      <span className="font-semibold tabular-nums text-gray-900">{number}</span>
    </p>
  );
}

function PhLine({ number }: { number: string }) {
  return (
    <p className="whitespace-nowrap tabular-nums text-gray-800">
      <span className="text-gray-500">Ph</span> {number}
    </p>
  );
}

type Props = {
  head: SellerLetterhead;
  /** Centered document title, e.g. TAX INVOICE or Purchase invoice */
  documentTitle: string;
};

export function BillLetterhead({ head, documentTitle }: Props) {
  return (
    <div className="border-b border-gray-200 pb-1.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold leading-tight text-gray-900" title={head.name}>
            {head.name}
          </p>
          {head.addressLines.map((line) => (
            <p key={line} className="mt-0.5 text-[9px] leading-snug text-gray-600">
              {line}
            </p>
          ))}
        </div>
        {head.tax || head.phone ? (
          <div className="shrink-0 pt-0.5 text-right text-[9px] leading-snug">
            {head.tax ? <TaxIdLine label={head.tax.label} number={head.tax.number} /> : null}
            {head.phone ? (
              <div className="mt-0.5">
                <PhLine number={head.phone} />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      <p className="mt-1.5 text-center text-[9px] font-bold uppercase tracking-wide text-gray-800">
        {documentTitle}
      </p>
    </div>
  );
}
