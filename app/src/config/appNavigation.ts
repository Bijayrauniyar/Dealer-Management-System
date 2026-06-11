import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  BarChart2,
  BookOpen,
  Box,
  Building2,
  Calculator,
  CreditCard,
  DollarSign,
  Download,
  HelpCircle,
  LayoutDashboard,
  Package,
  Archive,
  RotateCcw,
  ShoppingCart,
  SlidersHorizontal,
  Truck,
  Users,
} from "lucide-react";

export type HomeNavShortcut = {
  label: string;
  to: string;
  icon: LucideIcon;
  color?: string;
  settingsTab?: string;
};

export type HomeOverviewSection = {
  title: string;
  items: HomeNavShortcut[];
};

/** Home — daily voucher entry (6 tiles, 3×2). */
export const HOME_QUICK_ACTIONS: HomeNavShortcut[] = [
  { label: "Sales invoice", to: "/app/sales/new", icon: ShoppingCart, color: "bg-teal-100 text-teal-700" },
  { label: "Payment in", to: "/app/payments/new", icon: CreditCard, color: "bg-green-100 text-green-700" },
  { label: "Purchase", to: "/app/purchases", icon: Package, color: "bg-blue-100 text-blue-700" },
  { label: "Return", to: "/app/returns/new", icon: RotateCcw, color: "bg-rose-100 text-rose-700" },
  { label: "Expense", to: "/app/expenses/new", icon: DollarSign, color: "bg-orange-100 text-orange-700" },
  { label: "Payment out", to: "/app/supplier-payments/new", icon: Truck, color: "bg-purple-100 text-purple-700" },
];

/** Home — categorized review shortcuts (list rows below quick actions). */
export const HOME_OVERVIEW_SECTIONS: HomeOverviewSection[] = [
  {
    title: "Receivables",
    items: [
      { label: "Outstanding bills", to: "/app/home/outstanding", icon: BookOpen },
      { label: "Overdue customers", to: "/app/home/overdue", icon: AlertTriangle },
      { label: "Customers", to: "/app/customers", icon: Users },
    ],
  },
  {
    title: "Payables",
    items: [
      { label: "Purchases", to: "/app/purchases", icon: Package },
      { label: "Supplier payable", to: "/app/home/period/supplier-payable", icon: BookOpen },
      { label: "Suppliers", to: "/app/suppliers", icon: Truck },
    ],
  },
  {
    title: "Business position",
    items: [
      { label: "Dashboard", to: "/app/dashboard", icon: LayoutDashboard },
      { label: "Company", to: "/app/company", icon: Building2 },
      { label: "Capital", to: "/app/capital", icon: DollarSign },
      { label: "Daily cash", to: "/app/daily-cash", icon: Calculator },
    ],
  },
  {
    title: "Reports & data",
    items: [
      { label: "Reports hub", to: "/app/reports", icon: BarChart2 },
      { label: "Export data", to: "/app/settings", icon: Download, settingsTab: "data" },
    ],
  },
];

export type NavLinkItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  /** When true, only shown if tenant has stock adjustment enabled */
  requiresStockAdjustment?: boolean;
};

export type NavDrawerGroup = {
  id: string;
  title: string;
  items: NavLinkItem[];
};

/** Side drawer — Masters, Entry, Reports, Support */
export const NAV_DRAWER_GROUPS: NavDrawerGroup[] = [
  {
    id: "masters",
    title: "Masters",
    items: [
      { label: "Stock", to: "/app/products", icon: Box },
      { label: "Customers", to: "/app/customers", icon: Users },
      { label: "Suppliers", to: "/app/suppliers", icon: Truck },
      { label: "Archives", to: "/app/archives", icon: Archive },
      {
        label: "Stock adjustment",
        to: "/app/stock-adjustment/new",
        icon: SlidersHorizontal,
        requiresStockAdjustment: true,
      },
    ],
  },
  {
    id: "entry",
    title: "Quick entry",
    items: [
      { label: "Sales invoice", to: "/app/sales/new", icon: ShoppingCart },
      { label: "Payment in", to: "/app/payments/new", icon: CreditCard },
      { label: "Purchase", to: "/app/purchases", icon: Package },
      { label: "Return", to: "/app/returns/new", icon: RotateCcw },
      { label: "Expense", to: "/app/expenses/new", icon: DollarSign },
      { label: "Payment out", to: "/app/supplier-payments/new", icon: Truck },
      { label: "Daily cash", to: "/app/daily-cash", icon: Calculator },
    ],
  },
  {
    id: "reports",
    title: "Reports",
    items: [{ label: "Reports hub", to: "/app/reports", icon: BarChart2 }],
  },
  {
    id: "support",
    title: "Support",
    items: [{ label: "BikriKhata support", to: "/app/support", icon: HelpCircle }],
  },
];

/** Centre + quick-action sheet — daily bills first, then new masters. */
export const QUICK_ENTRY_ACTIONS: { label: string; to: string }[] = [
  { label: "Sales invoice", to: "/app/sales/new" },
  { label: "Payment received", to: "/app/payments/new" },
  { label: "Purchase invoice", to: "/app/purchases/new" },
  { label: "Return", to: "/app/returns/new" },
  { label: "Supplier pay", to: "/app/supplier-payments/new" },
  { label: "Expense", to: "/app/expenses/new" },
  { label: "Daily cash", to: "/app/daily-cash" },
  { label: "New product", to: "/app/products/new" },
  { label: "New customer", to: "/app/customers/new" },
  { label: "New supplier", to: "/app/suppliers/new" },
];

export function filterDrawerGroups(
  groups: NavDrawerGroup[],
  allowStockAdjustment: boolean,
): NavDrawerGroup[] {
  return groups.map((g) => ({
    ...g,
    items: g.items.filter(
      (i) => !i.requiresStockAdjustment || allowStockAdjustment,
    ),
  }));
}

/** Home tab — ops dashboard and home sub-routes. */
export function isHomeTabActive(pathname: string, _search = ""): boolean {
  if (pathname === "/app/home") return true;
  if (pathname.startsWith("/app/home/")) return true;
  return false;
}

/** Customers tab — customer hub (+ legacy home?tab=customers). */
export function isCustomersTabActive(pathname: string, search = ""): boolean {
  if (pathname.startsWith("/app/customers")) return true;
  if (pathname === "/app/home" && new URLSearchParams(search).get("tab") === "customers") {
    return true;
  }
  return false;
}

/** Stock tab — products / inventory hub. */
export function isInventoryTabActive(pathname: string, search = ""): boolean {
  if (pathname.startsWith("/app/products") || pathname.startsWith("/app/stock")) {
    return true;
  }
  if (pathname === "/app/home" && new URLSearchParams(search).get("tab") === "stock") {
    return true;
  }
  return false;
}

export function isReportsTabActive(pathname: string): boolean {
  return (
    pathname.startsWith("/app/reports") ||
    pathname.startsWith("/app/dashboard") ||
    pathname.startsWith("/app/company") ||
    pathname.startsWith("/app/capital") ||
    pathname === "/app/more"
  );
}
