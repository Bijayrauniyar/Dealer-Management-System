import { X } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

/** Mobile-friendly bottom sheet (no extra UI library). */
export function BottomSheet({ open, title, onClose, children }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end print:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bottom-sheet-title"
        className="relative max-h-[88vh] overflow-y-auto rounded-t-2xl bg-white px-4 pb-6 pt-3 shadow-xl"
      >
        <div className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-slate-200" />
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 id="bottom-sheet-title" className="text-lg font-semibold text-foreground">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted hover:bg-slate-100"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
