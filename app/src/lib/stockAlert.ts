import type { Product } from "@/domain/types";

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
