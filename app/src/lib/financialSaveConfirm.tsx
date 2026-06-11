import type { ReactNode } from "react";
import { fmtDate, npr, toDateInput } from "@/lib/utils";

export type FinancialSaveConfirmConfig = {
  title: string;
  content: ReactNode;
  confirmLabel: string;
};

function ConfirmBody({
  intro,
  facts,
  effects,
  footer,
}: {
  intro: string;
  facts?: { label: string; value: string }[];
  effects: string[];
  footer?: string;
}) {
  return (
    <div className="space-y-3 text-sm leading-relaxed text-muted">
      <p className="text-foreground/90">{intro}</p>
      {facts && facts.length > 0 ? (
        <dl className="rounded-lg border border-border-subtle bg-surface-muted/40 px-3 py-2 text-xs">
          {facts.map((row) => (
            <div key={row.label} className="flex justify-between gap-3 py-0.5">
              <dt className="text-muted">{row.label}</dt>
              <dd className="font-semibold tabular-nums text-foreground">{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {effects.length > 0 ? (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
            On confirmation
          </p>
          <ul className="list-disc space-y-1 pl-4 text-foreground/85">
            {effects.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {footer ? <p className="text-xs text-muted/90">{footer}</p> : null}
    </div>
  );
}

/** Due date on or before calendar today → purchase RPC marks invoice paid in full. */
export function isPurchaseDueDateSettled(dueDate: string): boolean {
  const d = dueDate.trim().slice(0, 10);
  if (!d) return false;
  return d <= toDateInput();
}

export function purchasePaidAdjustmentConfirm(
  newTotalIncl: number,
  recordedPaid: number,
): FinancialSaveConfirmConfig {
  const diff = Math.max(0, recordedPaid - newTotalIncl);
  return {
    title: "Adjust recorded payment amount?",
    confirmLabel: "Update purchase",
    content: (
      <ConfirmBody
        intro="The revised invoice total is lower than the amount currently recorded as paid on this supplier invoice."
        facts={[
          { label: "Recorded paid", value: npr(recordedPaid) },
          { label: "Revised total (incl. VAT)", value: npr(newTotalIncl) },
          ...(diff > 0.01 ? [{ label: "Adjustment", value: `− ${npr(diff)}` }] : []),
        ]}
        effects={[
          "The paid amount on this purchase will be reduced to match the revised invoice total.",
          "Payment status (Paid / Partial / Unpaid) and supplier payable will be recalculated.",
          "Stock on hand will be updated from the revised quantities and purchase rates.",
        ]}
        footer="Review line items and totals before confirming. The adjustment is posted to your purchase ledger."
      />
    ),
  };
}

export function purchaseDueDateSettledConfirm(
  totalIncl: number,
  dueDate: string,
): FinancialSaveConfirmConfig {
  return {
    title: "Post as fully paid?",
    confirmLabel: "Save purchase",
    content: (
      <ConfirmBody
        intro={`The due date (${fmtDate(dueDate)}) is on or before today. This purchase will be saved with the full invoice amount marked as settled.`}
        facts={[{ label: "Invoice total (incl. VAT)", value: npr(totalIncl) }]}
        effects={[
          "Payment status will be set to Paid.",
          "The invoice will not appear in supplier payable or payment-due lists.",
          "Stock will be increased per the received quantities on this invoice.",
        ]}
        footer="For credit purchases, clear the due date or enter a future due date before saving."
      />
    ),
  };
}

export function advanceReceiptConfirm(amount: number): FinancialSaveConfirmConfig {
  return {
    title: "Record advance receipt?",
    confirmLabel: "Save advance",
    content: (
      <ConfirmBody
        intro="This amount will be recorded as customer advance (on account), not against a sales invoice."
        facts={[{ label: "Advance amount", value: npr(amount) }]}
        effects={[
          "Customer advance balance will increase by this amount.",
          "The amount will be applied automatically to the customer's next sales invoice (up to the invoice total).",
          "This receipt will appear under Payments on the customer account.",
        ]}
        footer="Use this only when the customer paid before billing. For normal collection, raise the sales invoice first, then use Payment in against that bill."
      />
    ),
  };
}

export function salesCollectedAdjustmentConfirm(
  newGrandTotal: number,
  recordedCollected: number,
  billNo: string,
): FinancialSaveConfirmConfig {
  const diff = Math.max(0, recordedCollected - newGrandTotal);
  return {
    title: "Adjust recorded collection amount?",
    confirmLabel: "Update invoice",
    content: (
      <ConfirmBody
        intro={`The revised invoice total for bill ${billNo} is lower than the amount already recorded as collected on this invoice.`}
        facts={[
          { label: "Recorded collected", value: npr(recordedCollected) },
          { label: "Revised invoice total", value: npr(newGrandTotal) },
          ...(diff > 0.01 ? [{ label: "Adjustment", value: `− ${npr(diff)}` }] : []),
        ]}
        effects={[
          "The collected amount on this sales invoice will be reduced to match the revised total.",
          "Customer balance and receivable figures will be recalculated accordingly.",
          "Stock allocations will be updated from the revised line quantities.",
        ]}
        footer="Review line items and totals before confirming. Payment entries already allocated to this bill are not reversed automatically."
      />
    ),
  };
}
