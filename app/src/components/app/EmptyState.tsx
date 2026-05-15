/**
 * EmptyState – shown when a list / section has no data.
 */
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Props = {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
  className?: string;
};

export const EmptyState = ({ icon, title, body, action, className }: Props) => (
  <div className={cn("flex flex-col items-center justify-center gap-3 py-12 text-center", className)}>
    {icon && <div className="text-muted-foreground">{icon}</div>}
    <div>
      <p className="font-medium text-foreground">{title}</p>
      {body && <p className="mt-1 text-sm text-muted">{body}</p>}
    </div>
    {action}
  </div>
);
