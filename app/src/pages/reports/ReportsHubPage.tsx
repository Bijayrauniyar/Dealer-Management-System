import { useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  BarChart2,
  BookOpen,
  ChevronRight,
  DollarSign,
  Download,
  LayoutDashboard,
  Lock,
} from "lucide-react";
import { PageShell } from "@/components/app/PageShell";

type HubItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  locked?: boolean;
};

const ITEMS: HubItem[] = [
  { label: "Dashboard", to: "/app/dashboard", icon: BarChart2, locked: true },
  { label: "Outstanding bills", to: "/app/home/outstanding", icon: BookOpen },
  { label: "Overdue customers", to: "/app/home/overdue", icon: AlertTriangle },
  { label: "Company overview", to: "/app/company", icon: LayoutDashboard },
  { label: "Capital entries", to: "/app/capital", icon: DollarSign },
  { label: "Supplier ledger", to: "/app/home/period/supplier-payable", icon: BookOpen },
  { label: "Export data", to: "/app/settings", icon: Download },
];

export const ReportsHubPage = () => {
  const navigate = useNavigate();

  return (
    <PageShell>
      <h1 className="mb-5 text-lg font-bold text-foreground">Reports</h1>
      <ul className="space-y-2">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.to + item.label}>
              <button
                type="button"
                onClick={() =>
                  navigate(
                    item.to,
                    item.label === "Export data" ? { state: { settingsTab: "export" } } : undefined,
                  )
                }
                className="flex w-full items-center gap-3 rounded-xl border border-border-subtle bg-white px-4 py-3.5 text-left shadow-card active:scale-[0.99] transition-transform"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100">
                  <Icon size={18} className="text-slate-600" />
                </div>
                <p className="flex min-w-0 flex-1 items-center gap-1.5 text-sm font-semibold text-foreground">
                  {item.label}
                  {item.locked && <Lock size={12} className="text-muted" />}
                </p>
                <ChevronRight size={16} className="shrink-0 text-muted" />
              </button>
            </li>
          );
        })}
      </ul>
      <div className="h-6" />
    </PageShell>
  );
};
