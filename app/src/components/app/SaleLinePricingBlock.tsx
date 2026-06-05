import { FormField } from "@/components/app/FormField";
import { NumericInput } from "@/components/app/NumericInput";
import { numericMoneyProps } from "@/lib/money";
import { billLineRateColumnValue, saleLineChargeUnit } from "@/lib/saleLineMath";
import { addVatToExcl } from "@/lib/tax";
import { cn, nprNum } from "@/lib/utils";

type LineDraft = {
  productId: string;
  productName: string;
  uom: string;
  qty: number;
  mrp: number;
  rate: number;
  discountPct?: number;
};

type Props = {
  line: LineDraft;
  priceMode: "mrp" | "selling_price";
  lineAmount: number;
  tenantVat: boolean;
  vatPct: number;
  onMrpChange: (value: number) => void;
  onRateChange: (value: number) => void;
};

const activeFieldClass =
  "rounded-lg border border-teal-500/50 bg-teal-50/40 px-2 pt-1 pb-0.5";
const inactiveFieldClass = "px-2 pt-1 pb-0.5";

/** Sale line — MRP and sell price; Settings picks which becomes Rate on bill. */
export function SaleLinePricingBlock({
  line,
  priceMode,
  lineAmount,
  tenantVat,
  vatPct,
  onMrpChange,
  onRateChange,
}: Props) {
  const uom = line.uom || "unit";
  const mrpBilling = priceMode === "mrp";
  const chargeUnit = saleLineChargeUnit(line, priceMode);
  const printRate = billLineRateColumnValue(
    { ...line, amount: lineAmount },
    priceMode,
  );

  return (
    <div className="space-y-2 rounded-lg border border-border-subtle bg-slate-50/80 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-foreground">Pricing per {uom}</p>
        <span className="shrink-0 rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-semibold text-teal-800">
          Bill uses {mrpBilling ? "label MRP" : "sell price"} as Rate
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className={cn(mrpBilling ? activeFieldClass : inactiveFieldClass)}>
          <FormField
            label="Label MRP"
            hint={mrpBilling ? "→ Rate on bill" : "Reference only"}
          >
            <NumericInput
              {...numericMoneyProps}
              min={0}
              value={line.mrp}
              onChange={onMrpChange}
            />
          </FormField>
        </div>
        <div className={cn(!mrpBilling ? activeFieldClass : inactiveFieldClass)}>
          <FormField
            label="Sell price"
            hint={!mrpBilling ? "→ Rate on bill" : "Reference only"}
          >
            <NumericInput
              {...numericMoneyProps}
              min={0}
              value={line.rate}
              onChange={onRateChange}
            />
          </FormField>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-white px-2.5 py-2 text-[11px]">
        <span className="text-muted">
          Line total: <strong className="text-foreground">{nprNum(lineAmount)}</strong>
          <span className="text-muted"> ({nprNum(chargeUnit)} × {line.qty})</span>
        </span>
        <span className="font-medium text-teal-800">
          Prints: Rate · {nprNum(printRate)}
        </span>
      </div>

      {tenantVat && !mrpBilling && line.rate > 0 ? (
        <p className="text-[10px] text-muted">
          Sell price incl. {vatPct}% VAT: {nprNum(addVatToExcl(line.rate, vatPct))}
        </p>
      ) : null}
    </div>
  );
}
