import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/app/PageShell";
import { FormField } from "@/components/app/FormField";
import { EntityPicker } from "@/components/app/EntityPicker";
import { StickyBar } from "@/components/app/StickyBar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/app/NumericInput";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSuppliers, useProducts, commitPurchase } from "@/store/domain";
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

function costForProductUom(product: Product, uom: string): number {
  const unit = uom.trim() || product.uom || "PCS";
  const base = product.costPrice;
  const conv = product.uomConversion;
  if (conv && unit === conv.packUom && base > 0) {
    return priceForPackFromBase({ mrp: base, sellingPrice: base }, conv.piecesPerPack).sellingPrice;
  }
  return base;
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
  const SUPPLIERS = useSuppliers();
  const PRODUCTS = useProducts();
  const [supplierId, setSupplierId] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [date, setDate] = useState(toDateInput());
  const [dueDate, setDueDate] = useState("");
  const [lines, setLines] = useState<Line[]>([mkLine()]);
  const [saving, setSaving] = useState(false);

  const lineInvoiced = (l: Line) => l.invoiceQty * l.cost;
  const lineReceived = (l: Line) => l.receivedQty * l.cost;
  const totalInvoiced = lines.reduce((s, l) => s + lineInvoiced(l), 0);
  const totalReceived = lines.reduce((s, l) => s + lineReceived(l), 0);
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
      cost: costForProductUom(product, uom),
    });
  };

  const handleLineUomChange = (lineId: number, productId: string, newUom: string) => {
    const product = PRODUCTS.find((p) => p.id === productId);
    if (!product) {
      updateLine(lineId, { uom: newUom });
      return;
    }
    updateLine(lineId, { uom: newUom, cost: costForProductUom(product, newUom) });
  };

  const lineForStockRpc = (line: Line) => {
    const product = PRODUCTS.find((p) => p.id === line.productId);
    if (!product) {
      return { receivedQty: line.receivedQty, cost: line.cost };
    }
    const baseQty = billQtyToBaseUnits(
      line.receivedQty,
      line.uom,
      product.uom,
      product.uomConversion ?? null,
    );
    const lineTotal = line.receivedQty * line.cost;
    const costPerBase = baseQty > 0 ? Math.round(lineTotal / baseQty) : line.cost;
    return { receivedQty: baseQty, cost: costPerBase };
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
    setSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 200));
      await commitPurchase({
        supplierId,
        totalReceived,
        lines: lines
          .filter((l) => l.productId && l.receivedQty > 0)
          .map((l) => {
            const { receivedQty, cost } = lineForStockRpc(l);
            return { productId: l.productId, receivedQty, cost };
          }),
      });
      toast.success(
        hasShort
          ? `Purchase saved. Stock updated. ${shortLines.length} short line(s).`
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
      <button
        onClick={() => navigate(-1)}
        className="mb-3 flex items-center gap-1 text-sm font-medium text-teal-600"
      >
        <ArrowLeft size={16} /> Back
      </button>
      <h1 className="mb-4 text-lg font-semibold">New purchase</h1>

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
          <FormField label="Invoice no.">
            <Input
              className={inputCompact}
              placeholder="INV-001"
              value={invoiceNo}
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
                      <CompactField label="Cost">
                        <NumericInput
                          className={inputCompact}
                          min={0}
                          value={line.cost}
                          onChange={(v) => updateLine(line.id, { cost: v })}
                        />
                      </CompactField>
                    </div>

                    {line.productId ? (
                      <p className="text-[10px] leading-snug text-muted">
                        <span>
                          Inv. <strong className="text-foreground">{nprNum(lineInvoiced(line))}</strong>
                        </span>
                        <span className="text-gray-300"> · </span>
                        <span className={isShort ? "text-warning-foreground" : ""}>
                          Rcv. <strong>{nprNum(lineReceived(line))}</strong>
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
          <div className="rounded-lg border border-dashed border-teal-200/80 bg-teal-50/30 px-3 py-2 text-xs leading-relaxed">
            <span className="font-semibold text-muted">Totals: </span>
            <span>Invoiced {npr(totalInvoiced)}</span>
            {hasShort && (
              <>
                <span className="text-gray-300"> · </span>
                <span>Received {npr(totalReceived)}</span>
                <span className="text-gray-300"> · </span>
                <span className="text-amber-800">Short −{npr(totalInvoiced - totalReceived)}</span>
              </>
            )}
          </div>
        )}
      </div>

      <StickyBar
        compact
        rows={[
          ...(hasShort
            ? ([
                ["Received", npr(totalReceived)],
                ["Invoiced", npr(totalInvoiced)],
              ] as [string, string][])
            : []),
          ["Purchase total", npr(hasShort ? totalReceived : totalInvoiced)],
        ]}
        action="Save"
        onAction={handleSave}
        loading={saving}
        disabled={!supplierId || lines.every((l) => !l.productId)}
      />
    </PageShell>
  );
};
