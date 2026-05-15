/**
 * StickyBar – fixed bottom bar used on transaction forms.
 * Shows totals on the left and a primary action button on the right.
 *
 * Usage:
 *   <StickyBar
 *     rows={[["Subtotal", "NPR 1,793"], ["Total", "NPR 1,793"]]}
 *     action="Save sale"
 *     onAction={handleSubmit}
 *     loading={isSaving}
 *   />
 */
import { Button } from "@/components/ui/button";

type Props = {
  rows?: [label: string, value: string][];
  action: string;
  onAction: () => void;
  /** Optional secondary button shown above the primary (e.g. "Save & Print") */
  secondaryAction?: string;
  onSecondaryAction?: () => void;
  loading?: boolean;
  disabled?: boolean;
};

export const StickyBar = ({
  rows,
  action,
  onAction,
  secondaryAction,
  onSecondaryAction,
  loading,
  disabled,
}: Props) => (
  <div className="fixed bottom-16 left-0 right-0 z-30 border-t border-border-subtle bg-white/95 backdrop-blur px-4 py-3 shadow-card-md">
    <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
      {rows && rows.length > 0 && (
        <div className="space-y-0.5">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center gap-3 text-sm">
              <span className="text-muted">{label}</span>
              <span className="font-semibold text-foreground">{value}</span>
            </div>
          ))}
        </div>
      )}
      <div className="flex shrink-0 flex-col gap-2">
        {secondaryAction && onSecondaryAction && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSecondaryAction}
            loading={loading}
            disabled={disabled}
            className="w-full"
          >
            {secondaryAction}
          </Button>
        )}
        <Button
          size="lg"
          onClick={onAction}
          loading={loading}
          disabled={disabled}
        >
          {action}
        </Button>
      </div>
    </div>
  </div>
);
