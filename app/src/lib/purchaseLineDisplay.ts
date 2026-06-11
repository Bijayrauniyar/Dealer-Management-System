import type { Product, ProductUomConversion } from "@/domain/types";
import { billQtyToBaseUnits } from "@/lib/uom";

/** Bill/print row: prefer pack qty when base qty divides evenly. */
export function purchaseLineQtyDisplay(
  baseQty: number,
  baseUom: string,
  conversion: ProductUomConversion | null,
): { qty: number; uom: string; sub: string | null } {
  const q = Number(baseQty) || 0;
  const u = baseUom.trim() || "PCS";
  if (!conversion || q <= 0) {
    return { qty: q, uom: u, sub: null };
  }
  if (q % conversion.piecesPerPack === 0) {
    const packQty = q / conversion.piecesPerPack;
    return {
      qty: packQty,
      uom: conversion.packUom,
      sub: `${q} ${u}`,
    };
  }
  const packQty = q / conversion.piecesPerPack;
  const packLabel = Number.isInteger(packQty) ? String(packQty) : packQty.toFixed(2);
  return {
    qty: q,
    uom: u,
    sub: `${packLabel} ${conversion.packUom}`,
  };
}

/** Sales/purchase bill line — show entered UOM + alternate (pack ↔ PCS). */
export function billLineQtyDisplay(
  billQty: number,
  billUom: string,
  product: Product | null | undefined,
): { qty: number; uom: string; sub: string | null } {
  const q = Number(billQty) || 0;
  const u = (billUom || "PCS").trim() || "PCS";
  if (!product || q <= 0) return { qty: q, uom: u, sub: null };
  const baseUom = product.uom?.trim() || "PCS";
  const conv = product.uomConversion ?? null;
  const baseQty = billQtyToBaseUnits(q, u, baseUom, conv);
  if (conv && u === conv.packUom) {
    return { qty: q, uom: u, sub: `${baseQty} ${baseUom}` };
  }
  if (conv && u === baseUom) {
    const alt = purchaseLineQtyDisplay(baseQty, baseUom, conv);
    if (alt.sub && alt.uom !== baseUom) {
      return { qty: q, uom: u, sub: `${alt.qty} ${alt.uom}` };
    }
  }
  return { qty: q, uom: u, sub: null };
}
