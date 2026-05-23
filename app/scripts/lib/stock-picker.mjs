/**
 * Sale product picker stock status (keep in sync with src/lib/stockAlert.ts).
 */

export function effectiveMinQtyPcs(product) {
  const base = Number(product.minQty) || 0;
  const conv = product.uomConversion;
  const packMin = Number(product.minQtyPack ?? 0);
  if (conv && packMin > 0 && conv.piecesPerPack >= 2) {
    return Math.max(base, packMin * conv.piecesPerPack);
  }
  return base;
}

export function isLowStock(product) {
  return product.onHand <= effectiveMinQtyPcs(product);
}

export function productStockStatus(product) {
  if (product.onHand <= 0) return "out";
  if (isLowStock(product)) return "low";
  return "in_stock";
}

export function productPickerOptionMeta(product, opts = {}) {
  const status = productStockStatus(product);
  const uom = product.uom || "PCS";
  const qtyLabel = `${product.onHand} ${uom}`;
  const disabled = status === "out" && !opts.allowOutOfStockSelect;

  let sub;
  if (status === "out") sub = `Out of stock · ${qtyLabel}`;
  else if (status === "low") sub = `Low stock · ${qtyLabel}`;
  else sub = `${qtyLabel} in stock`;

  const tone = status === "out" ? "out" : status === "low" ? "low" : "default";
  return { disabled, sub, tone };
}

export function buildSaleProductPickerOptions(products, lineProductIds = []) {
  const allowIds = new Set(lineProductIds);
  const options = products.map((p) => {
    const meta = productPickerOptionMeta(p, { allowOutOfStockSelect: allowIds.has(p.id) });
    return {
      id: p.id,
      label: p.name,
      sub: meta.sub,
      disabled: meta.disabled,
      tone: meta.tone,
    };
  });
  const rank = (tone) => (tone === "out" ? 2 : tone === "low" ? 1 : 0);
  return options.sort(
    (a, b) => rank(a.tone) - rank(b.tone) || a.label.localeCompare(b.label),
  );
}
