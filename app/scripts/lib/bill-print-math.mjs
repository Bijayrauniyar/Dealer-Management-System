/**
 * Bill print math + DB line hydration (E2E).
 * Keep in sync with: src/lib/saleLineMath.ts, src/lib/uom.ts (hydrate path in domainLive.ts).
 */

function roundMoney(value, decimals = 2) {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function lineAmountFromMrp(l) {
  const mrp = Number(l.mrp) || 0;
  const qty = Number(l.qty) || 0;
  const disc = Number(l.discountPct ?? 0);
  if (mrp > 0) {
    return roundMoney(qty * mrp * (1 - disc / 100));
  }
  const rate = Number(l.rate) || 0;
  return roundMoney(qty * rate * (1 - disc / 100));
}

/** Line amount on printed/downloaded bill (matches DB subtotal). */
export function billLineAmount(line) {
  if (line.amount != null && Number.isFinite(line.amount)) {
    return roundMoney(line.amount);
  }
  const fromRate = roundMoney(line.qty * line.rate);
  if (line.rate > 0) return fromRate;
  return lineAmountFromMrp({
    qty: line.qty,
    mrp: line.mrp ?? line.rate,
    rate: line.rate,
    discountPct: line.discountPct,
  });
}

export function parseUomPrices(raw, primaryUom, mrp, salePrice) {
  const out = {};
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    for (const [key, val] of Object.entries(raw)) {
      const u = key.trim();
      if (!u) continue;
      out[u] = {
        mrp: Number(val.mrp ?? 0),
        sellingPrice: Number(val.sale_price ?? val.sellingPrice ?? 0),
      };
    }
  }
  const primary = primaryUom.trim() || "PCS";
  out[primary] = {
    mrp: out[primary]?.mrp ?? mrp,
    sellingPrice: out[primary]?.sellingPrice ?? salePrice,
  };
  return out;
}

export function parseUomConversion(raw, baseUom) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const packUom = (raw.pack_uom ?? "").trim();
  const piecesPerPack = Math.round(Number(raw.factor ?? 0));
  const base = baseUom.trim() || "PCS";
  if (!packUom || packUom === base || piecesPerPack < 2) return null;
  return { packUom, piecesPerPack };
}

function priceForPackFromBase(base, piecesPerPack) {
  return {
    mrp: roundMoney(base.mrp * piecesPerPack),
    sellingPrice: roundMoney(base.sellingPrice * piecesPerPack),
  };
}

function priceForBaseFromPack(pack, piecesPerPack) {
  if (piecesPerPack < 1) return { mrp: 0, sellingPrice: 0 };
  return {
    mrp: roundMoney(pack.mrp / piecesPerPack),
    sellingPrice: roundMoney(pack.sellingPrice / piecesPerPack),
  };
}

export function linePricingForProduct(product, sellUom) {
  const uom = sellUom.trim() || product.uom || "PCS";
  const entry = product.uomPrices[uom];
  if (entry && (entry.mrp > 0 || entry.sellingPrice > 0)) {
    return { mrp: entry.mrp, rate: entry.sellingPrice };
  }
  const conv = product.uomConversion;
  const base = product.uomPrices[product.uom] ?? {
    mrp: product.mrp,
    sellingPrice: product.sellingPrice,
  };
  if (conv && uom === conv.packUom && base.mrp > 0) {
    const derived = priceForPackFromBase(base, conv.piecesPerPack);
    return { mrp: derived.mrp, rate: derived.sellingPrice };
  }
  if (conv && uom === product.uom) {
    const packEntry = product.uomPrices[conv.packUom];
    if (packEntry?.mrp > 0) {
      const derived = priceForBaseFromPack(packEntry, conv.piecesPerPack);
      return { mrp: derived.mrp, rate: derived.sellingPrice };
    }
  }
  if (uom === product.uom) {
    return { mrp: product.mrp, rate: product.sellingPrice };
  }
  return { mrp: 0, rate: 0 };
}

export function productFromSalesEmbed(row) {
  const uom = (row.unit ?? "").trim() || "PCS";
  const mrp = Number(row.mrp ?? 0);
  const sellingPrice = Number(row.sale_price ?? 0);
  return {
    uom,
    mrp,
    sellingPrice,
    uomPrices: parseUomPrices(row.uom_prices, uom, mrp, sellingPrice),
    uomConversion: parseUomConversion(row.uom_conversion, uom),
  };
}

/** Same mapping as fetchSalesLive() when building bill lines from DB. */
export function hydrateBillLineFromDbItem(it) {
  const prod = Array.isArray(it.products) ? it.products[0] : it.products;
  const qty = Number(it.qty);
  const rate = Number(it.rate);
  const uom = (it.unit ?? "").trim() || prod?.unit || "PCS";
  const amount = billLineAmount({ qty, rate, discountPct: Number(prod?.discount_pct ?? 0) });
  const displayMrp = prod
    ? linePricingForProduct(productFromSalesEmbed(prod), uom).mrp
    : rate;
  return {
    uom,
    qty,
    rate,
    mrp: displayMrp > 0 ? displayMrp : rate,
    amount,
    productName: prod?.name ?? "",
  };
}

export function sumBillLineAmounts(lines) {
  return lines.reduce((s, l) => s + billLineAmount(l), 0);
}

/** Print Rate column — per PCS when pack factor supplied (sync with saleLineMath.ts). */
export function billLineRateColumnValue(line, mode, piecesPerPack) {
  const raw =
    mode === "selling_price"
      ? Number(line.rate) > 0
        ? Number(line.rate)
        : Number(line.mrp) || 0
      : Number(line.mrp) > 0
        ? Number(line.mrp)
        : Number(line.rate) || 0;
  if (piecesPerPack && piecesPerPack > 1) {
    return roundMoney(raw / piecesPerPack);
  }
  return raw;
}

export function packPiecesPerPackForLine(billUom, product) {
  const conv = product?.uomConversion;
  if (!conv || conv.piecesPerPack < 2) return undefined;
  const u = (billUom || "").trim();
  if (u === conv.packUom) return conv.piecesPerPack;
  return undefined;
}

export function ratePerBaseUnitForPrint(rate, piecesPerPack) {
  if (piecesPerPack && piecesPerPack > 1) return roundMoney(rate / piecesPerPack);
  return rate;
}
