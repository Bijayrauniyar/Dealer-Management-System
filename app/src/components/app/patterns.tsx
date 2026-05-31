/**
 * Reusable page chrome — lists, forms, tabs, callouts.
 * Use these instead of one-off Tailwind on pages. See docs/UI_CONSISTENCY_PLAN.md.
 */
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Plus } from "lucide-react";
import { PageBackLink } from "@/components/app/PageBackLink";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Page H1 — same weight everywhere. */
export function PageTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h1 className={cn("text-lg font-semibold text-foreground", className)}>{children}</h1>
  );
}

/** Section label above filters or card groups. */
export function SectionLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-xs font-semibold uppercase tracking-wide text-muted",
        className,
      )}
    >
      {children}
    </p>
  );
}

/** Drill-in form / entry screen: back + title + optional subtitle. */
export function FormPageHeader({
  title,
  subtitle,
  backLabel,
  className,
}: {
  title: string;
  subtitle?: string;
  backLabel?: string;
  className?: string;
}) {
  return (
    <header className={cn("mb-5", className)}>
      <PageBackLink label={backLabel} />
      <PageTitle className="mb-1">{title}</PageTitle>
      {subtitle ? <p className="text-sm text-muted">{subtitle}</p> : null}
    </header>
  );
}

/** Master list screen: optional back, title, standard Add button. */
export function ListPageHeader({
  title,
  addLabel,
  onAdd,
  showBack,
  backLabel,
  className,
  children,
}: {
  title: string;
  addLabel: string;
  onAdd: () => void;
  showBack?: boolean;
  backLabel?: string;
  className?: string;
  /** Extra actions left of Add (e.g. second button). */
  children?: ReactNode;
}) {
  return (
    <div className={cn("mb-4", className)}>
      <div className="flex items-center justify-between gap-2">
        {showBack ? (
          <PageBackLink className="mb-0" label={backLabel} />
        ) : (
          <span />
        )}
        <div className="flex shrink-0 items-center gap-2">
          {children}
          <AddEntityButton label={addLabel} onClick={onAdd} />
        </div>
      </div>
      <PageTitle className="mt-3">{title}</PageTitle>
    </div>
  );
}

/** Standard “+ Add …” for list pages. */
export function AddEntityButton({
  label,
  onClick,
  className,
}: {
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <Button type="button" size="sm" onClick={onClick} className={className}>
      <Plus size={14} aria-hidden />
      {label}
    </Button>
  );
}

export type SegmentedTabOption<T extends string> = {
  id: T;
  label: string;
};

/** Two-or-more tab switcher (Home customers / stock, Settings segments). */
export function SegmentedTabs<T extends string>({
  value,
  options,
  onChange,
  className,
}: {
  value: T;
  options: SegmentedTabOption<T>[];
  onChange: (id: T) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex overflow-hidden rounded-xl border border-border-subtle bg-surface-card",
        className,
      )}
      role="tablist"
    >
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.id)}
            className={cn(
              "flex-1 py-2.5 text-sm font-semibold transition-colors",
              active ? "bg-teal-600 text-white" : "text-muted hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/** Info / VAT / hint strip — not an error. */
export function InfoCallout({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "rounded-lg border border-teal-200/80 bg-teal-50/40 px-3 py-2 text-xs text-teal-900",
        className,
      )}
    >
      {children}
    </p>
  );
}

/** External or in-app link row (support, settings). */
export function LinkActionRow({
  href,
  onClick,
  icon: Icon,
  label,
  highlight,
  external,
}: {
  href?: string;
  onClick?: () => void;
  icon: LucideIcon;
  label: ReactNode;
  highlight?: boolean;
  external?: boolean;
}) {
  const className = cn(
    "flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left text-sm font-medium transition-colors",
    highlight
      ? "border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800"
      : "border-border-subtle hover:bg-teal-50 text-foreground",
  );

  if (href) {
    return (
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className={className}
      >
        <Icon size={18} className="shrink-0 text-teal-600" aria-hidden />
        <span className="min-w-0 flex-1">{label}</span>
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      <Icon size={18} className="shrink-0 text-teal-600" aria-hidden />
      <span className="min-w-0 flex-1">{label}</span>
    </button>
  );
}

/** Toolbar row on preview modals (Print / PDF / Close). */
export function PreviewToolbar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center justify-end gap-2", className)}>{children}</div>
  );
}
