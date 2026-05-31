/**
 * StickyBar – fixed bottom bar on transaction forms (above bottom tabs).
 * Uses a compact layout when there are multiple totals or extra actions.
 */
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronDown, ChevronUp, Eye, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  rows?: [label: string, value: string][];
  action: string;
  /** Icon on primary action (e.g. Save on invoice forms). */
  actionIcon?: LucideIcon;
  /** Screen-reader / tooltip when compact label differs from `action`. */
  actionAriaLabel?: string;
  /** Compact-bar button text; defaults to smart shorten of `action`. */
  actionCompactLabel?: string;
  onAction: () => void;
  secondaryAction?: string;
  onSecondaryAction?: () => void;
  previewLabel?: string;
  onPreview?: () => void;
  loading?: boolean;
  disabled?: boolean;
  /** Force compact bar (totals left, actions in one row). Auto when preview + secondary or many rows. */
  compact?: boolean;
};

function isPrimaryTotalLabel(label: string) {
  return /grand total|^total$|amount received|received/i.test(label.trim());
}

function compactActionLabel(action: string, override?: string) {
  if (override) return override;
  const stripped = action.replace(/^Save /, "").replace(/^Update /, "");
  if (!stripped.includes(" ") && stripped.length < 12) return action;
  return stripped;
}

export const StickyBar = ({
  rows,
  action,
  actionIcon: ActionIcon,
  actionAriaLabel,
  actionCompactLabel,
  onAction,
  secondaryAction,
  onSecondaryAction,
  previewLabel,
  onPreview,
  loading,
  disabled,
  compact,
}: Props) => {
  const useCompact =
    compact ??
    Boolean(
      (previewLabel && onPreview) ||
        (secondaryAction && onSecondaryAction) ||
        ((rows?.length ?? 0) > 2),
    );

  const [detailsOpen, setDetailsOpen] = useState(false);

  if (!useCompact) {
    return (
      <div className="fixed bottom-16 left-0 right-0 z-30 border-t border-border-subtle bg-white/95 backdrop-blur px-4 py-2.5 shadow-card-md">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
          {rows && rows.length > 0 && (
            <div className="min-w-0 space-y-0.5">
              {rows.map(([label, value]) => (
                <div key={label} className="flex items-baseline gap-2 text-sm">
                  <span className="shrink-0 text-muted">{label}</span>
                  <span className="truncate font-semibold text-foreground">{value}</span>
                </div>
              ))}
            </div>
          )}
          <Button
            size="md"
            className="shrink-0 gap-1.5"
            onClick={onAction}
            loading={loading}
            disabled={disabled}
            aria-label={actionAriaLabel ?? action}
          >
            {ActionIcon ? <ActionIcon size={16} className="shrink-0" /> : null}
            {action}
          </Button>
        </div>
      </div>
    );
  }

  const allRows = rows ?? [];
  const primaryIdx = allRows.findIndex(([label]) => isPrimaryTotalLabel(label));
  const primary = primaryIdx >= 0 ? allRows[primaryIdx] : allRows[allRows.length - 1];
  const rest =
    primaryIdx >= 0
      ? allRows.filter((_, i) => i !== primaryIdx)
      : allRows.length > 1
        ? allRows.slice(0, -1)
        : [];
  const dueRow = rest.find(([label]) => /balance due|^due$/i.test(label.trim()));
  const detailRows = dueRow ? rest.filter((r) => r !== dueRow) : rest;
  const hasDetails = detailRows.length > 0;

  const shortAction = compactActionLabel(action, actionCompactLabel);
  const shortSecondary = secondaryAction
    ?.replace(/^Save & /, "")
    .replace(/^Update & /, "");

  return (
    <div className="fixed bottom-16 left-0 right-0 z-30 border-t border-border-subtle bg-white/98 backdrop-blur shadow-card-md">
      <div className="mx-auto max-w-xl px-3 py-2">
        {detailsOpen && hasDetails && (
          <div className="mb-2 max-h-28 space-y-0.5 overflow-y-auto rounded-lg bg-slate-50 px-2.5 py-2 text-xs">
            {detailRows.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-2">
                <span className="text-muted">{label}</span>
                <span className="font-medium text-foreground tabular-nums">{value}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            {hasDetails && (
              <button
                type="button"
                onClick={() => setDetailsOpen((o) => !o)}
                className="mb-0.5 flex items-center gap-0.5 text-[10px] font-medium uppercase tracking-wide text-teal-700"
              >
                {detailsOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {detailsOpen ? "Hide" : "Details"}
              </button>
            )}
            {primary ? (
              <>
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted leading-none">
                  {primary[0]}
                </p>
                <p className="truncate text-lg font-bold leading-tight text-foreground tabular-nums">
                  {primary[1]}
                </p>
                {dueRow ? (
                  <p className="truncate text-xs font-semibold text-amber-800 tabular-nums">
                    {dueRow[0]} {dueRow[1]}
                  </p>
                ) : null}
              </>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {previewLabel && onPreview && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={onPreview}
                disabled={disabled}
                aria-label={previewLabel}
                title={previewLabel}
              >
                <Eye size={18} />
              </Button>
            )}
            {secondaryAction && onSecondaryAction && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onSecondaryAction}
                loading={loading}
                disabled={disabled}
                className="gap-1 px-2 sm:px-2.5"
                aria-label={secondaryAction}
                title={secondaryAction}
              >
                <Printer size={14} className="shrink-0" />
                <span className="hidden min-[400px]:inline">{shortSecondary ?? "Print"}</span>
              </Button>
            )}
            <Button
              size="md"
              onClick={onAction}
              loading={loading}
              disabled={disabled}
              className="min-w-[5.25rem] gap-1.5 px-3 sm:min-w-[8.5rem]"
              aria-label={actionAriaLabel ?? action}
              title={actionAriaLabel ?? action}
            >
              {ActionIcon ? <ActionIcon size={16} className="shrink-0" /> : null}
              <span className="text-sm font-semibold">{shortAction || action}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
