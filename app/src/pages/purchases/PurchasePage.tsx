import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/app/PageShell";
import { FormField } from "@/components/app/FormField";
import { EntityPicker } from "@/components/app/EntityPicker";
import { StickyBar } from "@/components/app/StickyBar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSuppliers, useProducts, commitPurchase } from "@/store/domain";
import { npr, nprNum, toDateInput } from "@/lib/utils";

type Line = {
  id: number;
  productId: string;
  productName: string;
  uom: string;
  invoiceQty: number;
  receivedQty: number;   // may differ from invoiceQty → short receive
  cost: number;
};

const mkLine = (): Line => ({
  id: Date.now(),
  productId: "", productName: "", uom: "",
  invoiceQty: 1, receivedQty: 1, cost: 0,
});

export const PurchasePage = () => {
  const navigate  = useNavigate();
  const SUPPLIERS = useSuppliers();
  const PRODUCTS  = useProducts();
  const [supplierId, setSupplierId] = useState("");
  const [invoiceNo, setInvoiceNo]   = useState("");
  const [date, setDate]             = useState(toDateInput());
  const [dueDate, setDueDate]       = useState("");
  const [lines, setLines]           = useState<Line[]>([mkLine()]);
  const [saving, setSaving]         = useState(false);

  const totalInvoiced  = lines.reduce((s, l) => s + l.invoiceQty * l.cost, 0);
  const totalReceived  = lines.reduce((s, l) => s + l.receivedQty * l.cost, 0);
  const shortLines     = lines.filter((l) => l.receivedQty < l.invoiceQty && l.productId);
  const hasShort       = shortLines.length > 0;

  const addLine    = () => setLines((ls) => [...ls, mkLine()]);
  const removeLine = (id: number) => setLines((ls) => ls.filter((l) => l.id !== id));
  const updateLine = (id: number, patch: Partial<Line>) =>
    setLines((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const handleSave = async () => {
    if (!supplierId) { toast.error("Choose a supplier."); return; }
    if (lines.some((l) => !l.productId)) { toast.error("Every row needs a product."); return; }
    setSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 200));
      await commitPurchase({
        supplierId,
        totalReceived,
        lines: lines.filter((l) => l.productId).map((l) => ({
          productId:   l.productId,
          receivedQty: l.receivedQty,
          cost:        l.cost,
        })),
      });
      toast.success(hasShort
        ? `Purchase saved. Stock updated. ${shortLines.length} short-receive item(s) recorded.`
        : "Purchase saved. Stock updated.",
      );
      navigate(-1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Purchase failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell stickyBar>
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm font-medium text-teal-600">
        <ArrowLeft size={16} /> Back
      </button>
      <h1 className="mb-5 text-lg font-semibold">Purchase entry</h1>

      <div className="space-y-4">
        <FormField label="Supplier" required>
          <EntityPicker
            placeholder="Search supplier"
            options={SUPPLIERS.map((s) => ({ id: s.id, label: s.name }))}
            value={supplierId}
            onChange={(id) => setSupplierId(id)}
            onClear={() => setSupplierId("")}
            entityLabel="supplier"
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Invoice no.">
            <Input placeholder="INV-001" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
          </FormField>
          <FormField label="Invoice date">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </FormField>
          <FormField label="Due date (if credit)" className="col-span-2">
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </FormField>
        </div>

        {/* ── Line items ── */}
        <div>
          <p className="mb-1 text-sm font-medium">Items</p>
          <p className="mb-3 text-xs text-muted">
            Enter both <strong>Invoice qty</strong> and <strong>Received qty</strong>. If something wasn't delivered,
            set received qty lower — it gets tracked as a short receive and deducted on the next invoice.
          </p>
          <div className="space-y-3">
            {lines.map((line) => {
              const short = line.invoiceQty - line.receivedQty;
              const isShort = short > 0 && line.productId;
              return (
                <Card key={line.id} className={isShort ? "border-warning" : ""}>
                  <CardContent className="space-y-3 p-3">
                    <EntityPicker
                      placeholder="Search product"
                      options={PRODUCTS.map((p) => ({
                        id: p.id,
                        label: p.name,
                        sub: `${p.uom} · cost ≈ ${npr(p.costPrice)}`,
                      }))}
                      value={line.productId}
                      onChange={(id, opt) => {
                        const p = PRODUCTS.find((x) => x.id === id);
                        updateLine(line.id, {
                          productId: id,
                          productName: opt.label,
                          uom: p?.uom ?? "",
                          cost: p?.costPrice ?? 0,
                        });
                      }}
                      onClear={() => updateLine(line.id, { productId: "", productName: "", uom: "", cost: 0 })}
                      entityLabel="product"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <FormField
                        label="Invoice qty"
                        hint={line.uom ? line.uom : undefined}
                      >
                        <Input
                          type="number"
                          min={0}
                          value={line.invoiceQty}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            updateLine(line.id, {
                              invoiceQty: v,
                              // auto-cap received to invoice qty if user hasn't changed it
                              receivedQty: line.receivedQty > v ? v : line.receivedQty,
                            });
                          }}
                        />
                      </FormField>
                      <FormField
                        label="Received qty"
                        hint={line.uom ? line.uom : undefined}
                      >
                        <Input
                          type="number"
                          min={0}
                          max={line.invoiceQty}
                          value={line.receivedQty}
                          onChange={(e) => updateLine(line.id, { receivedQty: Math.min(Number(e.target.value), line.invoiceQty) })}
                          className={isShort ? "border-warning focus:ring-warning" : ""}
                        />
                      </FormField>
                    </div>

                    {/* Short-receive alert */}
                    {isShort && (
                      <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                        <AlertCircle size={14} className="mt-0.5 shrink-0 text-warning" />
                        <p className="text-xs text-warning-foreground">
                          <strong>{short} {line.uom || "units"} short.</strong>{" "}
                          This will be recorded as a short receive against {invoiceNo || "this invoice"}.
                          Deduct from next invoice or raise a claim.
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-2">
                      <FormField label="Cost / unit (NPR)">
                        <Input type="number" min={0} value={line.cost} onChange={(e) => updateLine(line.id, { cost: Number(e.target.value) })} />
                      </FormField>
                      <FormField label="Invoiced (NPR)">
                        <div className="flex h-11 items-center rounded-lg bg-slate-50 px-3 text-sm">
                          {nprNum(line.invoiceQty * line.cost)}
                        </div>
                      </FormField>
                      <FormField label="Received (NPR)">
                        <div className={`flex h-11 items-center rounded-lg px-3 text-sm font-medium ${isShort ? "bg-amber-50 text-warning-foreground" : "bg-slate-50"}`}>
                          {nprNum(line.receivedQty * line.cost)}
                        </div>
                      </FormField>
                    </div>

                    {lines.length > 1 && (
                      <button onClick={() => removeLine(line.id)} className="flex items-center gap-1 text-xs text-danger">
                        <Trash2 size={12} /> Remove
                      </button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <Button variant="ghost" size="sm" className="mt-2" onClick={addLine}>
            <Plus size={14} /> Add item
          </Button>
        </div>

        {/* ── Short-receive summary ── */}
        {hasShort && (
          <Card className="border-warning">
            <CardContent className="p-3">
              <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-warning-foreground">
                <AlertCircle size={14} /> Short receive summary
              </p>
              <div className="space-y-1.5">
                {shortLines.map((l) => (
                  <div key={l.id} className="flex items-center justify-between">
                    <span className="text-xs text-foreground">{l.productName || "—"}</span>
                    <Badge variant="warning" className="text-[10px]">
                      {l.invoiceQty - l.receivedQty} {l.uom} short
                    </Badge>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted">
                Short receives are saved against this invoice. You can deduct them on the supplier's next invoice or raise a claim.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <StickyBar
        rows={[
          ["Invoiced total",  npr(totalInvoiced)],
          ...(hasShort ? [["Received total", npr(totalReceived)] as [string, string]] : []),
          ...(hasShort ? [["Short (not received)", `−${npr(totalInvoiced - totalReceived)}`] as [string, string]] : []),
        ]}
        action="Save purchase"
        onAction={handleSave}
        loading={saving}
      />
    </PageShell>
  );
};
