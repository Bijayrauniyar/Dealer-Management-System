import { useEffect, useState, type ReactNode } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/app/PageShell";
import { FormField } from "@/components/app/FormField";
import { EntityPicker } from "@/components/app/EntityPicker";
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
import { numericMoneyProps, numericQtyProps, roundMoney } from "@/lib/money";
import { fetchPurchaseDetailLive } from "@/lib/live/domainLive";
import type { Product } from "@/domain/types";
import {
  billQtyToBaseUnits,
  conversionLabel,
  priceForPackFromBase,
  productUomChoices,
} from "@/lib/uom";
import { npr, nprNum, toDateInput } from "@/lib/utils";

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
        setLines(
          detail.lines.length
            ? detail.lines.map((l, i) => ({
                id: i + 1,
                productId: l.productId,
                productName: l.productName,
                uom: "PCS",
                invoiceQty: l.qty,
                receivedQty: l.qty,
                cost: l.rateExcl,
              }))
            : [mkLine()],
        );
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
      cost: costExclForProductUom(product, uom, vatPct),
    });
  };

  const handleLineUomChange = (lineId: number, productId: string, newUom: string) => {
    const product = PRODUCTS.find((p) => p.id === productId);
    if (!product) {
      updateLine(lineId, { uom: newUom });
      return;
    }
    updateLine(lineId, { uom: newUom, cost: costExclForProductUom(product, newUom, vatPct) });
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

  const handleSave = async () => {
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
    const rpcLines = lines
      .filter((l) => l.productId && l.receivedQty > 0)
      .map((l) => {
        const { receivedQty, rateExcl } = lineForStockRpc(l);
        return { productId: l.productId, receivedQty, rateExcl };
      });

    if (isEdit && totalReceivedIncl < paidOnPurchase) {
      toast.error(
        `Received total (${npr(totalReceivedIncl)}) cannot be less than already paid (${npr(paidOnPurchase)}).`,
      );
      return;
    }

    setSaving(true);
    try {
      if (isEdit && editPurchaseId) {
        await commitPurchaseUpdate({
          purchaseId: editPurchaseId,
          supplierId,
          purchaseDate: date,
          lines: rpcLines,
          ...(!invoiceLocked && normalizedInvoice
            ? { supplierInvoiceNo: normalizedInvoice }
            : {}),
        });
        if (!invoiceLocked && normalizedInvoice) setInvoiceLocked(true);
        const label = normalizedInvoice || "Purchase";
        toast.success(`${label} updated. Stock adjusted.`);
        navigate(`/app/purchases/${editPurchaseId}`, { replace: true });
      } else {
        const { purchaseId } = await commitPurchase({
          supplierId,
          purchaseDate: date,
          supplierInvoiceNo: normalizedInvoice,
          totalReceived: totalReceivedIncl,
          lines: rpcLines,
        });
        const label = normalizedInvoice;
        toast.success(
          hasShort
            ? `Invoice ${label} saved. Stock updated. ${shortLines.length} short line(s).`
            : `Invoice ${label} saved. Stock updated.`,
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
    }
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
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-3 flex items-center gap-1 text-sm font-medium text-teal-600"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <p className="text-sm text-danger">{editLoadError}</p>
      </PageShell>
    );
  }

  return (
    <PageShell stickyBar>
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-3 flex items-center gap-1 text-sm font-medium text-teal-600"
      >
        <ArrowLeft size={16} /> Back
      </button>
      <h1 className="mb-1 text-lg font-semibold">{isEdit ? "Edit purchase invoice" : "New purchase invoice"}</h1>
      {isEdit && paidOnPurchase > 0 && (
        <p className="mb-3 text-sm text-muted">Paid {npr(paidOnPurchase)} on this purchase</p>
      )}

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
          <FormField label="Invoice date">
            <Input className={inputCompact} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </FormField>
          <FormField label="Due date" className="col-span-2">
            <Input
              className={inputCompact}
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </FormField>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Items</p>
            <Button variant="ghost" size="sm" onClick={addLine}>
              <Plus size={14} /> Add
            </Button>
          </div>
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
                          cost: 0,
                        })
                      }
                      entityLabel="product"
                    />
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
                          {...numericMoneyProps}
                          className={inputCompact}
                          min={0}
                          value={line.cost}
                          onChange={(v) => updateLine(line.id, { cost: v })}
                        />
                      </CompactField>
                    </div>

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
