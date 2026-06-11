import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  label?: string;
  className?: string;
  /** When set, navigates here instead of browser history. */
  to?: string;
};

export function PageBackLink({ label = "Back", className, to }: Props) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => (to ? navigate(to) : navigate(-1))}
      className={cn(
        "mb-4 flex items-center gap-1 text-sm font-medium text-teal-600",
        className,
      )}
    >
      <ArrowLeft size={16} />
      {label}
    </button>
  );
}
