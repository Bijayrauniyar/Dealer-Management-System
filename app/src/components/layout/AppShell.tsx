import { useState, useMemo } from "react";
import { Bell, Home, Menu, Plus, X } from "lucide-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { NotificationPanel, buildNotifications } from "@/components/app/NotificationPanel";
import { useBusinessSettings, useProducts, useSales } from "@/store/domain";

const NAV_TABS = [
  { to: "/app/home", label: "Home",  icon: Home },
  { to: "/app/more", label: "More",  icon: Menu },
];

/** Quick-action sheet opened by the centre + button */
const QUICK_ACTIONS = [
  { label: "New bill",              to: "/app/sales/new" },
  { label: "Payment received",      to: "/app/payments/new" },
  { label: "Expense",               to: "/app/expenses/new" },
  { label: "Purchase",              to: "/app/purchases/new" },
  { label: "Supplier pay",          to: "/app/supplier-payments/new" },
  { label: "Daily cash",           to: "/app/daily-cash" },
];

export const AppShell = () => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const [sheet,  setSheet]  = useState(false);
  const [notifs, setNotifs] = useState(false);
  const business  = useBusinessSettings();
  const sales     = useSales();
  const products  = useProducts();
  const notifList = useMemo(
    () => buildNotifications(sales, products, business.overdueDays, business.dueSoonDays),
    [sales, products, business.overdueDays, business.dueSoonDays],
  );
  const total       = notifList.length;
  const urgent      = notifList.filter((n) => n.urgent).length;

  return (
    <div className="min-h-screen bg-surface-page">
      {/* ── Header ── */}
      <header className="sticky top-0 z-20 border-b border-border-subtle bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-start justify-between gap-3 px-4 py-3">
          <Link to="/app/home" className="group min-w-0 flex-1">
            <p
              className="text-xs font-medium leading-snug text-teal-600 group-hover:underline line-clamp-2 break-words"
              title={business.name}
            >
              {business.name}
            </p>
            <p
              className="mt-0.5 truncate text-sm font-semibold text-foreground group-hover:text-teal-600 transition-colors"
              title={business.region}
            >
              {business.region}
            </p>
          </Link>
          <div className="flex shrink-0 items-center gap-2 self-start pt-px">
            <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700">
              Online
            </span>
            {/* Bell icon with badge */}
            <button
              onClick={() => setNotifs(true)}
              className="relative rounded-full p-1.5 hover:bg-slate-100 transition-colors"
              aria-label="Notifications"
            >
              <Bell size={20} className={urgent > 0 ? "text-red-500" : "text-slate-500"} />
              {total > 0 && (
                <span className={cn(
                  "absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white",
                  urgent > 0 ? "bg-red-500" : "bg-teal-500",
                )}>
                  {total > 9 ? "9+" : total}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── Page content ── */}
      <main>
        <Outlet />
      </main>

      {/* ── Quick-action overlay ── */}
      {sheet && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setSheet(false)} />
          <div className="fixed bottom-16 left-1/2 z-50 w-full max-w-xl -translate-x-1/2 rounded-t-2xl bg-white px-4 pt-4 pb-6 shadow-card-md">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-foreground">New entry</h3>
              <button onClick={() => setSheet(false)} className="rounded-full p-1 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {QUICK_ACTIONS.map((a) => (
                <button
                  key={a.to}
                  onClick={() => { setSheet(false); navigate(a.to); }}
                  className="rounded-xl border border-border-subtle bg-white p-4 text-left text-sm font-medium text-foreground hover:bg-teal-50 hover:border-teal-200 transition-colors"
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Notification panel ── */}
      {notifs && <NotificationPanel onClose={() => setNotifs(false)} />}

      {/* ── Bottom tab bar ── */}
      <nav className="bottom-tabs fixed bottom-0 left-0 right-0 z-30 border-t border-border-subtle bg-white">
        <div className="mx-auto grid max-w-xl grid-cols-3">
          {/* Home tab */}
          {NAV_TABS.slice(0, 1).map((tab) => {
            const active = location.pathname.startsWith(tab.to);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-xs transition-colors",
                  active ? "text-teal-600" : "text-slate-500 hover:text-teal-600",
                )}
              >
                <Icon size={20} />
                <span>{tab.label}</span>
              </Link>
            );
          })}

          {/* Centre + FAB */}
          <button
            onClick={() => setSheet((s) => !s)}
            className="flex flex-col items-center justify-center py-2"
          >
            <span className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
              sheet ? "bg-slate-200 text-slate-600" : "bg-teal-600 text-white shadow-card hover:bg-teal-700",
            )}>
              {sheet ? <X size={20} /> : <Plus size={20} />}
            </span>
          </button>

          {/* More tab */}
          {NAV_TABS.slice(1).map((tab) => {
            const active = location.pathname.startsWith(tab.to);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-xs transition-colors",
                  active ? "text-teal-600" : "text-slate-500 hover:text-teal-600",
                )}
              >
                <Icon size={20} />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
