import type { ReactNode } from "react";
import { MarketingNav } from "@/pages/marketing/MarketingNav";
import { MarketingFooter } from "@/pages/marketing/MarketingFooter";

type Props = {
  children: ReactNode;
};

export function MarketingShell({ children }: Props) {
  return (
    <div className="marketing-site flex min-h-[100dvh] min-h-screen flex-col bg-slate-50/40 text-slate-900 antialiased">
      <MarketingNav />
      <main className="flex-1 w-full min-w-0 overflow-x-clip">{children}</main>
      <MarketingFooter />
    </div>
  );
}
