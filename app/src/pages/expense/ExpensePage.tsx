import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/app/PageShell";
import { FormField } from "@/components/app/FormField";
import { StickyBar } from "@/components/app/StickyBar";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EXPENSE_CATEGORIES } from "@/data/dummy";
import { commitExpenseEntry } from "@/store/domain";
import { isSupabaseConfigured } from "@/lib/supabase";
import { npr, toDateInput } from "@/lib/utils";

export const ExpensePage = () => {
  const navigate = useNavigate();
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount]     = useState("");
  const [date, setDate]         = useState(toDateInput());
  const [notes, setNotes]       = useState("");
  const [saving, setSaving]     = useState(false);

  const handleSave = async () => {
    if (!amount || Number(amount) <= 0) { toast.error("Enter a valid amount."); return; }
    setSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 200));
      if (isSupabaseConfigured) {
        await commitExpenseEntry({
          category,
          amount: Number(amount),
          notes: notes || undefined,
        });
      }
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
      <h1 className="mb-5 text-lg font-semibold">Expense entry</h1>
      <div className="space-y-4">
        <FormField label="Category" required>
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </Select>
        </FormField>
        <FormField label="Amount (NPR)" required>
          <Input type="number" min={0} placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </FormField>
        <FormField label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></FormField>
        <FormField label="Notes"><Textarea placeholder="Details" value={notes} onChange={(e) => setNotes(e.target.value)} /></FormField>
      </div>
      <StickyBar rows={amount ? [["Amount", npr(Number(amount))]] : undefined} action="Save expense" onAction={handleSave} loading={saving} />
    </PageShell>
  );
};
