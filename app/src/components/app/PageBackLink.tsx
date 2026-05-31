import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  label?: string;
  className?: string;
  /** Reserved for future; back uses history same as prior inline buttons. */
  fallbackTo?: string;
};

export function PageBackLink({ label = "Back", className }: Props) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(-1)}
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
