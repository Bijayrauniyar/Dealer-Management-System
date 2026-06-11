import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Payment } from "@/domain/types";
import { paymentReversalConfirm } from "@/lib/paymentReversalConfirm";

type Props = {
  payment: Payment | null;
  loading?: boolean;
  onConfirm: (paymentId: string, reason: string) => void;
  onCancel: () => void;
};

export function PaymentReverseDialog({ payment, loading, onConfirm, onCancel }: Props) {
  const [reason, setReason] = useState("");
  if (!payment) return null;

  const cfg = paymentReversalConfirm({
    amount: payment.amount,
    date: payment.date,
    mode: payment.mode,
    billNo: payment.billNo,
  });

  const canConfirm = reason.trim().length >= 3;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 print:hidden">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close" onClick={onCancel} />
      <div
        role="alertdialog"
        aria-modal="true"
        className="relative max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-2xl border border-border-subtle bg-white p-5 shadow-xl"
      >
        <h2 className="text-base font-semibold text-foreground">{cfg.title}</h2>
        <div className="mt-2">{cfg.content}</div>
        <FormFieldReverse reason={reason} onChange={setReason} />
        <div className="mt-5 flex gap-2">
          <Button type="button" variant="secondary" size="md" className="flex-1" disabled={loading} onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            size="md"
            className="flex-1"
            loading={loading}
            disabled={!canConfirm}
            onClick={() => onConfirm(payment.id, reason.trim())}
          >
            {cfg.confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

function FormFieldReverse({ reason, onChange }: { reason: string; onChange: (v: string) => void }) {
  return (
    <div className="mt-4">
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
        Reason for reversal *
      </label>
      <Input
        placeholder="e.g. Duplicate entry, wrong customer"
        value={reason}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
