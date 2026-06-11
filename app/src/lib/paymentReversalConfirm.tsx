import type { FinancialSaveConfirmConfig } from "@/lib/financialSaveConfirm";
import { npr, fmtDate } from "@/lib/utils";

export function paymentReversalConfirm(opts: {
  amount: number;
  date: string;
  mode: string;
  billNo?: string;
}): FinancialSaveConfirmConfig {
  const applied = Boolean(opts.billNo?.trim());
  return {
    title: "Reverse this receipt?",
    confirmLabel: "Reverse payment",
    content: (
      <div className="space-y-3 text-sm leading-relaxed text-muted">
        <p className="text-foreground/90">
          This will post a reversal for the receipt of {npr(opts.amount)} ({opts.mode},{" "}
          {fmtDate(opts.date)}). The original entry remains in the ledger for audit.
        </p>
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
            On confirmation
          </p>
          <ul className="list-disc space-y-1 pl-4 text-foreground/85">
            {applied ? (
              <li>
                The linked bill ({opts.billNo}) paid amount will be reduced by {npr(opts.amount)}.
              </li>
            ) : (
              <li>Customer advance balance will be reduced by {npr(opts.amount)}.</li>
            )}
            <li>Customer receivable and collection reports will be updated.</li>
          </ul>
        </div>
        <p className="text-xs text-muted/90">
          Enter a clear reason on the next step. To record the correct receipt, post a new payment
          after reversal.
        </p>
      </div>
    ),
  };
}
