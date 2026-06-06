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
  TrendingUp,
} from "lucide-react";
import { PageShell } from "@/components/app/PageShell";
import { SectionHeader } from "@/components/app/SectionHeader";

type HubItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  settingsTab?: string;
};

type HubSection = {
  title: string;
  items: HubItem[];
};

const SECTIONS: HubSection[] = [
  {
    title: "Today & period",
    items: [
      { label: "Period summary", to: "/app/dashboard", icon: BarChart2 },
      { label: "Today sales", to: "/app/home/period/today-sales", icon: TrendingUp },
      { label: "Today collection", to: "/app/home/period/today-collection", icon: DollarSign },
    ],
  },
  {
    title: "Receivables",
    items: [
      { label: "Outstanding bills", to: "/app/home/outstanding", icon: BookOpen },
      { label: "Overdue customers", to: "/app/home/overdue", icon: AlertTriangle },
    ],
  },
  {
    title: "Payables",
    items: [
      { label: "Supplier ledger", to: "/app/home/period/supplier-payable", icon: BookOpen },
    ],
  },
  {
    title: "Business position",
    items: [
      { label: "Company overview", to: "/app/company", icon: LayoutDashboard },
    ],
  },
  {
    title: "Owner & assets",
    items: [
      { label: "Capital entries", to: "/app/capital", icon: DollarSign },
    ],
  },
  {
    title: "Data",
    items: [
      { label: "Export data", to: "/app/settings", icon: Download, settingsTab: "data" },
    ],
  },
];

export const ReportsHubPage = () => {
  const navigate = useNavigate();

  return (
    <PageShell>
      <h1 className="mb-5 text-lg font-bold text-foreground">Reports</h1>
      <div className="space-y-6">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <SectionHeader title={section.title} className="mb-2" />
            <ul className="space-y-2">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.to + item.label}>
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          item.to,
                          item.settingsTab
                            ? { state: { settingsTab: item.settingsTab } }
                            : undefined,
                        )
                      }
                      className="flex w-full items-center gap-3 rounded-xl border border-border-subtle bg-white px-4 py-3.5 text-left shadow-card active:scale-[0.99] transition-transform"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100">
                        <Icon size={18} className="text-slate-600" />
                      </div>
                      <p className="min-w-0 flex-1 text-sm font-semibold text-foreground">
                        {item.label}
                      </p>
                      <ChevronRight size={16} className="shrink-0 text-muted" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      <div className="h-6" />
    </PageShell>
  );
};
