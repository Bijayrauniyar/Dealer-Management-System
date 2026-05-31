import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PageShell } from "@/components/app/PageShell";
import { FormField } from "@/components/app/FormField";
import { StickyBar } from "@/components/app/StickyBar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/app/NumericInput";
import { numericMoneyProps } from "@/lib/money";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CAPITAL_CATEGORIES } from "@/domain/catalogs";
import type { CapitalEntry } from "@/domain/types";
import { commitCapitalEntry } from "@/store/domain";
import { npr, toDateInput } from "@/lib/utils";
import { PageBackLink } from "@/components/app/PageBackLink";

export const CapitalEntryPage = () => {
  const navigate = useNavigate();
  const [category, setCategory]       = useState<CapitalEntry["category"]>(CAPITAL_CATEGORIES[0].value);
  const [name, setName]               = useState("");
  const [amount, setAmount]           = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [date, setDate]               = useState(toDateInput());
  const [notes, setNotes]             = useState("");
  const [saving, setSaving]           = useState(false);

  const selectedCat = CAPITAL_CATEGORIES.find((c) => c.value === category)!;
  const isLoan      = category === "loan";

  const handleSave = async () => {
    if (!name) { toast.error("Enter a name for this entry."); return; }
    if (!amount || Number(amount) <= 0) { toast.error("Enter a valid amount."); return; }
    const amt = Number(amount);
    const book =
      category === "fixed_asset" && currentValue
        ? Number(currentValue)
        : amt;
    setSaving(true);
    try {
      await commitCapitalEntry({
        name: name.trim(),
        category: category as CapitalEntry["category"],
        date,
        amount: amt,
        currentValue: book,
        notes: notes.trim() || undefined,
      });
      toast.success("Capital entry saved.");
      navigate("/app/capital");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save entry.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell stickyBar>
      <PageBackLink className="flex items-center gap-1 text-sm font-medium text-teal-600" />
      <h1 className="mb-1 text-lg font-semibold">Add capital entry</h1>
      <p className="mb-5 text-sm text-muted">
        Money or assets invested in the business (freezer, vehicle, owner cash, loans, deposits). For daily running costs use Expense; for stock from suppliers use Purchase.
      </p>

      <div className="space-y-4">
        {/* ── Category ── */}
        <FormField label="Type" required>
          <Select value={category} onChange={(e) => setCategory(e.target.value as CapitalEntry["category"])}>
            {CAPITAL_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </Select>
        </FormField>

        {/* Category hint card */}
        <Card className="bg-info-light border-info/20">
          <CardContent className="px-4 py-2.5">
            <p className="text-xs text-info-foreground">
              <strong>{selectedCat.label}:</strong> {selectedCat.hint}
            </p>
            {isLoan && (
              <p className="mt-1 text-xs text-info-foreground/80">
                Loans are liabilities — they increase cash but must be repaid. They do <strong>not</strong> count as owner equity.
              </p>
            )}
          </CardContent>
        </Card>

        {/* ── Name ── */}
        <FormField label="Name / description" required>
          <Input
            placeholder={
              category === "fixed_asset"   ? "e.g. Deep freezer Haier 500L" :
              category === "inventory"     ? "e.g. Initial stock order May 2024" :
              category === "deposit"       ? "e.g. Supplier security deposit" :
              category === "owner_capital" ? "e.g. Owner capital injection" :
              "e.g. NMB bank business loan"
            }
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </FormField>

        {/* ── Amount ── */}
        <FormField
          label={isLoan ? "Loan amount (NPR)" : "Amount invested (NPR)"}
          required
          hint={isLoan ? "Full loan amount received" : "What you paid / invested"}
        >
          <NumericInput
            {...numericMoneyProps}
            min={0}
            value={Number(amount) || 0}
            onChange={(v) => setAmount(v === 0 ? "" : String(v))}
          />
        </FormField>

        {/* ── Current value (for fixed assets) ── */}
        {category === "fixed_asset" && (
          <FormField
            label="Current / book value (NPR)"
            hint="What it's worth today after use. Leave blank to use purchase price."
          >
            <NumericInput
              {...numericMoneyProps}
              min={0}
              value={Number(currentValue) || 0}
              onChange={(v) => setCurrentValue(v === 0 ? "" : String(v))}
            />
          </FormField>
        )}

        {/* ── Date ── */}
        <FormField label="Date of investment / purchase" required>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </FormField>

        {/* ── Notes ── */}
        <FormField label="Notes (optional)">
          <Textarea
            placeholder="e.g. 2 units, purchased from Kathmandu, 3-year warranty"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </FormField>

        {/* ── Preview ── */}
        {amount && name && (
          <Card className="border-teal-200 bg-teal-50/40">
            <CardContent className="px-4 py-3">
              <p className="text-xs text-muted mb-1">Preview</p>
              <p className="text-sm font-semibold text-foreground">{name}</p>
              <p className="text-xs text-muted">
                {selectedCat.label} · {isLoan ? "Liability" : "Asset / Capital"} · {date}
              </p>
              <p className="mt-1 text-base font-bold text-teal-700">{npr(Number(amount))}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <StickyBar
        action="Save entry"
        onAction={handleSave}
        loading={saving}
        disabled={!name || !amount}
      />
    </PageShell>
  );
};
