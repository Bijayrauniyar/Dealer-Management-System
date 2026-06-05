import { useState, useMemo } from "react";
import {
  Bell,
  Home,
  Menu,
  Plus,
  Settings,
  Users,
  Box,
  BarChart2,
  X,
} from "lucide-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { NotificationPanel } from "@/components/app/NotificationPanel";
import { AppNavDrawer } from "@/components/layout/AppNavDrawer";
import {
  QUICK_ENTRY_ACTIONS,
  isCustomersTabActive,
  isHomeTabActive,
  isInventoryTabActive,
  isReportsTabActive,
} from "@/config/appNavigation";
import { LicenseRenewalBanner } from "@/components/app/LicenseRenewalBanner";
import { LicenseRenewalDailyReminder } from "@/components/app/LicenseRenewalDailyReminder";
import { buildLicenseRenewalNotif, buildNotifications } from "@/components/app/NotificationPanel";
import { useAuth } from "@/lib/auth";
import { useBusinessSettings, useProducts, useSales } from "@/store/domain";

export const AppShell = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sheet, setSheet] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [notifs, setNotifs] = useState(false);
  const auth = useAuth();
  const business = useBusinessSettings();
  const sales = useSales();
  const products = useProducts();
  const notifList = useMemo(() => {
    const base = buildNotifications(sales, products, business.overdueDays, business.dueSoonDays);
    const license = buildLicenseRenewalNotif({
      tenantPlan: auth.tenantPlan,
      trialEndsAt: auth.trialEndsAt,
      subscriptionEndsAt: auth.subscriptionEndsAt,
      tenantStatus: auth.tenantStatus,
      licenseValid: auth.licenseValid,
    });
    return license ? [license, ...base] : base;
  }, [
    sales,
    products,
    business.overdueDays,
    business.dueSoonDays,
    auth.tenantPlan,
    auth.trialEndsAt,
    auth.subscriptionEndsAt,
    auth.tenantStatus,
    auth.licenseValid,
  ]);
  const total = notifList.length;
  const urgent = notifList.filter((n) => n.urgent).length;

  const bottomTabs = [
    {
      to: "/app/home",
      label: "Home",
      icon: Home,
      active: isHomeTabActive(location.pathname, location.search),
    },
    {
      to: "/app/home?tab=customers",
      label: "Customers",
      icon: Users,
      active: isCustomersTabActive(location.pathname, location.search),
    },
    {
      to: "/app/home?tab=stock",
      label: "Inventory",
      icon: Box,
      active: isInventoryTabActive(location.pathname, location.search),
    },
    {
      to: "/app/reports",
      label: "Reports",
      icon: BarChart2,
      active: isReportsTabActive(location.pathname),
    },
  ] as const;

  return (
    <div className="min-h-screen bg-surface-page">
      <LicenseRenewalBanner />
      <LicenseRenewalDailyReminder />
      <header className="sticky top-0 z-20 border-b border-border-subtle bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-start justify-between gap-2 px-3 py-3 sm:px-4">
          <button
            type="button"
            onClick={() => setDrawer(true)}
            className="mt-0.5 shrink-0 rounded-full p-1.5 hover:bg-slate-100 transition-colors"
            aria-label="Open menu"
          >
            <Menu size={22} className="text-slate-600" />
          </button>
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
          <div className="flex shrink-0 items-center gap-1 self-start pt-px">
            <Link
              to="/app/settings"
              className="rounded-full p-1.5 hover:bg-slate-100 transition-colors"
              aria-label="Settings"
            >
              <Settings size={20} className="text-slate-500" />
            </Link>
            <button
              type="button"
              onClick={() => setNotifs(true)}
              className="relative rounded-full p-1.5 hover:bg-slate-100 transition-colors"
              aria-label="Notifications"
            >
              <Bell size={20} className={urgent > 0 ? "text-red-500" : "text-slate-500"} />
              {total > 0 && (
                <span
                  className={cn(
                    "absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white",
                    urgent > 0 ? "bg-red-500" : "bg-teal-500",
                  )}
                >
                  {total > 9 ? "9+" : total}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <AppNavDrawer
        open={drawer}
        onClose={() => setDrawer(false)}
        allowStockAdjustment={business.allowStockAdjustment}
      />

      {sheet && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setSheet(false)}
            aria-hidden
          />
          <div className="fixed bottom-16 left-1/2 z-50 w-full max-w-xl -translate-x-1/2 rounded-t-2xl bg-white px-4 pt-4 pb-6 shadow-card-md">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-foreground">New entry</h3>
              <button
                type="button"
                onClick={() => setSheet(false)}
                className="rounded-full p-1 hover:bg-slate-100"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {QUICK_ENTRY_ACTIONS.map((a) => (
                <button
                  key={a.to}
                  type="button"
                  onClick={() => {
                    setSheet(false);
                    navigate(a.to);
                  }}
                  className="rounded-xl border border-border-subtle bg-white p-4 text-left text-sm font-medium text-foreground hover:bg-teal-50 hover:border-teal-200 transition-colors"
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {notifs && <NotificationPanel onClose={() => setNotifs(false)} />}

      <nav className="bottom-tabs fixed bottom-0 left-0 right-0 z-30 border-t border-border-subtle bg-white">
        <div className="mx-auto grid max-w-xl grid-cols-5">
          {bottomTabs.slice(0, 2).map((tab) => {
            const Icon = tab.icon;
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-[10px] sm:text-xs transition-colors",
                  tab.active ? "text-teal-600" : "text-slate-500 hover:text-teal-600",
                )}
              >
                <Icon size={20} />
                <span>{tab.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setSheet((s) => !s)}
            className="flex flex-col items-center justify-center py-2"
            aria-label="New entry"
          >
            <span
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                sheet
                  ? "bg-slate-200 text-slate-600"
                  : "bg-teal-600 text-white shadow-card hover:bg-teal-700",
              )}
            >
              {sheet ? <X size={20} /> : <Plus size={20} />}
            </span>
          </button>

          {bottomTabs.slice(2).map((tab) => {
            const Icon = tab.icon;
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-[10px] sm:text-xs transition-colors",
                  tab.active ? "text-teal-600" : "text-slate-500 hover:text-teal-600",
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
