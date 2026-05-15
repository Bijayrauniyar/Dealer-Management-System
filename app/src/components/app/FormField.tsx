/**
 * FormField – a Label + Input/Select/Textarea combo.
 * Children are the control (Input, Select, Textarea, etc.)
 *
 * Usage:
 *   <FormField label="Customer" required>
 *     <EntityPicker ... />
 *   </FormField>
 */
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Props = {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
};

export const FormField = ({ label, required, hint, error, className, children }: Props) => (
  <div className={cn("space-y-1.5", className)}>
    <Label>
      {label}
      {required && <span className="ml-0.5 text-danger">*</span>}
    </Label>
    {children}
    {hint && !error && <p className="text-xs text-muted">{hint}</p>}
    {error && <p className="text-xs text-danger">{error}</p>}
  </div>
);
