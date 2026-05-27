import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/app/PageShell";
import { FormField } from "@/components/app/FormField";
import { StickyBar } from "@/components/app/StickyBar";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/app/NumericInput";
import { numericMoneyProps } from "@/lib/money";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EXPENSE_CATEGORIES } from "@/domain/catalogs";
import { commitExpenseEntry } from "@/store/domain";
import { npr, toDateInput } from "@/lib/utils";

type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const ExpensePage = () => {
  const navigate = useNavigate();
  const [category, setCategory] = useState<ExpenseCategory>(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount]     = useState("");
  const [date, setDate]         = useState(toDateInput());
  const [notes, setNotes]       = useState("");
  const [saving, setSaving]     = useState(false);

  const handleSave = async () => {
    if (!amount || Number(amount) <= 0) { toast.error("Enter a valid amount."); return; }
    setSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 200));
      await commitExpenseEntry({
        category,
        amount: Number(amount),
        date,
        notes: notes || undefined,
      });
      toast.success("Expense saved.");
      navigate("/app/home");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell stickyBar>
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm font-medium text-teal-600">
        <ArrowLeft size={16} /> Back
      </button>
      <h1 className="mb-1 text-lg font-semibold">Expense entry</h1>
      <p className="mb-5 text-sm text-muted">
        Day-to-day running costs (fuel, salary, rent, utilities). Not for buying assets or owner investment — use Capital for those.
      </p>
      <div className="space-y-4">
        <FormField label="Category" required>
          <Select value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
            {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </Select>
        </FormField>
        <FormField label="Amount (NPR)" required>
          <NumericInput
            {...numericMoneyProps}
            min={0}
            value={Number(amount) || 0}
            onChange={(v) => setAmount(v === 0 ? "" : String(v))}
          />
        </FormField>
        <FormField label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></FormField>
        <FormField label="Notes"><Textarea placeholder="Details" value={notes} onChange={(e) => setNotes(e.target.value)} /></FormField>
      </div>
      <StickyBar rows={amount ? [["Amount", npr(Number(amount))]] : undefined} action="Save expense" onAction={handleSave} loading={saving} />
    </PageShell>
  );
};
