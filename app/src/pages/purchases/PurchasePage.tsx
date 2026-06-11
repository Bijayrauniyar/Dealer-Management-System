import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {Pencil, Plus, Trash2} from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/app/PageShell";
import { FormField } from "@/components/app/FormField";
import { DateFormField } from "@/components/app/DateFormField";
import { EntityPicker } from "@/components/app/EntityPicker";
import { ProductQuickModal } from "@/components/app/ProductQuickModal";
import { StickyBar } from "@/components/app/StickyBar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { normalizeInvoiceNoSpoken } from "@/lib/voiceInvoiceNo";
import { NumericInput } from "@/components/app/NumericInput";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useSuppliers,
  useProducts,
  useBusinessSettings,
  commitPurchase,
  commitPurchaseUpdate,
} from "@/store/domain";
import { getVatPct, addVatToExcl, vatAmountFromExcl, purchasePriceExclFromProduct } from "@/lib/tax";
import { numericPriceProps, numericQtyProps, roundMoney } from "@/lib/money";
import { fetchPurchaseDetailLive } from "@/lib/live/domainLive";
import type { Product, PurchaseDetail } from "@/domain/types";
import {
  baseUnitsToBillQty,
  billQtyToBaseUnits,
  conversionLabel,
  lineUomQtyHint,
  priceForPackFromBase,
  productUomChoices,
} from "@/lib/uom";
import { npr, nprNum, toDateInput } from "@/lib/utils";
import { FormPageHeader } from "@/components/app/patterns";
import { PageBackLink } from "@/components/app/PageBackLink";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import {
  isPurchaseDueDateSettled,
  purchaseDueDateSettledConfirm,
  purchasePaidAdjustmentConfirm,
  type FinancialSaveConfirmConfig,
} from "@/lib/financialSaveConfirm";

type Line = {
  id: number;
  productId: string;
  productName: string;
  uom: string;
  invoiceQty: number;
  receivedQty: number;
  cost: number;
};

const mkLine = (): Line => ({
  id: Date.now(),
  productId: "",
  productName: "",
  uom: "PCS",
  invoiceQty: 1,
  receivedQty: 1,
  cost: 0,
});

const inputCompact = "h-9 text-sm";

/** Detect catalog pricing/UOM changes (for refreshing open purchase lines). */
function productPurchasePriceSignature(p: Product): string {
  return `${p.costPrice}|${p.uom}|${JSON.stringify(p.uomConversion ?? null)}`;
}

type DetailLine = PurchaseDetail["lines"][number];

/** Map saved purchase line (base PCS qty) to form row — prefer pack UOM when qty divides evenly. */
function purchaseLineFromDetail(
  l: DetailLine,
  index: number,
  product: Product | undefined,
  vatPct: number,
): Line {
  const baseQty = l.baseQty ?? l.qty;
  let uom = l.uom || product?.uom || "PCS";
  let invoiceQty = l.qty;
  const conv = product?.uomConversion;
  if (conv && baseQty > 0 && l.uom === conv.packUom && l.qty > 0) {
    uom = conv.packUom;
    invoiceQty = l.qty;
  } else if (conv && baseQty > 0 && baseQty % conv.piecesPerPack === 0) {
    const packQty = baseQty / conv.piecesPerPack;
    if (packQty >= 1) {
      uom = conv.packUom;
      invoiceQty = packQty;
    } else {
      uom = product?.uom || "PCS";
      invoiceQty = baseQty;
    }
  } else if (!conv) {
    uom = product?.uom || l.uom || "PCS";
    invoiceQty = baseQty;
  }
  const cost = product
    ? costExclForProductUom(product, uom, vatPct)
    : l.rateExcl;
  return {
    id: index + 1,
    productId: l.productId,
    productName: l.productName,
    uom,
    invoiceQty,
    receivedQty: invoiceQty,
    cost,
  };
}

/** Buy price excl. VAT for line UOM (product.costPrice is stored VAT-inclusive). */
function costExclForProductUom(product: Product, uom: string, vatPct: number): number {
  const unit = uom.trim() || product.uom || "PCS";
  const baseIncl = product.costPrice;
  const conv = product.uomConversion;
  let incl = baseIncl;
  if (conv && unit === conv.packUom && baseIncl > 0) {
    incl = priceForPackFromBase({ mrp: baseIncl, sellingPrice: baseIncl }, conv.piecesPerPack).sellingPrice;
  }
  return purchasePriceExclFromProduct(incl, vatPct);
}

/** Compact label + control (less vertical space than FormField). */
const CompactField = ({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) => (
  <div className={className}>
    <p className="mb-0.5 text-[10px] font-medium text-muted">{label}</p>
    {children}
  </div>
);

export const PurchasePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { purchaseId: editPurchaseId } = useParams<{ purchaseId?: string }>();
  const isEdit = Boolean(editPurchaseId);
  const SUPPLIERS = useSuppliers();
  const PRODUCTS = useProducts();
  const business = useBusinessSettings();
  const vatPct = getVatPct(business);

  const presetSupplierId =
    (location.state as { supplierId?: string } | null)?.supplierId ?? "";

  const [supplierId, setSupplierId] = useState("");
  const [paidOnPurchase, setPaidOnPurchase] = useState(0);
  const [loadingEdit, setLoadingEdit] = useState(isEdit);
  const [editLoadError, setEditLoadError] = useState<string | null>(null);
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceLocked, setInvoiceLocked] = useState(false);
  const [date, setDate] = useState(toDateInput());
  const [dueDate, setDueDate] = useState("");
  const [lines, setLines] = useState<Line[]>([mkLine()]);
  const [saving, setSaving] = useState(false);
  const [saveConfirm, setSaveConfirm] = useState<FinancialSaveConfirmConfig | null>(null);
  const [editLinesRaw, setEditLinesRaw] = useState<DetailLine[] | null>(null);
  const [productModal, setProductModal] = useState<{
    lineId: number;
    productId?: string;
    initialName?: string;
  } | null>(null);
  const [pendingLineProduct, setPendingLineProduct] = useState<{
    lineId: number;
    productId: string;
  } | null>(null);
  const prevProductPriceSigRef = useRef<Map<string, string>>(new Map());
  const catalogAtUnmountRef = useRef<Map<string, string>>(new Map());

  /** When product master buy price changes (in-place or after returning from product form), refresh line costs. */
  useEffect(() => {
    if (loadingEdit) return;

    const refreshProductIds = new Set<string>();
    for (const p of PRODUCTS) {
      const sig = productPurchasePriceSignature(p);
      const prev = prevProductPriceSigRef.current.get(p.id);
      const atUnmount = catalogAtUnmountRef.current.get(p.id);
      if ((prev !== undefined && prev !== sig) || (atUnmount !== undefined && atUnmount !== sig)) {
        refreshProductIds.add(p.id);
      }
      prevProductPriceSigRef.current.set(p.id, sig);
    }
    if (refreshProductIds.size === 0) return;

    setLines((ls) =>
      ls.map((l) => {
        if (!l.productId || !refreshProductIds.has(l.productId)) return l;
        const product = PRODUCTS.find((p) => p.id === l.productId);
        if (!product) return l;
        return {
          ...l,
          productName: product.name,
          cost: costExclForProductUom(product, l.uom, vatPct),
        };
      }),
    );
  }, [PRODUCTS, vatPct, loadingEdit]);

  useEffect(() => {
    return () => {
      catalogAtUnmountRef.current = new Map(prevProductPriceSigRef.current);
    };
  }, []);

  useEffect(() => {
    if (isEdit || !presetSupplierId) return;
    if (SUPPLIERS.some((s) => s.id === presetSupplierId)) {
      setSupplierId(presetSupplierId);
    }
  }, [presetSupplierId, SUPPLIERS, isEdit]);

  useEffect(() => {
    if (!isEdit || !editPurchaseId) return;
    let cancelled = false;
    setLoadingEdit(true);
    setEditLoadError(null);
    void fetchPurchaseDetailLive(editPurchaseId)
      .then((detail) => {
        if (cancelled) return;
        if (!detail) {
          setEditLoadError("Purchase not found.");
          return;
        }
        setSupplierId(detail.supplierId);
        setInvoiceNo(detail.supplierInvoiceNo);
        setInvoiceLocked(Boolean(detail.supplierInvoiceNo?.trim()));
        setPaidOnPurchase(detail.paid);
        setDate(detail.date.slice(0, 10));
        setDueDate(detail.dueDate?.slice(0, 10) ?? "");
        setEditLinesRaw(detail.lines.length ? detail.lines : null);
        if (!detail.lines.length) setLines([mkLine()]);
      })
      .catch((e) => {
        if (!cancelled) {
          setEditLoadError(e instanceof Error ? e.message : "Could not load purchase");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingEdit(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isEdit, editPurchaseId]);

  useEffect(() => {
    if (!editLinesRaw?.length) return;
    setLines(
      editLinesRaw.map((l, i) =>
        purchaseLineFromDetail(l, i, PRODUCTS.find((p) => p.id === l.productId), vatPct),
      ),
    );
    setEditLinesRaw(null);
  }, [editLinesRaw, PRODUCTS, vatPct]);

  useEffect(() => {
    if (!pendingLineProduct) return;
    const product = PRODUCTS.find((p) => p.id === pendingLineProduct.productId);
    if (!product) return;
    applyProductToLine(pendingLineProduct.lineId, product.id, product.name);
    setPendingLineProduct(null);
  }, [pendingLineProduct, PRODUCTS]);

  const lineExcl = (l: Line, qty: number) => qty * l.cost;
  const lineVat = (l: Line, qty: number) => vatAmountFromExcl(lineExcl(l, qty), vatPct);
  const lineIncl = (l: Line, qty: number) => lineExcl(l, qty) + lineVat(l, qty);
  const totalInvoicedExcl = lines.reduce((s, l) => s + lineExcl(l, l.invoiceQty), 0);
  const totalReceivedExcl = lines.reduce((s, l) => s + lineExcl(l, l.receivedQty), 0);
  const totalReceivedVat = lines.reduce((s, l) => s + lineVat(l, l.receivedQty), 0);
  const totalReceivedIncl = totalReceivedExcl + totalReceivedVat;
  const totalInvoicedIncl =
    totalInvoicedExcl + lines.reduce((s, l) => s + lineVat(l, l.invoiceQty), 0);
  const shortLines = lines.filter((l) => l.receivedQty < l.invoiceQty && l.productId);
  const hasShort = shortLines.length > 0;

  const addLine = () => setLines((ls) => [...ls, mkLine()]);
  const removeLine = (id: number) => setLines((ls) => ls.filter((l) => l.id !== id));
  const updateLine = (id: number, patch: Partial<Line>) =>
    setLines((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const applyProductToLine = (lineId: number, productId: string, productName: string) => {
    const product = PRODUCTS.find((p) => p.id === productId);
    if (!product) {
      updateLine(lineId, { productId, productName, uom: "PCS", cost: 0 });
      return;
    }
    const uom = product.uom || "PCS";
    updateLine(lineId, {
      productId,
      productName,
      uom,
      invoiceQty: 1,
      receivedQty: 1,
      cost: costExclForProductUom(product, uom, vatPct),
    });
  };

  const handleLineUomChange = (lineId: number, productId: string, newUom: string) => {
    const line = lines.find((l) => l.id === lineId);
    const product = PRODUCTS.find((p) => p.id === productId);
    if (!line || !product) {
      updateLine(lineId, { uom: newUom });
      return;
    }
    const baseQty = billQtyToBaseUnits(
      line.receivedQty,
      line.uom,
      product.uom,
      product.uomConversion ?? null,
    );
    const newQty = Math.max(
      0,
      baseUnitsToBillQty(baseQty, newUom, product.uom, product.uomConversion ?? null),
    );
    const qty = Number.isInteger(newQty) ? newQty : roundMoney(newQty);
    updateLine(lineId, {
      uom: newUom,
      invoiceQty: qty,
      receivedQty: qty,
      cost: costExclForProductUom(product, newUom, vatPct),
    });
  };

  const openProductModal = (lineId: number, productId?: string, initialName?: string) => {
    setProductModal({ lineId, productId, initialName });
  };

  const handleProductSaved = (lineId: number, productId: string) => {
    setPendingLineProduct({ lineId, productId });
  };

  const lineForStockRpc = (line: Line) => {
    const product = PRODUCTS.find((p) => p.id === line.productId);
    if (!product) {
      return { receivedQty: line.receivedQty, rateExcl: line.cost };
    }
    const baseQty = billQtyToBaseUnits(
      line.receivedQty,
      line.uom,
      product.uom,
      product.uomConversion ?? null,
    );
    const lineTotalExcl = line.receivedQty * line.cost;
    const rateExclPerBase = baseQty > 0 ? roundMoney(lineTotalExcl / baseQty) : line.cost;
    return { receivedQty: baseQty, rateExcl: rateExclPerBase };
  };

  const buildRpcLines = () =>
    lines
      .filter((l) => l.productId && l.receivedQty > 0)
      .map((l) => {
        const { receivedQty, rateExcl } = lineForStockRpc(l);
        return { productId: l.productId, receivedQty, rateExcl };
      });

  const paidWillCap = isEdit && totalReceivedIncl + 0.01 < paidOnPurchase;

  const resolveSaveConfirm = (): FinancialSaveConfirmConfig | null => {
    if (paidWillCap) {
      return purchasePaidAdjustmentConfirm(totalReceivedIncl, paidOnPurchase);
    }
    if (!isEdit && isPurchaseDueDateSettled(dueDate)) {
      return purchaseDueDateSettledConfirm(totalReceivedIncl, dueDate);
    }
    return null;
  };

  const performSave = async () => {
    const normalizedInvoice = normalizeInvoiceNoSpoken(invoiceNo);
    const rpcLines = buildRpcLines();
    setSaving(true);
    try {
      if (isEdit && editPurchaseId) {
        await commitPurchaseUpdate({
          purchaseId: editPurchaseId,
          supplierId,
          purchaseDate: date,
          dueDate: dueDate || null,
          lines: rpcLines,
          ...(!invoiceLocked && normalizedInvoice
            ? { supplierInvoiceNo: normalizedInvoice }
            : {}),
        });
        if (!invoiceLocked && normalizedInvoice) setInvoiceLocked(true);
        const label = normalizedInvoice || "Purchase";
        toast.success(
          paidWillCap
            ? `${label} updated. Recorded payment adjusted to the revised total.`
            : `${label} updated.`,
        );
        navigate(`/app/purchases/${editPurchaseId}`, { replace: true });
      } else {
        const { purchaseId } = await commitPurchase({
          supplierId,
          purchaseDate: date,
          supplierInvoiceNo: normalizedInvoice,
          dueDate: dueDate || null,
          totalReceived: totalReceivedIncl,
          lines: rpcLines,
        });
        const label = normalizedInvoice;
        toast.success(
          hasShort
            ? `Invoice ${label} saved. ${shortLines.length} short line(s) noted.`
            : `Invoice ${label} saved.`,
        );
        if (purchaseId) {
          navigate(`/app/purchases/${purchaseId}`, { replace: true });
          return;
        }
        navigate(-1);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Purchase failed");
    } finally {
      setSaving(false);
      setSaveConfirm(null);
    }
  };

  const handleSave = () => {
    if (!supplierId) {
      toast.error("Choose a supplier.");
      return;
    }
    if (lines.some((l) => !l.productId)) {
      toast.error("Every row needs a product.");
      return;
    }
    const normalizedInvoice = normalizeInvoiceNoSpoken(invoiceNo);
    if ((!isEdit || !invoiceLocked) && !normalizedInvoice) {
      toast.error("Enter invoice number from the supplier bill.");
      return;
    }

    const confirm = resolveSaveConfirm();
    if (confirm) {
      setSaveConfirm(confirm);
      return;
    }
    void performSave();
  };

  if (isEdit && loadingEdit) {
    return (
      <PageShell>
        <p className="text-sm text-muted">Loading purchase…</p>
      </PageShell>
    );
  }

  if (isEdit && editLoadError) {
    return (
      <PageShell>
        <PageBackLink className="flex items-center gap-1 text-sm font-medium text-teal-600" />
        <p className="text-sm text-danger">{editLoadError}</p>
      </PageShell>
    );
  }

  return (
    <PageShell stickyBar>
      <FormPageHeader
        backTo="/app/purchases"
        backLabel="Purchases"
        title={isEdit ? "Edit purchase invoice" : "New purchase invoice"}
        subtitle={
          isEdit && paidOnPurchase > 0
            ? `Paid ${npr(paidOnPurchase)} on this purchase`
            : "Record supplier stock inward and VAT."
        }
      />

      <div className="space-y-3">
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

        <div className="grid grid-cols-2 gap-2">
          <FormField
            label="Invoice no."
            required={!invoiceLocked}
            hint={
              invoiceLocked
                ? "Cannot be changed after save"
                : isEdit
                  ? "One-time entry for older purchases (e.g. INV-001)"
                  : "As printed on the supplier bill"
            }
          >
            <Input
              className={inputCompact}
              placeholder={isEdit ? "e.g. INV-001" : "e.g. INV-8842"}
              value={invoiceNo}
              disabled={invoiceLocked}
              readOnly={invoiceLocked}
              onChange={(e) => setInvoiceNo(e.target.value)}
            />
          </FormField>
          <DateFormField
            label="Invoice date"
            inputClassName={inputCompact}
            value={date}
            onChange={setDate}
          />
          <DateFormField
            label="Due date"
            className="col-span-2"
            inputClassName={inputCompact}
            hint="Due today or earlier = paid (cash). Leave empty for credit."
            value={dueDate}
            onChange={setDueDate}
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Items</p>
          <p className="mb-2 text-[11px] text-muted leading-snug">
            Inv. vs received qty for short delivery. UOM from product; stock in base units.
          </p>
          <div className="space-y-2">
            {lines.map((line) => {
              const short = line.invoiceQty - line.receivedQty;
              const isShort = short > 0 && line.productId;
              const product = PRODUCTS.find((p) => p.id === line.productId);
              const uomChoices = product ? productUomChoices(product, line.uom) : [line.uom || "PCS"];
              const stockNote =
                product && line.receivedQty > 0
                  ? `+${lineForStockRpc(line).receivedQty} ${product.uom}`
                  : null;

              return (
                <Card key={line.id} className={isShort ? "border-warning/50" : ""}>
                  <CardContent className="space-y-1.5 p-2.5">
                    <div className="flex items-start gap-1.5">
                      <div className="min-w-0 flex-1">
                        <EntityPicker
                          placeholder="Search product"
                          options={PRODUCTS.map((p) => ({
                            id: p.id,
                            label: p.name,
                            sub: `${p.uom} · buy ${npr(p.costPrice)}`,
                          }))}
                          value={line.productId}
                          onChange={(id, opt) => applyProductToLine(line.id, id, opt.label)}
                          onClear={() =>
                            updateLine(line.id, {
                              productId: "",
                              productName: "",
                              uom: "PCS",
                              invoiceQty: 1,
                              receivedQty: 1,
                              cost: 0,
                            })
                          }
                          entityLabel="product"
                          onCreateNew={() => openProductModal(line.id)}
                          onCreateNewWithQuery={(q) => openProductModal(line.id, undefined, q)}
                        />
                      </div>
                      {line.productId ? (
                        <button
                          type="button"
                          title="Edit product"
                          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border-subtle text-muted hover:bg-slate-50 hover:text-teal-600"
                          onClick={() => openProductModal(line.id, line.productId)}
                        >
                          <Pencil size={14} />
                        </button>
                      ) : null}
                    </div>
                    {product?.uomConversion ? (
                      <p className="text-[10px] font-medium text-emerald-700">
                        {conversionLabel(product.uomConversion, product.uom)}
                      </p>
                    ) : null}

                    <div className="grid grid-cols-4 gap-1.5">
                      <CompactField label="UOM">
                        <Select
                          className={inputCompact}
                          value={line.uom || "PCS"}
                          disabled={!line.productId}
                          onChange={(e) => handleLineUomChange(line.id, line.productId, e.target.value)}
                        >
                          {uomChoices.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </Select>
                      </CompactField>
                      <CompactField label="Inv. qty">
                        <NumericInput
                          {...numericQtyProps}
                          className={inputCompact}
                          min={0}
                          value={line.invoiceQty}
                          onChange={(v) => {
                            const invoiceQty = Math.max(0, v);
                            updateLine(line.id, {
                              invoiceQty,
                              receivedQty:
                                line.receivedQty > invoiceQty ? invoiceQty : line.receivedQty,
                            });
                          }}
                        />
                      </CompactField>
                      <CompactField label="Rcvd">
                        <NumericInput
                          {...numericQtyProps}
                          className={inputCompact}
                          min={0}
                          max={line.invoiceQty}
                          value={line.receivedQty}
                          onChange={(v) =>
                            updateLine(line.id, {
                              receivedQty: Math.min(Math.max(0, v), line.invoiceQty),
                            })
                          }
                        />
                      </CompactField>
                      <CompactField label="Buy excl.">
                        <NumericInput
                          {...numericPriceProps}
                          className={inputCompact}
                          min={0}
                          value={line.cost}
                          onChange={(v) => updateLine(line.id, { cost: v })}
                        />
                      </CompactField>
                    </div>

                    {product && line.receivedQty > 0 ? (
                      <p className="text-[10px] text-teal-700">
                        {lineUomQtyHint(line.receivedQty, line.uom, product)}
                      </p>
                    ) : null}

                    {line.productId && line.cost > 0 ? (
                      <p className="text-[10px] text-muted">
                        Incl. VAT ({vatPct}%):{" "}
                        <strong className="text-foreground">
                          {nprNum(addVatToExcl(line.cost, vatPct))}
                        </strong>{" "}
                        per {line.uom}
                      </p>
                    ) : null}

                    {line.productId ? (
                      <p className="text-[10px] leading-snug text-muted">
                        <span>
                          Excl.{" "}
                          <strong className="text-foreground">
                            {nprNum(lineExcl(line, line.invoiceQty))}
                          </strong>
                          {vatPct > 0 ? (
                            <>
                              {" "}
                              · VAT {nprNum(lineVat(line, line.invoiceQty))}
                            </>
                          ) : null}
                        </span>
                        <span className="text-gray-300"> · </span>
                        <span className={isShort ? "text-warning-foreground" : ""}>
                          Rcv. incl. <strong>{nprNum(lineIncl(line, line.receivedQty))}</strong>
                        </span>
                        {isShort ? (
                          <>
                            <span className="text-gray-300"> · </span>
                            <span className="font-medium text-amber-800">
                              Short {short} {line.uom}
                            </span>
                          </>
                        ) : null}
                        {stockNote ? (
                          <>
                            <span className="text-gray-300"> · </span>
                            <span className="font-medium text-teal-700">Stock {stockNote}</span>
                          </>
                        ) : null}
                      </p>
                    ) : null}

                    {lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLine(line.id)}
                        className="flex items-center gap-1 text-[10px] text-danger"
                      >
                        <Trash2 size={11} /> Remove
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

        {hasShort && (
          <div className="flex flex-wrap gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2">
            <span className="text-[10px] font-semibold text-amber-900">Short receive:</span>
            {shortLines.map((l) => (
              <Badge key={l.id} variant="warning" className="text-[9px]">
                {l.productName}: {l.invoiceQty - l.receivedQty} {l.uom}
              </Badge>
            ))}
          </div>
        )}

        {lines.some((l) => l.productId) && (
          <div className="rounded-lg border border-dashed border-teal-200/80 bg-teal-50/30 px-3 py-2 text-xs leading-relaxed space-y-1">
            <div className="flex justify-between gap-2">
              <span className="text-muted">Subtotal (excl. VAT)</span>
              <span className="font-semibold tabular-nums">
                {npr(hasShort ? totalReceivedExcl : totalInvoicedExcl)}
              </span>
            </div>
            {vatPct > 0 && (
              <div className="flex justify-between gap-2">
                <span className="text-muted">VAT ({vatPct}%)</span>
                <span className="font-semibold tabular-nums">
                  {npr(hasShort ? totalReceivedVat : totalInvoicedExcl > 0 ? totalInvoicedIncl - totalInvoicedExcl : 0)}
                </span>
              </div>
            )}
            <div className="flex justify-between gap-2 border-t border-teal-200/60 pt-1">
              <span className="font-semibold text-foreground">
                {vatPct > 0 ? `Total (incl. ${vatPct}% VAT)` : "Total"}
              </span>
              <span className="font-bold tabular-nums">
                {npr(hasShort ? totalReceivedIncl : totalInvoicedIncl)}
              </span>
            </div>
            {hasShort && (
              <p className="text-amber-800 text-[10px]">
                Invoiced {npr(totalInvoicedIncl)} · Short −
                {npr(totalInvoicedIncl - totalReceivedIncl)}
              </p>
            )}
          </div>
        )}
      </div>

      {productModal ? (
        <ProductQuickModal
          open
          productId={productModal.productId}
          initialName={productModal.initialName}
          onClose={() => setProductModal(null)}
          onSaved={(id) => handleProductSaved(productModal.lineId, id)}
        />
      ) : null}

      <ConfirmDialog
        open={saveConfirm !== null}
        title={saveConfirm?.title ?? ""}
        description={saveConfirm?.content}
        confirmLabel={saveConfirm?.confirmLabel ?? "Confirm"}
        cancelLabel="Cancel"
        loading={saving}
        onConfirm={() => void performSave()}
        onCancel={() => {
          if (!saving) setSaveConfirm(null);
        }}
      />

      <StickyBar
        compact
        rows={[
          ...(vatPct > 0
            ? ([
                ["Subtotal excl.", npr(hasShort ? totalReceivedExcl : totalInvoicedExcl)],
                [`VAT (${vatPct}%)`, npr(hasShort ? totalReceivedVat : totalInvoicedIncl - totalInvoicedExcl)],
              ] as [string, string][])
            : []),
          [
            vatPct > 0 ? `Total (incl. ${vatPct}% VAT)` : "Total",
            npr(hasShort ? totalReceivedIncl : totalInvoicedIncl),
          ],
        ]}
        action={isEdit ? "Update purchase" : "Save"}
        onAction={handleSave}
        loading={saving}
        disabled={!supplierId || lines.every((l) => !l.productId)}
      />
    </PageShell>
  );
};
