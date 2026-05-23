import type { Product, ProductScheme } from "@/domain/types";
import type { PickerOption, PickerOptionTone } from "@/components/app/EntityPicker";
import { pickBestScheme, schemeSummaryLabel } from "@/lib/schemeApply";
import { nprNum } from "@/lib/utils";

export type ProductStockStatus = "in_stock" | "low" | "out";

/** Lowest on-hand (base PCS) before low-stock alert — uses max of PCS and pack thresholds. */
export function effectiveMinQtyPcs(product: Product): number {
  const base = Number(product.minQty) || 0;
  const conv = product.uomConversion;
  const packMin = Number(product.minQtyPack ?? 0);
  if (conv && packMin > 0 && conv.piecesPerPack >= 2) {
    return Math.max(base, packMin * conv.piecesPerPack);
  }
  return base;
}

export function isLowStock(product: Product): boolean {
  return product.onHand <= effectiveMinQtyPcs(product);
}

/** Human-readable threshold for lists (e.g. "20 PCS · 2 Box"). */
export function minStockLabel(product: Product): string {
  const parts = [`${product.minQty} ${product.uom || "PCS"}`];
  const conv = product.uomConversion;
  const packMin = Number(product.minQtyPack ?? 0);
  if (conv && packMin > 0) {
    parts.push(`${packMin} ${conv.packUom}`);
  }
  return parts.join(" · ");
}

export function productStockStatus(product: Product): ProductStockStatus {
  if (product.onHand <= 0) return "out";
  if (isLowStock(product)) return "low";
  return "in_stock";
}

function pickerTone(status: ProductStockStatus): PickerOptionTone {
  if (status === "out") return "out";
  if (status === "low") return "low";
  return "default";
}

/** Subtitle + disabled state for sale line product search. */
export function productPickerOptionMeta(
  product: Product,
  opts?: { allowOutOfStockSelect?: boolean },
): { disabled: boolean; sub: string; tone: PickerOptionTone } {
  const status = productStockStatus(product);
  const uom = product.uom || "PCS";
  const qtyLabel = `${nprNum(product.onHand)} ${uom}`;
  const priceLabel = `NPR ${nprNum(product.sellingPrice)}`;
  const disabled = status === "out" && !opts?.allowOutOfStockSelect;

  let sub: string;
  if (status === "out") {
    sub = `Out of stock · ${qtyLabel} · ${priceLabel}`;
  } else if (status === "low") {
    sub = `Low stock · ${qtyLabel} · ${priceLabel}`;
  } else {
    sub = `${qtyLabel} in stock · ${priceLabel}`;
  }

  return { disabled, sub, tone: pickerTone(status) };
}

/** Sale entry: all products, selectable stock first; out-of-stock visible but disabled. */
export function buildSaleProductPickerOptions(
  products: Product[],
  lineProductIds: Iterable<string>,
  opts?: { schemes?: ProductScheme[]; billDate?: string },
): PickerOption[] {
  const allowIds = new Set(lineProductIds);
  const schemes = opts?.schemes ?? [];
  const billDate = opts?.billDate ?? "";
  const options = products.map((p) => {
    const meta = productPickerOptionMeta(p, {
      allowOutOfStockSelect: allowIds.has(p.id),
    });
    const scheme =
      schemes.length && billDate ? pickBestScheme(schemes, p.id, billDate) : null;
    const sub = scheme ? `${meta.sub} · ${schemeSummaryLabel(scheme)}` : meta.sub;
    return {
      id: p.id,
      label: p.name,
      sub,
      disabled: meta.disabled,
      tone: meta.tone,
    };
  });

  const rank = (tone: PickerOptionTone | undefined) =>
    tone === "out" ? 2 : tone === "low" ? 1 : 0;

  return options.sort((a, b) => rank(a.tone) - rank(b.tone) || a.label.localeCompare(b.label));
}
