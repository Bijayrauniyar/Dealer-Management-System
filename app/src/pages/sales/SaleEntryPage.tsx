import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Eye, X } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/app/PageShell";
import { FormField } from "@/components/app/FormField";
import { EntityPicker } from "@/components/app/EntityPicker";
import { StickyBar } from "@/components/app/StickyBar";
import { BillPrintView } from "@/components/app/BillPrintView";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PAYMENT_MODES } from "@/data/dummy";
import { useProducts, useCustomers, useSaleByBill, commitSale, useNextBillNo } from "@/store/domain";
import { isSupabaseConfigured } from "@/lib/supabase";
import { npr, nprNum, toDateInput } from "@/lib/utils";

type Line = {
  id: number;
  productId: string;
  productName: string;
  uom: string;
  qty: number;
  mrp: number;
  rate: number;          // sell price excl. VAT — editable
  discountPct: number;   // product-level standard discount %
  vatApplicable: boolean;// whether 13% VAT applies to this product
};

export const SaleEntryPage = () => {
  const navigate        = useNavigate();
  const [searchParams]  = useSearchParams();
  const { billNo: editBillNo } = useParams<{ billNo?: string }>();

  // Reactive store data
  const CUSTOMERS = useCustomers();
  const PRODUCTS  = useProducts();
  const existing  = useSaleByBill(editBillNo ?? "");
  const isEdit    = Boolean(existing);

  // Pre-selected customer from query param (e.g. from CustomerDetailPage → "New bill")
  const prefilledCustomerId = searchParams.get("customerId") ?? "";

  // Bill header — bill number is auto-generated for new bills
  const [customerId, setCustomerId] = useState(existing?.customerId ?? prefilledCustomerId);
  const billNo = useNextBillNo(isEdit, existing?.billNo);
  const [billDate, setBillDate]     = useState(existing?.date ?? toDateInput());

  // Line items — pre-fill from existing sale in edit mode
  const [lines, setLines] = useState<Line[]>(
    existing?.lines.map((l, i) => {
      const prod = PRODUCTS.find((p) => p.id === l.productId);
      return {
        id: i + 1,
        productId:     l.productId,
        productName:   l.productName,
        uom:           l.uom ?? "PCS",
        qty:           l.qty,
        mrp:           l.mrp ?? 0,
        rate:          l.rate,
        discountPct:   prod?.discountPct  ?? 0,
        vatApplicable: prod?.vatApplicable ?? false,
      };
    }) ?? [{ id: 1, productId: "", productName: "", uom: "PCS", qty: 1, mrp: 0, rate: 0, discountPct: 0, vatApplicable: false }],
  );

  // Discount — pre-fill from existing
  const [discountType, setDiscountType] = useState<"percent" | "flat">(
    existing?.discountType === "percent" ? "percent" : "flat",
  );
  const [discountValue, setDiscountValue] = useState(
    existing?.discountValue ? String(existing.discountValue) : "",
  );

  // Add. Bill Terms
  const [billTerms,    setBillTerms]    = useState(existing?.billTerms       ?? "");
  const [billTermsAmt, setBillTermsAmt] = useState(
    existing?.billTermsAmount ? String(existing.billTermsAmount) : "",
  );

  // VAT
  const [vatEnabled, setVatEnabled] = useState((existing?.vatRate ?? 0) > 0);
  const VAT_RATE = 13;

  // Payment at time of billing
  const [paidNow, setPaidNow] = useState(
    existing?.paidNow ? String(existing.paidNow) : "",
  );
  const [payMode, setPayMode] = useState("Cash");
  const [payRef,  setPayRef]  = useState("");
  const [dueDate, setDueDate] = useState(existing?.dueDate ?? "");

  const [notes, setNotes]     = useState(existing?.notes ?? "");
  const [saving, setSaving]   = useState(false);
  const [previewing, setPrev] = useState(false);

  // Live edit: sales load after first paint — sync form when bill appears in bundle
  useEffect(() => {
    if (!existing || !editBillNo) return;
    setCustomerId(existing.customerId);
    setBillDate(existing.date);
    setLines(
      existing.lines.map((l, i) => {
        const prod = PRODUCTS.find((p) => p.id === l.productId);
        return {
          id: i + 1,
          productId: l.productId,
          productName: l.productName,
          uom: l.uom ?? "PCS",
          qty: l.qty,
          mrp: l.mrp ?? 0,
          rate: l.rate,
          discountPct: prod?.discountPct ?? 0,
          vatApplicable: prod?.vatApplicable ?? false,
        };
      }),
    );
    setDiscountType(existing.discountType === "percent" ? "percent" : "flat");
    setDiscountValue(existing.discountValue ? String(existing.discountValue) : "");
    setBillTerms(existing.billTerms ?? "");
    setBillTermsAmt(existing.billTermsAmount ? String(existing.billTermsAmount) : "");
    setVatEnabled((existing.vatRate ?? 0) > 0);
    setPaidNow(existing.paidNow ? String(existing.paidNow) : "");
    setDueDate(existing.dueDate ?? "");
    setNotes(existing.notes ?? "");
  }, [existing, editBillNo, PRODUCTS]);

  // ── Derived totals ──────────────────────────────────────────────────
  const lineAmount = (l: Line) => Math.round(l.qty * l.rate * (1 - (l.discountPct ?? 0) / 100));
  const subtotal   = lines.reduce((s, l) => s + lineAmount(l), 0);

  const discountAmt = (() => {
    const v = Number(discountValue) || 0;
    if (discountType === "percent") return Math.round((subtotal * v) / 100);
    return Math.min(v, subtotal);
  })();

  const afterDiscount  = subtotal - discountAmt;
  const termsAmt       = Number(billTermsAmt) || 0;
  const taxBase        = afterDiscount + termsAmt;
  const vatAmt         = vatEnabled ? Math.round(taxBase * VAT_RATE / 100) : 0;
  const grandTotal     = taxBase + vatAmt;
  const paidAmt        = Math.min(Number(paidNow) || 0, grandTotal);
  const balanceDue     = grandTotal - paidAmt;

  // ── Line helpers ────────────────────────────────────────────────────
  const addLine    = () => setLines((ls) => [...ls, { id: Date.now(), productId: "", productName: "", uom: "PCS", qty: 1, mrp: 0, rate: 0, discountPct: 0, vatApplicable: false }]);
  const removeLine = (id: number) => setLines((ls) => ls.filter((l) => l.id !== id));
  const updateLine = (id: number, patch: Partial<Line>) =>
    setLines((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  // ── Save ────────────────────────────────────────────────────────────
  const validate = () => {
    if (!customerId) { toast.error("Choose a customer."); return false; }
    if (lines.every((l) => !l.productId)) { toast.error("Add at least one item."); return false; }
    if (balanceDue > 0 && !dueDate) { toast.error("Set a due date for the outstanding balance."); return false; }
    if (isSupabaseConfigured && !isEdit && !billNo) {
      toast.error("Bill number is loading — try again in a moment.");
      return false;
    }
    return true;
  };

  const savedBillNo = billNo;

  const customer = CUSTOMERS.find((c) => c.id === customerId);

  // Build a Sale object from current form state so BillDetailPage can render
  // it immediately without needing it to exist in the static SALES_BY_BILL map.
  const buildSale = () => ({
    id:              savedBillNo,
    billNo:          savedBillNo,
    date:            billDate,
    customerId,
    customerName:    customer?.name ?? "",
    lines:           lines.filter((l) => l.productId).map((l) => ({
      productId:   l.productId,
      productName: l.productName,
      uom:         l.uom,
      qty:         l.qty,
      mrp:         l.mrp,
      rate:        l.rate,
      discountPct: l.discountPct ?? 0,
      amount:      lineAmount(l),
    })),
    subtotal,
    discountType:    discountValue ? discountType : "none" as const,
    discountValue:   Number(discountValue) || 0,
    discountAmount:  discountAmt,
    afterDiscount,
    billTerms:       billTerms || "",
    billTermsAmount: termsAmt,
    vatRate:         vatEnabled ? 13 : 0,
    vatAmount:       vatAmt,
    grandTotal,
    paidNow:         paidAmt,
    paymentMode:     payMode,
    balance:         balanceDue,
    dueDate:         dueDate || "",
    notes:           notes || "",
    total:           grandTotal,
  });

  const handleSave = async () => {
    if (!validate()) return;
    if (isSupabaseConfigured && isEdit) {
      toast.error("Editing an existing server bill is not supported yet. Create a new bill.");
      return;
    }
    setSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 200));
      const sale = buildSale();
      const finalBillNo = await commitSale(sale);
      toast.success(
        isEdit
          ? `Bill ${finalBillNo} updated`
          : `Bill ${finalBillNo} saved · ${npr(grandTotal)}${balanceDue > 0 ? ` · ${npr(balanceDue)} due` : " · Fully paid"}`,
      );
      navigate(`/app/bills/${finalBillNo}`, { state: { sale: { ...sale, billNo: finalBillNo } } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save bill");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndPrint = async () => {
    if (!validate()) return;
    if (isSupabaseConfigured && isEdit) {
      toast.error("Editing an existing server bill is not supported yet.");
      return;
    }
    setSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 200));
      const sale = buildSale();
      const finalBillNo = await commitSale(sale);
      toast.success(isEdit ? "Bill updated — opening print view…" : "Bill saved — opening print view…");
      navigate(`/app/bills/${finalBillNo}?print=1`, { state: { sale: { ...sale, billNo: finalBillNo } } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save bill");
    } finally {
      setSaving(false);
    }
  };

  const customerOptions = CUSTOMERS.map((c) => ({ id: c.id, label: c.name, sub: c.area }));
  const productOptions  = PRODUCTS.map((p)  => ({ id: p.id, label: p.name, sub: `NPR ${p.sellingPrice}` }));

  return (
    <PageShell stickyBar>
      {/* ── Preview modal ── */}
      {previewing && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/60 backdrop-blur-sm">
          <div className="flex items-center justify-between bg-white px-4 py-3 shadow-sm shrink-0">
            <p className="text-sm font-semibold text-foreground">Bill preview</p>
            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1 rounded-lg border border-border-subtle px-3 py-1.5 text-xs font-medium text-muted"
              >
                Print
              </button>
              <button
                onClick={() => setPrev(false)}
                className="flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white"
              >
                <X size={13} /> Close
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <BillPrintView sale={buildSale()} customer={customer} isPreview />
          </div>
        </div>
      )}

      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm font-medium text-teal-600">
        <ArrowLeft size={16} /> Back
      </button>
      <h1 className="mb-5 text-lg font-semibold">
        {isEdit ? `Edit bill ${editBillNo}` : "New sale"}
      </h1>

      <div className="space-y-4">
        {/* ── Bill header ── */}
        <FormField label="Customer" required>
          <EntityPicker
            placeholder="Search customers"
            options={customerOptions}
            value={customerId}
            onChange={(id) => setCustomerId(id)}
            onClear={() => setCustomerId("")}
            entityLabel="customer"
            onCreateNew={() => navigate("/app/customers/new")}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Bill no." hint="Auto-generated">
            <div className="flex h-11 items-center rounded-lg border border-border-subtle bg-slate-50 px-3 text-sm font-semibold tracking-wide text-teal-700">
              {billNo}
            </div>
          </FormField>
          <FormField label="Date">
            <Input type="date" value={billDate} onChange={(e) => setBillDate(e.target.value)} />
          </FormField>
        </div>

        {/* ── Line items ── */}
        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Items</p>
          <div className="space-y-3">
            {lines.map((line) => (
              <Card key={line.id}>
                <CardContent className="space-y-3 p-3">
                  <EntityPicker
                    placeholder="Search product"
                    options={productOptions}
                    value={line.productId}
                    onChange={(id, opt) => {
                      const product = PRODUCTS.find((p) => p.id === id);
                      updateLine(line.id, {
                        productId:     id,
                        productName:   opt.label,
                        uom:           product?.uom           ?? "PCS",
                        mrp:           product?.mrp           ?? 0,
                        rate:          product?.sellingPrice  ?? 0,
                        discountPct:   product?.discountPct   ?? 0,
                        vatApplicable: product?.vatApplicable ?? false,
                      });
                    }}
                    onClear={() => updateLine(line.id, { productId: "", productName: "", uom: "PCS", mrp: 0, rate: 0, discountPct: 0, vatApplicable: false })}
                    entityLabel="product"
                  />
                  {/* ── Pricing reference strip (shown once a product is selected) ── */}
                  {line.productId && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1 rounded-lg bg-teal-50 border border-teal-100 px-3 py-2 text-[11px]">
                      {line.mrp > 0 && (
                        <span className="text-gray-500">
                          MRP <strong className="text-gray-700">{nprNum(line.mrp)}</strong>
                        </span>
                      )}
                      <span className="text-gray-500">
                        Sell excl. VAT <strong className="text-teal-700">{nprNum(line.rate)}</strong>
                      </span>
                      {line.vatApplicable && (
                        <span className="text-gray-500">
                          Sell incl. VAT <strong className="text-teal-700">
                            {nprNum(Math.round(line.rate * 1.13))}
                          </strong>
                          <span className="ml-0.5 text-teal-500">(+13% VAT)</span>
                        </span>
                      )}
                      {line.discountPct > 0 ? (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-700">
                          {line.discountPct}% product discount
                        </span>
                      ) : (
                        <span className="text-gray-400">No product discount</span>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-4 gap-2">
                    <FormField label="UOM">
                      <Input value={line.uom} onChange={(e) => updateLine(line.id, { uom: e.target.value })}
                        placeholder="PCS" />
                    </FormField>
                    <FormField label="Qty">
                      <Input type="number" min={1} value={line.qty}
                        onChange={(e) => updateLine(line.id, { qty: Math.max(1, Number(e.target.value)) })} />
                    </FormField>
                    <FormField label="Rate (NPR)">
                      <Input type="number" min={0} value={line.rate}
                        onChange={(e) => updateLine(line.id, { rate: Number(e.target.value) })} />
                    </FormField>
                    <FormField label="Amount">
                      <div className="flex h-11 flex-col justify-center rounded-lg bg-slate-50 px-3">
                        <span className="text-sm font-medium">{nprNum(lineAmount(line))}</span>
                        {(line.discountPct ?? 0) > 0 && (
                          <span className="text-[10px] text-amber-600 leading-tight">
                            after {line.discountPct}% disc
                          </span>
                        )}
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
            ))}
          </div>
          <Button variant="ghost" size="sm" className="mt-2" onClick={addLine}>
            <Plus size={14} /> Add item
          </Button>
        </div>

        {/* ── Discount ── */}
        <Card>
          <CardContent className="space-y-3 p-4">
            <p className="text-sm font-medium text-foreground">Discount (optional)</p>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Type">
                <Select value={discountType} onChange={(e) => setDiscountType(e.target.value as "percent" | "flat")}>
                  <option value="flat">Flat (NPR)</option>
                  <option value="percent">Percent (%)</option>
                </Select>
              </FormField>
              <FormField label={discountType === "percent" ? "Discount %" : "Discount (NPR)"}>
                <Input
                  type="number" min={0}
                  max={discountType === "percent" ? 100 : subtotal}
                  placeholder="0"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                />
              </FormField>
            </div>
            {discountAmt > 0 && (
              <p className="text-xs text-success-foreground">
                {discountType === "percent"
                  ? `${discountValue}% discount → − ${npr(discountAmt)} off ${npr(subtotal)}`
                  : `Flat discount → − ${npr(discountAmt)} off ${npr(subtotal)}`}
              </p>
            )}
          </CardContent>
        </Card>

        {/* ── Add. Bill Terms ── */}
        <Card>
          <CardContent className="space-y-3 p-4">
            <p className="text-sm font-medium text-foreground">Add. Bill Terms (optional)</p>
            <p className="text-xs text-muted">Extra charges added to bill — transport, loading, etc.</p>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Label (e.g. Transport)">
                <Input placeholder="Leave blank if none" value={billTerms}
                  onChange={(e) => setBillTerms(e.target.value)} />
              </FormField>
              <FormField label="Amount (NPR)">
                <Input type="number" min={0} placeholder="0" value={billTermsAmt}
                  onChange={(e) => setBillTermsAmt(e.target.value)} />
              </FormField>
            </div>
          </CardContent>
        </Card>

        {/* ── VAT ── */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">VAT (13%)</p>
                <p className="text-xs text-muted">
                  {vatEnabled
                    ? `VAT amount: ${npr(vatAmt)} on taxable base ${npr(taxBase)}`
                    : "Enable if customer requires a VAT bill"}
                </p>
              </div>
              <button
                onClick={() => setVatEnabled((v) => !v)}
                className={`relative h-6 w-11 rounded-full transition-colors ${vatEnabled ? "bg-teal-600" : "bg-gray-200"}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${vatEnabled ? "left-5.5 translate-x-0.5" : "left-0.5"}`} />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* ── Payment now ── */}
        <Card>
          <CardContent className="space-y-3 p-4">
            <p className="text-sm font-medium text-foreground">Payment received now</p>
            <FormField label="Amount received (NPR)" hint={`Grand total: ${npr(grandTotal)}`}>
              <Input
                type="number" min={0} max={grandTotal}
                placeholder="0 = fully on credit"
                value={paidNow}
                onChange={(e) => setPaidNow(e.target.value)}
              />
            </FormField>
            {paidAmt > 0 && (
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Mode">
                  <Select value={payMode} onChange={(e) => setPayMode(e.target.value)}>
                    {PAYMENT_MODES.map((m) => <option key={m}>{m}</option>)}
                  </Select>
                </FormField>
                <FormField label="Reference (optional)">
                  <Input placeholder="UTR / cheque no." value={payRef} onChange={(e) => setPayRef(e.target.value)} />
                </FormField>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Balance due ── */}
        {balanceDue > 0 && (
          <Card className="border-warning/30 bg-warning-light">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-warning-foreground">Balance due</p>
                <Badge variant="warning">{npr(balanceDue)}</Badge>
              </div>
              <FormField label="Due date" required>
                <Input
                  type="date"
                  value={dueDate}
                  min={toDateInput()}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </FormField>
            </CardContent>
          </Card>
        )}

        {balanceDue === 0 && grandTotal > 0 && (
          <div className="flex items-center gap-2 rounded-xl bg-success-light border border-success/20 px-4 py-3">
            <span className="text-sm font-medium text-success-foreground">Fully paid</span>
            <Badge variant="success">{npr(grandTotal)}</Badge>
          </div>
        )}

        <FormField label="Notes (optional)">
          <Input placeholder="Any note for this bill" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </FormField>
      </div>

      {/* Preview floating button — only shows once customer + at least 1 item selected */}
      {customerId && lines.some((l) => l.productId) && (
        <div className="mb-3 flex justify-center">
          <button
            onClick={() => setPrev(true)}
            className="flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-700 shadow-sm hover:bg-teal-100 active:bg-teal-200 transition-colors"
          >
            <Eye size={15} /> Preview bill
          </button>
        </div>
      )}

      <StickyBar
        rows={[
          ["Subtotal", npr(subtotal)],
          ...(discountAmt > 0 ? [[
            discountType === "percent" ? `Discount (${discountValue}%)` : `Discount (flat)`,
            `− ${npr(discountAmt)}`,
          ] as [string, string]] : []),
          ...(termsAmt > 0   ? [["Bill terms", `+ ${npr(termsAmt)}`]   as [string, string]] : []),
          ...(vatAmt > 0     ? [["VAT (13%)", npr(vatAmt)]             as [string, string]] : []),
          ["Grand total", npr(grandTotal)],
          ...(balanceDue > 0 ? [["Balance due", npr(balanceDue)]       as [string, string]] : []),
        ]}
        action={isEdit ? "Update bill" : "Save bill"}
        onAction={handleSave}
        secondaryAction={isEdit ? "Update & Print" : "Save & Print"}
        onSecondaryAction={handleSaveAndPrint}
        loading={saving}
        disabled={!customerId || lines.every((l) => !l.productId)}
      />
    </PageShell>
  );
};
