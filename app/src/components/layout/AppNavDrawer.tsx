import { X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  filterDrawerGroups,
  NAV_DRAWER_GROUPS,
  type NavLinkItem,
} from "@/config/appNavigation";
import { PRODUCT_DISPLAY_NAME } from "@/config/productBrand";

type Props = {
  open: boolean;
  onClose: () => void;
  allowStockAdjustment: boolean;
};

export function AppNavDrawer({ open, onClose, allowStockAdjustment }: Props) {
  const navigate = useNavigate();
  const groups = filterDrawerGroups(NAV_DRAWER_GROUPS, allowStockAdjustment);

  const go = (item: NavLinkItem) => {
    onClose();
    navigate(item.to);
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40"
        aria-hidden
        onClick={onClose}
      />
      <aside
        className="fixed inset-y-0 left-0 z-50 flex w-[min(100%,280px)] flex-col border-r border-border-subtle bg-white shadow-card-md"
        role="dialog"
        aria-label="Main menu"
      >
        <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
          <div>
            <p className="text-sm font-bold text-foreground">{PRODUCT_DISPLAY_NAME}</p>
            <p className="text-xs text-muted">Menu</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 hover:bg-slate-100"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {groups.map((group) => (
            <div key={group.id} className="mb-5 last:mb-0">
              <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wider text-muted">
                {group.title}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.to + item.label}>
                      <button
                        type="button"
                        onClick={() => go(item)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-foreground",
                          "hover:bg-teal-50 active:bg-teal-100 transition-colors",
                        )}
                      >
                        <Icon size={18} className="shrink-0 text-teal-600" />
                        {item.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="border-t border-border-subtle px-4 py-3 text-xs text-muted">
          <Link to="/app/settings" onClick={onClose} className="font-semibold text-teal-600">
            Settings
          </Link>
        </div>
      </aside>
    </>
  );
}
