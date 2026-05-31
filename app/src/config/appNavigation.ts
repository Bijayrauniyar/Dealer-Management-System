import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  BarChart2,
  BookOpen,
  Box,
  Calculator,
  CreditCard,
  DollarSign,
  HelpCircle,
  LayoutDashboard,
  Package,
  RotateCcw,
  ShoppingCart,
  Tag,
  Truck,
  Users,
} from "lucide-react";

/** Home dashboard quick-entry tiles (centre + has full list). */
export const HOME_QUICK_ACTIONS: {
  label: string;
  to: string;
  icon: LucideIcon;
  color: string;
}[] = [
  { label: "Sales", to: "/app/sales/new", icon: ShoppingCart, color: "bg-teal-100 text-teal-700" },
  { label: "Payment", to: "/app/payments/new", icon: CreditCard, color: "bg-green-100 text-green-700" },
  { label: "Purchase", to: "/app/purchases/new", icon: Package, color: "bg-blue-100 text-blue-700" },
  { label: "Return", to: "/app/returns/new", icon: RotateCcw, color: "bg-amber-100 text-amber-700" },
  { label: "Expense", to: "/app/expenses/new", icon: DollarSign, color: "bg-orange-100 text-orange-700" },
  { label: "Supplier pay", to: "/app/supplier-payments/new", icon: Truck, color: "bg-purple-100 text-purple-700" },
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
      { label: "Products", to: "/app/products", icon: LayoutDashboard },
      { label: "Customers", to: "/app/home?tab=customers", icon: Users },
      { label: "Suppliers", to: "/app/suppliers", icon: Truck },
      { label: "Stock", to: "/app/home?tab=stock", icon: Box },
      {
        label: "Stock adjustment",
        to: "/app/stock-adjustment/new",
        icon: Box,
        requiresStockAdjustment: true,
      },
    ],
  },
  {
    id: "entry",
    title: "New entry",
    items: [
      { label: "Sales invoice", to: "/app/sales/new", icon: ShoppingCart },
      { label: "Payment in", to: "/app/payments/new", icon: CreditCard },
      { label: "Return", to: "/app/returns/new", icon: RotateCcw },
      { label: "Damage", to: "/app/damages/new", icon: AlertTriangle },
      { label: "Purchase invoice", to: "/app/purchases/new", icon: Package },
      { label: "Supplier pay", to: "/app/supplier-payments/new", icon: Truck },
      { label: "Expense", to: "/app/expenses/new", icon: DollarSign },
      { label: "Daily cash", to: "/app/daily-cash", icon: Calculator },
      { label: "Scheme", to: "/app/schemes/new", icon: Tag },
    ],
  },
  {
    id: "reports",
    title: "Reports",
    items: [
      { label: "Reports hub", to: "/app/reports", icon: BarChart2 },
      { label: "Dashboard", to: "/app/dashboard", icon: BarChart2 },
      { label: "Outstanding bills", to: "/app/home/outstanding", icon: BookOpen },
      { label: "Overdue customers", to: "/app/home/overdue", icon: AlertTriangle },
      { label: "Company overview", to: "/app/company", icon: LayoutDashboard },
      { label: "Capital entries", to: "/app/capital", icon: DollarSign },
      { label: "Supplier ledger", to: "/app/home/period/supplier-payable", icon: BookOpen },
    ],
  },
  {
    id: "support",
    title: "Support",
    items: [{ label: "BikriKhata support", to: "/app/support", icon: HelpCircle }],
  },
];

/** Centre + quick-action sheet */
export const QUICK_ENTRY_ACTIONS: { label: string; to: string }[] = [
  { label: "Sales invoice", to: "/app/sales/new" },
  { label: "Payment received", to: "/app/payments/new" },
  { label: "Return", to: "/app/returns/new" },
  { label: "Purchase invoice", to: "/app/purchases/new" },
  { label: "Supplier pay", to: "/app/supplier-payments/new" },
  { label: "Expense", to: "/app/expenses/new" },
  { label: "Daily cash", to: "/app/daily-cash" },
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

function homeTabParam(search: string): string | null {
  return new URLSearchParams(search).get("tab");
}

/** Home tab — main hub without Customers/Inventory tab query. */
export function isHomeTabActive(pathname: string, search = ""): boolean {
  if (pathname.startsWith("/app/home/")) return true;
  if (pathname !== "/app/home") return false;
  const tab = homeTabParam(search);
  return tab !== "customers" && tab !== "stock";
}

export function isCustomersTabActive(pathname: string, search = ""): boolean {
  if (pathname.startsWith("/app/customers")) return true;
  return pathname === "/app/home" && homeTabParam(search) === "customers";
}

export function isInventoryTabActive(pathname: string, search = ""): boolean {
  if (pathname.startsWith("/app/stock") || pathname.startsWith("/app/products")) {
    return true;
  }
  return pathname === "/app/home" && homeTabParam(search) === "stock";
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
