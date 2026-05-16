import { useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  CreditCard,
  RotateCcw,
  AlertTriangle,
  Package,
  Truck,
  DollarSign,
  Calculator,
  Tag,
  LayoutDashboard,
  Users,
  Box,
  BookOpen,
  Settings,
  LogOut,
  BarChart2,
  Lock,
} from "lucide-react";
import { PageShell } from "@/components/app/PageShell";
import { useAuth } from "@/lib/auth";

type NavItem = {
  label: string;
  icon: React.FC<{ size?: number; className?: string }>;
  to: string;
  badge?: string;
  color?: string;
};

const GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "New entry",
    items: [
      { label: "New bill", icon: ShoppingCart, to: "/app/sales/new", color: "bg-teal-100 text-teal-700" },
      { label: "Payment in", icon: CreditCard, to: "/app/payments/new", color: "bg-green-100 text-green-700" },
      { label: "Return", icon: RotateCcw, to: "/app/returns/new", color: "bg-amber-100 text-amber-700" },
      { label: "Damage", icon: AlertTriangle, to: "/app/damages/new", color: "bg-red-100 text-red-600" },
      { label: "Purchase", icon: Package, to: "/app/purchases/new", color: "bg-blue-100 text-blue-700" },
      { label: "Supplier pay", icon: Truck, to: "/app/supplier-payments/new", color: "bg-purple-100 text-purple-700" },
      { label: "Expense", icon: DollarSign, to: "/app/expenses/new", color: "bg-orange-100 text-orange-700" },
      { label: "Daily cash", icon: Calculator, to: "/app/daily-cash", color: "bg-slate-100 text-slate-600" },
      { label: "Scheme", icon: Tag, to: "/app/schemes/new", color: "bg-pink-100 text-pink-700" },
    ],
  },
  {
    title: "Masters",
    items: [
      { label: "Products", icon: LayoutDashboard, to: "/app/products", color: "bg-teal-100 text-teal-700" },
      { label: "Customers", icon: Users, to: "/app/customers", color: "bg-blue-100 text-blue-700" },
      { label: "Suppliers", icon: Truck, to: "/app/suppliers", color: "bg-purple-100 text-purple-700" },
      { label: "Stock", icon: Box, to: "/app/stock", color: "bg-orange-100 text-orange-700" },
    ],
  },
  {
    title: "Reports (private)",
    items: [
      { label: "Dashboard", icon: BarChart2, to: "/app/dashboard", color: "bg-red-100 text-red-600", badge: "🔒" },
      { label: "Company overview", icon: LayoutDashboard, to: "/app/company", color: "bg-indigo-100 text-indigo-700" },
      { label: "Capital entries", icon: DollarSign, to: "/app/capital", color: "bg-green-100 text-green-700" },
      { label: "Supplier ledger", icon: BookOpen, to: "/app/home/period/supplier-payable", color: "bg-slate-100 text-slate-600" },
    ],
  },
  {
    title: "App",
    items: [
      { label: "Settings", icon: Settings, to: "/app/settings", color: "bg-slate-100 text-slate-600" },
      { label: "Sign out", icon: LogOut, to: "/login", color: "bg-red-100 text-red-500" },
    ],
  },
];

function MoreGrid({ onItemClick }: { onItemClick: (item: NavItem) => void }) {
  return (
    <div className="space-y-6">
      {GROUPS.map((group) => (
        <div key={group.title}>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted">{group.title}</p>
          <div className="grid grid-cols-3 gap-3">
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label === "Sign out" ? "sign-out" : item.to}
                  type="button"
                  onClick={() => onItemClick(item)}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-border-subtle bg-white p-4 text-center shadow-sm hover:shadow-md active:scale-95 transition-all"
                >
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.color ?? "bg-slate-100 text-slate-600"}`}
                  >
                    <Icon size={20} />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold leading-tight text-foreground">{item.label}</span>
                    {item.badge === "🔒" && <Lock size={10} className="shrink-0 text-muted" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export const MorePage = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const onItemClick = (item: NavItem) => {
    if (item.label === "Sign out") {
      void signOut().then(() => navigate("/login", { replace: true }));
      return;
    }
    navigate(item.to);
  };

  return (
    <PageShell>
      <h1 className="mb-5 text-lg font-bold text-foreground">More</h1>
      <MoreGrid onItemClick={onItemClick} />
      <div className="h-8" />
    </PageShell>
  );
};
