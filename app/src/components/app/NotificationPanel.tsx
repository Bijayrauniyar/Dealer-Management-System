/**
 * NotificationPanel — slide-in from right.
 *
 * Mobile-first design:
 *  - Tab bar (All / Urgent / Bills / Stock / Other) so user jumps straight
 *    to what they care about without scrolling.
 *  - Each card has proper 8px gap, large tap target (min 56px), clear
 *    title + body + amount layout.
 *  - "Mark all read" header action (demo: no-op in v1).
 *  - Empty state per tab.
 */
import React, { useMemo, useState } from "react";
import {
  X, AlertTriangle, Clock, Package, CreditCard,
  Truck, BookOpen, CheckCheck, ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { Product, Sale } from "@/data/dummy";
import { BUSINESS } from "@/data/dummy";
import { useProducts, useSales } from "@/store/domain";
import { npr, fmtDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────
export type Notif = {
  id:      string;
  type:    "overdue" | "due_soon" | "low_stock" | "advance" | "short_receive" | "cash_open";
  tab:     "bills" | "stock" | "other";
  title:   string;
  body:    string;
  amount?: number;
  linkTo?: string;
  urgent:  boolean;
};

// ── Build notifications from in-memory data ───────────────────────────────────
const today = new Date();
today.setHours(0, 0, 0, 0);

const daysDiff = (iso: string) => {
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  return Math.floor((d.getTime() - today.getTime()) / 86_400_000);
};

export function buildNotifications(
  sales: Sale[],
  products: Product[],
  overdueDays = BUSINESS.overdueDays,
  dueSoonDays = BUSINESS.dueSoonDays,
): Notif[] {
  const ns: Notif[] = [];

  // 1. Overdue bills
  sales
    .filter((s) => s.balance > 0 && s.dueDate && daysDiff(s.dueDate) < -overdueDays)
    .forEach((s) => {
      const ago = Math.abs(daysDiff(s.dueDate!));
      ns.push({
        id: `overdue-${s.billNo}`, type: "overdue", tab: "bills",
        title: s.customerName,
        body: `Bill ${s.billNo} · due ${ago}d ago (${fmtDate(s.dueDate!)})`,
        amount: s.balance, linkTo: `/app/bills/${s.billNo}`, urgent: true,
      });
    });

  // 2. Due soon
  sales
    .filter((s) => {
      if (s.balance <= 0 || !s.dueDate) return false;
      const d = daysDiff(s.dueDate);
      return d >= -overdueDays && d <= dueSoonDays;
    })
    .forEach((s) => {
      const d = daysDiff(s.dueDate!);
      const when = d === 0 ? "today" : d < 0 ? `${Math.abs(d)}d overdue` : `in ${d}d`;
      ns.push({
        id: `due-${s.billNo}`, type: "due_soon", tab: "bills",
        title: s.customerName,
        body: `Bill ${s.billNo} · due ${when} (${fmtDate(s.dueDate!)})`,
        amount: s.balance, linkTo: `/app/bills/${s.billNo}`, urgent: d <= 0,
      });
    });

  // 3. Low stock
  products
    .filter((p) => p.onHand <= p.minQty)
    .forEach((p) => {
      ns.push({
        id: `low-${p.id}`, type: "low_stock", tab: "stock",
        title: p.name,
        body: `${p.onHand} ${p.uom} left · min threshold ${p.minQty} ${p.uom}`,
        linkTo: "/app/stock", urgent: p.onHand === 0,
      });
    });

  // 4. Short receive pending (demo)
  ns.push({
    id: "short-demo", type: "short_receive", tab: "other",
    title: "Short receive pending",
    body: "Havmor Logistics · 15 PCS Vanilla 500ml unresolved",
    linkTo: "/app/purchases", urgent: false,
  });

  // 5. Daily cash open (demo)
  ns.push({
    id: "cash-open", type: "cash_open", tab: "other",
    title: "Daily cash not closed",
    body: `${fmtDate(today.toISOString().slice(0, 10))} · still in draft`,
    linkTo: "/app/daily-cash", urgent: false,
  });

  return ns;
}

// ── Visual config ─────────────────────────────────────────────────────────────
const TYPE_META: Record<Notif["type"], {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  badge: string;
  label: string;
}> = {
  overdue:       { icon: AlertTriangle, iconBg: "bg-red-100",    iconColor: "text-red-600",    badge: "bg-red-100 text-red-700",      label: "Overdue" },
  due_soon:      { icon: Clock,         iconBg: "bg-amber-100",  iconColor: "text-amber-600",  badge: "bg-amber-100 text-amber-700",  label: "Due soon" },
  low_stock:     { icon: Package,       iconBg: "bg-orange-100", iconColor: "text-orange-600", badge: "bg-orange-100 text-orange-700",label: "Low stock" },
  advance:       { icon: CreditCard,    iconBg: "bg-teal-100",   iconColor: "text-teal-600",   badge: "bg-teal-100 text-teal-700",    label: "Credit" },
  short_receive: { icon: Truck,         iconBg: "bg-purple-100", iconColor: "text-purple-600", badge: "bg-purple-100 text-purple-700",label: "Short receive" },
  cash_open:     { icon: BookOpen,      iconBg: "bg-slate-100",  iconColor: "text-slate-500",  badge: "bg-slate-100 text-slate-600",  label: "Cash" },
};

// ── Tabs ──────────────────────────────────────────────────────────────────────
type TabId = "all" | "bills" | "stock" | "other";
const TABS: { id: TabId; label: string }[] = [
  { id: "all",   label: "All" },
  { id: "bills", label: "Bills" },
  { id: "stock", label: "Stock" },
  { id: "other", label: "Other" },
];

// ── Main component ────────────────────────────────────────────────────────────
type Props = { onClose: () => void };

export const NotificationPanel = ({ onClose }: Props) => {
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const sales    = useSales();
  const products = useProducts();
  const all      = useMemo(() => buildNotifications(sales, products), [sales, products]);

  const filtered = activeTab === "all" ? all : all.filter((n) => n.tab === activeTab);
  const urgent   = filtered.filter((n) => n.urgent);
  const normal   = filtered.filter((n) => !n.urgent);

  const counts: Record<TabId, number> = {
    all:   all.length,
    bills: all.filter((n) => n.tab === "bills").length,
    stock: all.filter((n) => n.tab === "stock").length,
    other: all.filter((n) => n.tab === "other").length,
  };
  const urgentTotal = all.filter((n) => n.urgent).length;

  return (
    <>
      {/* backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />

      {/* panel — slides in from right */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[22rem] flex-col bg-white shadow-2xl">

        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-900">Notifications</h2>
            {urgentTotal > 0 && (
              <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                {urgentTotal} urgent
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { toast.success("All marked as read."); }}
              className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium text-teal-600 hover:bg-teal-50"
            >
              <CheckCheck size={13} /> Mark all read
            </button>
            <button onClick={onClose} className="rounded-full p-1.5 hover:bg-gray-100">
              <X size={18} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div className="flex border-b border-gray-100 bg-gray-50/70">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-0.5 px-2 py-2.5 text-xs font-medium transition-colors",
                activeTab === tab.id
                  ? "text-teal-600 after:absolute after:bottom-0 after:left-2 after:right-2 after:h-0.5 after:rounded-full after:bg-teal-600"
                  : "text-gray-500 hover:text-gray-700",
              )}
            >
              <span>{tab.label}</span>
              <span className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
                activeTab === tab.id ? "bg-teal-100 text-teal-700" : "bg-gray-200 text-gray-500",
              )}>
                {counts[tab.id]}
              </span>
            </button>
          ))}
        </div>

        {/* ── List ── */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <CheckCheck size={32} className="mb-3 text-gray-300" />
              <p className="text-sm font-medium">All clear here!</p>
              <p className="mt-1 text-xs">No {activeTab === "all" ? "" : activeTab} alerts.</p>
            </div>
          ) : (
            <div className="p-3 space-y-1">
              {/* Urgent group */}
              {urgent.length > 0 && (
                <>
                  <p className="mb-2 px-1 pt-1 text-[10px] font-bold uppercase tracking-wider text-red-500">
                    Urgent · {urgent.length}
                  </p>
                  <div className="flex flex-col gap-2.5">
                    {urgent.map((n) => <NotifCard key={n.id} n={n} onClose={onClose} />)}
                  </div>
                </>
              )}

              {/* Normal group */}
              {normal.length > 0 && (
                <>
                  <p className={cn(
                    "mb-2 px-1 text-[10px] font-bold uppercase tracking-wider text-gray-400",
                    urgent.length > 0 ? "mt-4 pt-3 border-t border-gray-100" : "pt-1",
                  )}>
                    {urgent.length > 0 ? `Other · ${normal.length}` : `Alerts · ${normal.length}`}
                  </p>
                  <div className="flex flex-col gap-2.5">
                    {normal.map((n) => <NotifCard key={n.id} n={n} onClose={onClose} />)}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-gray-100 px-4 py-2.5">
          <p className="text-center text-[11px] text-gray-400">
            Thresholds configured in{" "}
            <Link to="/app/settings" onClick={onClose} className="text-teal-600 underline">
              Settings
            </Link>
          </p>
        </div>
      </div>
    </>
  );
};

// ── Single notification card ──────────────────────────────────────────────────
const NotifCard = ({ n, onClose }: { n: Notif; onClose: () => void }) => {
  const meta = TYPE_META[n.type];
  const Icon = meta.icon;

  const content = (
    <div className={cn(
      "flex min-h-[56px] items-center gap-3 rounded-2xl border px-3 py-3 transition-opacity",
      n.urgent
        ? "border-red-100 bg-red-50"
        : "border-gray-100 bg-white shadow-sm",
      n.linkTo && "active:opacity-70",
    )}>
      {/* icon bubble */}
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", meta.iconBg)}>
        <Icon size={16} className={meta.iconColor} />
      </div>

      {/* text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold leading-tight text-gray-900 truncate">{n.title}</p>
          {n.amount && (
            <span className="shrink-0 text-sm font-bold text-gray-800">{npr(n.amount)}</span>
          )}
        </div>
        <p className="mt-0.5 text-xs leading-snug text-gray-500 line-clamp-2">{n.body}</p>
        <span className={cn("mt-1.5 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-semibold", meta.badge)}>
          {meta.label}
        </span>
      </div>

      {/* chevron */}
      {n.linkTo && <ChevronRight size={14} className="shrink-0 text-gray-300" />}
    </div>
  );

  return n.linkTo ? (
    <Link to={n.linkTo} onClick={onClose}>{content}</Link>
  ) : (
    <div>{content}</div>
  );
};
