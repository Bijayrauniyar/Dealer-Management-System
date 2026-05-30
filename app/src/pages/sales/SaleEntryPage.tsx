import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Download, Plus, Trash2, Eye, X, Save } from "lucide-react";
import { downloadBillPdf } from "@/lib/billExport";
import { printBill } from "@/lib/printBill";
import { toast } from "sonner";
import { PageShell } from "@/components/app/PageShell";
import { FormField } from "@/components/app/FormField";
import { EntityPicker } from "@/components/app/EntityPicker";
import { StickyBar } from "@/components/app/StickyBar";
import { BillPrintView } from "@/components/app/BillPrintView";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/app/NumericInput";
import { lineAmountFromMrp } from "@/lib/saleLineMath";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PAYMENT_MODES } from "@/domain/catalogs";
import { conversionLabel, linePricingForProduct, productUomChoices } from "@/lib/uom";
import {
  useProducts,
  useCustomers,
  useSaleByBill,
  commitSale,
  useNextBillNo,
  useBusinessSettings,
  useSchemes,
} from "@/store/domain";
import { getVatPct, tenantChargesVat } from "@/lib/billDisplay";
import { numericMoneyProps, numericPercentProps, numericQtyProps, roundMoney } from "@/lib/money";
import { addVatToExcl } from "@/lib/tax";
import { buildSaleProductPickerOptions } from "@/lib/stockAlert";
import { stripFocSuffixFromName } from "@/lib/billFoc";
import {
  SAVE_INVOICE_ACTION,
  UPDATE_INVOICE_ACTION,
  SAVE_INVOICE_PRINT_ACTION,
  UPDATE_INVOICE_PRINT_ACTION,
  SALES_INVOICE_LABEL,
} from "@/lib/actionLabels";
import { syncSchemeFreeLines, schemeHintForLine, type SaleDraftLine } from "@/lib/schemeApply";
import { npr, nprNum, toDateInput } from "@/lib/utils";

type Line = SaleDraftLine;

export const SaleEntryPage = () => {
  const navigate        = useNavigate();
  const [searchParams]  = useSearchParams();
  const { billNo: editBillNo } = useParams<{ billNo?: string }>();

  // Reactive store data
  const CUSTOMERS = useCustomers();
  const PRODUCTS  = useProducts();
  const SCHEMES   = useSchemes();
  const business  = useBusinessSettings();
  const tenantVat = tenantChargesVat(business);
  const vatPct    = getVatPct(business);
  const existing  = useSaleByBill(editBillNo ?? "");
  const isEdit    = Boolean(existing);

  // Pre-selected customer from query param (e.g. CustomerDetailPage → Sales invoice)
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
      };
    }) ?? [{ id: 1, productId: "", productName: "", uom: "PCS", qty: 1, mrp: 0, rate: 0, discountPct: 0 }],
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
  const [exportingPreview, setExportingPreview] = useState(false);
  const [showDealerPricing, setShowDealerPricing] = useState(false);

  const setLinesWithSchemes = useCallback(
    (updater: (ls: Line[]) => Line[]) => {
      setLines((ls) => {
        const next = updater(ls);
        if (!SCHEMES.length) return next;
        return syncSchemeFreeLines(next, SCHEMES, billDate);
      });
    },
    [SCHEMES, billDate],
  );

  useEffect(() => {
    if (!SCHEMES.length) return;
    setLines((ls) => syncSchemeFreeLines(ls, SCHEMES, billDate));
  }, [SCHEMES, billDate]);

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
        };
      }),
    );
    setDiscountType(existing.discountType === "percent" ? "percent" : "flat");
    setDiscountValue(existing.discountValue ? String(existing.discountValue) : "");
    setBillTerms(existing.billTerms ?? "");
    setBillTermsAmt(existing.billTermsAmount ? String(existing.billTermsAmount) : "");
    setPaidNow(existing.paidNow ? String(existing.paidNow) : "");
    setDueDate(existing.dueDate ?? "");
    setNotes(existing.notes ?? "");
  }, [existing, editBillNo, PRODUCTS]);

  // ── Derived totals (MRP-based line amounts; bill discount unchanged below) ──
  const lineAmount = (l: Line) =>
    l.isSchemeFree
      ? 0
      : lineAmountFromMrp({ qty: l.qty, mrp: l.mrp, rate: l.rate, discountPct: l.discountPct });
  const subtotal   = lines.reduce((s, l) => s + lineAmount(l), 0);

  const discountAmt = (() => {
    const v = Number(discountValue) || 0;
    if (discountType === "percent") return roundMoney((subtotal * v) / 100);
    return Math.min(roundMoney(v), subtotal);
  })();

  const afterDiscount  = roundMoney(subtotal - discountAmt);
  const termsAmt       = roundMoney(Number(billTermsAmt) || 0);
  const taxBase        = roundMoney(afterDiscount + termsAmt);
  const vatAmt         = tenantVat ? roundMoney(taxBase * vatPct / 100) : 0;
  const grandTotal     = roundMoney(taxBase + vatAmt);
  const recordedPaid   = isEdit && existing ? Number(existing.paidNow) : 0;
  const paidAmt        = isEdit ? recordedPaid : Math.min(Number(paidNow) || 0, grandTotal);
  const balanceDue     = grandTotal - paidAmt;

  // ── Line helpers ────────────────────────────────────────────────────
  const addLine = () =>
    setLinesWithSchemes((ls) => [
      ...ls,
      { id: Date.now(), productId: "", productName: "", uom: "PCS", qty: 1, mrp: 0, rate: 0, discountPct: 0 },
    ]);
  const removeLine = (id: number) => {
    if (lines.find((l) => l.id === id)?.isSchemeFree) return;
    setLinesWithSchemes((ls) =>
      ls.filter((l) => l.id !== id && l.schemePaidLineId !== id),
    );
  };
  const updateLine = (id: number, patch: Partial<Line>) => {
    if (lines.find((l) => l.id === id)?.isSchemeFree) return;
    setLinesWithSchemes((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const applyProductToLine = (lineId: number, productId: string, productName: string) => {
    const product = PRODUCTS.find((p) => p.id === productId);
    if (!product) {
      updateLine(lineId, {
        productId,
        productName,
        uom: "PCS",
        mrp: 0,
        rate: 0,
        discountPct: 0,
      });
      return;
    }
    const uom = product.uom || "PCS";
    const { mrp, rate } = linePricingForProduct(product, uom);
    updateLine(lineId, {
      productId,
      productName,
      uom,
      mrp,
      rate,
      discountPct: product.discountPct ?? 0,
    });
  };

  const handleLineUomChange = (lineId: number, productId: string, newUom: string) => {
    const product = PRODUCTS.find((p) => p.id === productId);
    if (!product) {
      updateLine(lineId, { uom: newUom });
      return;
    }
    const { mrp, rate } = linePricingForProduct(product, newUom);
    updateLine(lineId, { uom: newUom, mrp, rate });
  };

  // ── Save ────────────────────────────────────────────────────────────
  const validate = () => {
    if (!customerId) { toast.error("Choose a customer."); return false; }
    if (lines.every((l) => !l.productId)) { toast.error("Add at least one item."); return false; }
    if (isEdit && grandTotal + 0.01 < recordedPaid) {
      toast.error(`New total (${npr(grandTotal)}) can't be less than already collected (${npr(recordedPaid)}).`);
      return false;
    }
    if (balanceDue > 0 && !dueDate) { toast.error("Set a due date for the outstanding balance."); return false; }
    if (!isEdit && !billNo) {
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
    id:              isEdit && existing ? existing.id : savedBillNo,
    billNo:          savedBillNo,
    date:            billDate,
    customerId,
    customerName:    customer?.name ?? "",
    lines:           lines.filter((l) => l.productId).map((l) => {
      const prod = PRODUCTS.find((p) => p.id === l.productId);
      const name = stripFocSuffixFromName(l.productName);
      const isFoc = Boolean(l.isSchemeFree);
      const displayMrp =
        isFoc && prod
          ? linePricingForProduct(prod, l.uom).mrp
          : l.mrp;
      return {
        productId: l.productId,
        productName: name,
        uom: l.uom,
        qty: l.qty,
        mrp: displayMrp,
        rate: isFoc ? 0 : l.rate,
        discountPct: l.discountPct ?? 0,
        amount: lineAmount(l),
        isFoc,
        focNote: isFoc ? (l.schemeName?.trim() || "FOC") : undefined,
      };
    }),
    subtotal,
    discountType:    discountValue ? discountType : "none" as const,
    discountValue:   Number(discountValue) || 0,
    discountAmount:  discountAmt,
    afterDiscount,
    billTerms:       billTerms || "",
    billTermsAmount: termsAmt,
    vatRate:         tenantVat ? vatPct : 0,
    vatAmount:       vatAmt,
    grandTotal,
    paidNow: paidAmt,
    paymentMode: paidAmt > 0 ? payMode : balanceDue > 0 ? "Credit" : payMode,
    balance: balanceDue,
    dueDate:         dueDate || "",
    notes:           notes || "",
    total:           grandTotal,
  });

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 200));
      const sale = buildSale();
      const finalBillNo = await commitSale(sale);
      navigate(`/app/bills/${encodeURIComponent(finalBillNo)}`, { state: { sale: { ...sale, billNo: finalBillNo } } });
      toast.success(
        isEdit
          ? `Bill ${finalBillNo} updated · ${npr(grandTotal)}${balanceDue > 0 ? ` · ${npr(balanceDue)} due` : ""}`
          : `Bill ${finalBillNo} saved · ${npr(grandTotal)}${balanceDue > 0 ? ` · ${npr(balanceDue)} due` : " · Fully paid"}`,
      );
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : e && typeof e === "object" && "message" in e
            ? String((e as { message: unknown }).message)
            : "Could not save bill";
      toast.error(msg || "Could not save bill");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndPrint = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 200));
      const sale = buildSale();
      const finalBillNo = await commitSale(sale);
      navigate(`/app/bills/${encodeURIComponent(finalBillNo)}?print=1`, { state: { sale: { ...sale, billNo: finalBillNo } } });
      toast.success(isEdit ? "Bill updated — opening print view…" : "Bill saved — opening print view…");
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : e && typeof e === "object" && "message" in e
            ? String((e as { message: unknown }).message)
            : "Could not save bill";
      toast.error(msg || "Could not save bill");
    } finally {
      setSaving(false);
    }
  };

  const handlePreviewDownload = async () => {
    setExportingPreview(true);
    try {
      await downloadBillPdf({ sale: buildSale(), customer, business });
      toast.success("Bill downloaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Download failed");
    } finally {
      setExportingPreview(false);
    }
  };

  const customerOptions = CUSTOMERS.map((c) => ({ id: c.id, label: c.name, sub: c.area }));
  const productOptions = useMemo(
    () =>
      buildSaleProductPickerOptions(
        PRODUCTS,
        lines.map((l) => l.productId).filter(Boolean),
        { schemes: SCHEMES, billDate },
      ),
    [PRODUCTS, lines, SCHEMES, billDate],
  );

  return (
    <PageShell stickyBar>
      {/* ── Preview modal ── */}
      {previewing && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/60 backdrop-blur-sm print:relative print:inset-auto print:bg-white print:block">
          <div className="bill-preview-chrome flex items-center justify-between bg-white px-4 py-3 shadow-sm shrink-0 print:hidden">
            <p className="text-sm font-semibold text-foreground">Bill preview</p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={exportingPreview}
                onClick={() => printBill(buildSale().billNo || "Bill")}
                className="flex items-center gap-1 rounded-lg border border-border-subtle px-3 py-1.5 text-xs font-medium text-muted hover:bg-slate-50 disabled:opacity-50"
              >
                Print
              </button>
              <button
                type="button"
                disabled={exportingPreview}
                onClick={() => void handlePreviewDownload()}
                className="flex items-center gap-1 rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-100 disabled:opacity-50"
              >
                <Download size={13} />
                {exportingPreview ? "…" : "PDF"}
              </button>
              <button
                type="button"
                onClick={() => setPrev(false)}
                className="flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white"
              >
                <X size={13} /> Close
              </button>
            </div>
          </div>
          <div className="bill-print-zone flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-4 print:flex print:justify-center print:overflow-visible print:p-0">
            <BillPrintView sale={buildSale()} customer={customer} isPreview />
          </div>
        </div>
      )}

      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm font-medium text-teal-600">
        <ArrowLeft size={16} /> Back
      </button>
      <h1 className="mb-5 text-lg font-semibold">
        {isEdit ? `Edit sales invoice ${editBillNo}` : "New sales invoice"}
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
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Items</p>
            <button
              type="button"
              onClick={() => setShowDealerPricing((v) => !v)}
              className="text-xs font-medium text-teal-600 underline"
            >
              {showDealerPricing ? "Hide dealer pricing" : "Show dealer pricing"}
            </button>
          </div>
          <div className="space-y-3">
            {lines.map((line) =>
              line.isSchemeFree ? (
              <Card key={line.id} className="border-pink-200 bg-pink-50/40">
                <CardContent className="space-y-2 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge className="bg-pink-100 text-pink-800 border-pink-200">
                      Scheme free
                    </Badge>
                    <span className="text-xs text-muted-foreground">{line.schemeName}</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">{line.productName}</p>
                  <p className="text-xs text-muted-foreground">
                    {line.qty} {line.uom} · NPR 0 · linked to paid line above
                  </p>
                </CardContent>
              </Card>
              ) : (
              <Card key={line.id}>
                <CardContent className="space-y-3 p-3">
                  <EntityPicker
                    placeholder="Search product"
                    options={productOptions}
                    value={line.productId}
                    onChange={(id, opt) => applyProductToLine(line.id, id, opt.label)}
                    onClear={() => updateLine(line.id, { productId: "", productName: "", uom: "PCS", mrp: 0, rate: 0, discountPct: 0 })}
                    entityLabel="product"
                  />
                  {line.productId && (line.discountPct ?? 0) > 0 && (
                    <p className="text-[11px] text-amber-700">
                      Line discount {line.discountPct}% applied on MRP
                    </p>
                  )}
                  {line.productId && (() => {
                    const hint = schemeHintForLine(
                      SCHEMES,
                      line.productId,
                      line.qty,
                      billDate,
                      line.uom,
                    );
                    if (!hint) return null;
                    return (
                      <p className="text-[11px] font-medium text-pink-800">{hint}</p>
                    );
                  })()}
                  {(() => {
                    const product = PRODUCTS.find((p) => p.id === line.productId);
                    if (!product?.uomConversion) return null;
                    return (
                      <p className="text-[11px] font-medium text-emerald-700">
                        {conversionLabel(product.uomConversion, product.uom)}
                      </p>
                    );
                  })()}

                  <div className="grid grid-cols-4 gap-2">
                    <FormField label="UOM" hint={line.productId ? "Only units set on product" : undefined}>
                      <Select
                        value={line.uom || "PCS"}
                        disabled={!line.productId}
                        onChange={(e) => handleLineUomChange(line.id, line.productId, e.target.value)}
                      >
                        {(() => {
                          const product = PRODUCTS.find((p) => p.id === line.productId);
                          const choices = product
                            ? productUomChoices(product, line.uom)
                            : [line.uom || "PCS"];
                          return choices.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ));
                        })()}
                      </Select>
                    </FormField>
                    <FormField label="Qty">
                      <NumericInput
                        {...numericQtyProps}
                        min={0}
                        value={line.qty}
                        onChange={(v) => updateLine(line.id, { qty: v > 0 ? v : 0 })}
                      />
                    </FormField>
                    <FormField
                      label={`MRP (NPR)`}
                      hint={line.productId ? `Per ${line.uom || "unit"} · on bill` : "On printed bill"}
                    >
                      <NumericInput
                        {...numericMoneyProps}
                        min={0}
                        value={line.mrp}
                        onChange={(v) => updateLine(line.id, { mrp: v })}
                      />
                    </FormField>
                    <FormField label="Amount">
                      <div className="flex h-11 flex-col justify-center rounded-lg bg-slate-50 px-3">
                        <span className="text-sm font-medium">{nprNum(lineAmount(line))}</span>
                      </div>
                    </FormField>
                  </div>

                  {showDealerPricing && line.productId && (
                    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-muted">
                      <p className="font-medium text-slate-600">Dealer pricing (not on customer bill)</p>
                      <p className="mt-1">
                        Sell price: <strong className="text-teal-700">{nprNum(line.rate)}</strong>
                        {tenantVat && (
                          <> · Incl. {vatPct}% VAT: {nprNum(addVatToExcl(line.rate, vatPct))}</>
                        )}
                      </p>
                      <div className="mt-2">
                        <FormField label="Dealer rate (NPR)">
                          <NumericInput
                            {...numericMoneyProps}
                            min={0}
                            value={line.rate}
                            onChange={(v) => updateLine(line.id, { rate: v })}
                          />
                        </FormField>
                      </div>
                    </div>
                  )}
                  {lines.filter((l) => !l.isSchemeFree).length > 1 && (
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
                <NumericInput
                  {...(discountType === "percent" ? numericPercentProps : numericMoneyProps)}
                  min={0}
                  max={discountType === "percent" ? 100 : subtotal}
                  value={Number(discountValue) || 0}
                  onChange={(v) => setDiscountValue(v === 0 ? "" : String(v))}
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
                <NumericInput
                  {...numericMoneyProps}
                  min={0}
                  value={Number(billTermsAmt) || 0}
                  onChange={(v) => setBillTermsAmt(v === 0 ? "" : String(v))}
                />
              </FormField>
            </div>
          </CardContent>
        </Card>

        {tenantVat && vatAmt > 0 && (
          <p className="rounded-lg border border-teal-200/80 bg-teal-50/40 px-3 py-2 text-xs text-teal-900">
            VAT {vatPct}% ({npr(vatAmt)}) is added from <strong>Settings</strong> — your shop is VAT registered.
          </p>
        )}

        {/* ── Payment now (new bills only — use Payments screen to collect on issued bills) ── */}
        <Card>
          <CardContent className="space-y-3 p-4">
            <p className="text-sm font-medium text-foreground">Payment received now</p>
            {isEdit ? (
              <p className="text-xs text-muted rounded-lg bg-slate-50 border border-border-subtle px-3 py-2">
                Already recorded on this bill: <strong className="text-foreground">{npr(recordedPaid)}</strong>.
                To add more, use <strong>Collect</strong> on the bill detail screen.
              </p>
            ) : (
              <FormField label="Amount received (NPR)" hint={`Grand total: ${npr(grandTotal)} · 0 = credit`}>
                <NumericInput
                  {...numericMoneyProps}
                  min={0}
                  max={grandTotal}
                  value={Number(paidNow) || 0}
                  onChange={(v) => setPaidNow(v === 0 ? "" : String(v))}
                />
              </FormField>
            )}
            {!isEdit && paidAmt > 0 && (
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Mode">
                  <Select value={payMode} onChange={(e) => setPayMode(e.target.value)}>
                    {PAYMENT_MODES.map((m) => (
                      <option key={m}>{m}</option>
                    ))}
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

        {/* Totals in scroll area — keeps fixed footer short */}
        {lines.some((l) => l.productId) && (
          <Card className="border-dashed border-teal-200/80 bg-teal-50/30">
            <CardContent className="space-y-1 p-3 text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-muted">Subtotal</span>
                <span className="font-medium tabular-nums">{npr(subtotal)}</span>
              </div>
              {discountAmt > 0 && (
                <div className="flex justify-between gap-2 text-amber-800">
                  <span>
                    {discountType === "percent" ? `Discount (${discountValue}%)` : "Discount (flat)"}
                  </span>
                  <span className="font-medium tabular-nums">− {npr(discountAmt)}</span>
                </div>
              )}
              {termsAmt > 0 && (
                <div className="flex justify-between gap-2">
                  <span className="text-muted">Bill terms</span>
                  <span className="font-medium tabular-nums">+ {npr(termsAmt)}</span>
                </div>
              )}
              {vatAmt > 0 && (
                <div className="flex justify-between gap-2">
                  <span className="text-muted">VAT ({vatPct}%)</span>
                  <span className="font-medium tabular-nums">{npr(vatAmt)}</span>
                </div>
              )}
              <div className="flex justify-between gap-2 border-t border-teal-200/60 pt-1.5">
                <span className="font-semibold text-foreground">Grand total</span>
                <span className="font-bold tabular-nums text-teal-800">{npr(grandTotal)}</span>
              </div>
              {balanceDue > 0 && (
                <div className="flex justify-between gap-2 text-warning-foreground">
                  <span className="font-medium">Balance due</span>
                  <span className="font-bold tabular-nums">{npr(balanceDue)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <FormField label="Notes (optional)">
          <Input placeholder="Any note for this invoice" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </FormField>
      </div>

      <StickyBar
        compact
        previewLabel={customerId && lines.some((l) => l.productId) ? "Preview invoice" : undefined}
        onPreview={
          customerId && lines.some((l) => l.productId) ? () => setPrev(true) : undefined
        }
        rows={[
          ["Subtotal", npr(subtotal)],
          ...(discountAmt > 0
            ? [[
                discountType === "percent" ? `Discount (${discountValue}%)` : "Discount (flat)",
                `− ${npr(discountAmt)}`,
              ] as [string, string]]
            : []),
          ...(termsAmt > 0 ? [["Bill terms", `+ ${npr(termsAmt)}`] as [string, string]] : []),
          ...(vatAmt > 0 ? [[`VAT (${vatPct}%)`, npr(vatAmt)] as [string, string]] : []),
          ...(balanceDue > 0 ? [["Balance due", npr(balanceDue)] as [string, string]] : []),
          ["Grand total", npr(grandTotal)],
        ]}
        action={isEdit ? UPDATE_INVOICE_ACTION : SAVE_INVOICE_ACTION}
        actionIcon={Save}
        actionAriaLabel={
          isEdit ? `Update ${SALES_INVOICE_LABEL.toLowerCase()}` : `Save ${SALES_INVOICE_LABEL.toLowerCase()}`
        }
        onAction={handleSave}
        secondaryAction={isEdit ? UPDATE_INVOICE_PRINT_ACTION : SAVE_INVOICE_PRINT_ACTION}
        onSecondaryAction={handleSaveAndPrint}
        loading={saving}
        disabled={!customerId || lines.every((l) => !l.productId)}
      />
    </PageShell>
  );
};
