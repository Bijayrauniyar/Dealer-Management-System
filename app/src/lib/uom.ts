import type { Product, ProductUomConversion, ProductUomPrice } from "@/domain/types";
import { roundMoney } from "@/lib/money";
import { effectiveRateForRpcWithMode } from "@/lib/saleLineMath";
import type { SalesBillPriceMode } from "@/lib/billPriceDisplay";

/** Default units when tenant has no custom list (UNITS-1). */
export const DEFAULT_UOM_OPTIONS = ["PCS", "Pkt", "Box", "Ctn", "Doz", "Ltr", "Kg"] as const;

/** @deprecated Use `tenantUomOptions(business.productUnits)` */
export const UOM_OPTIONS = DEFAULT_UOM_OPTIONS;

export type UomOption = (typeof DEFAULT_UOM_OPTIONS)[number];

export function tenantUomOptions(catalog?: string[]): readonly string[] {
  if (!catalog?.length) return DEFAULT_UOM_OPTIONS;
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of catalog) {
    const u = raw.trim();
    if (!u || seen.has(u)) continue;
    seen.add(u);
    out.push(u);
  }
  return out.length ? out : DEFAULT_UOM_OPTIONS;
}

type DbUomPriceRow = { mrp?: number; sale_price?: number; sellingPrice?: number };

/** Parse DB jsonb into app map; always includes primary unit from columns. */
export function parseUomPrices(
  raw: unknown,
  primaryUom: string,
  mrp: number,
  salePrice: number,
): Record<string, ProductUomPrice> {
  const out: Record<string, ProductUomPrice> = {};
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    for (const [key, val] of Object.entries(raw as Record<string, DbUomPriceRow>)) {
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

/** Minimal product from sales_items embed for UOM-aware bill MRP. */
export function productFromSalesEmbed(row: {
  name?: string;
  unit?: string;
  mrp?: number;
  sale_price?: number;
  discount_pct?: number;
  uom_prices?: unknown;
  uom_conversion?: unknown;
}): Product {
  const uom = (row.unit as string)?.trim() || "PCS";
  const mrp = Number(row.mrp ?? 0);
  const sellingPrice = Number(row.sale_price ?? 0);
  return {
    id: "",
    name: (row.name as string) ?? "",
    category: "",
    uom,
    mrp,
    costPrice: 0,
    sellingPrice,
    uomPrices: parseUomPrices(row.uom_prices, uom, mrp, sellingPrice),
    uomConversion: parseUomConversion(row.uom_conversion, uom),
    discountPct: Number(row.discount_pct ?? 0),
    vatApplicable: false,
    onHand: 0,
    minQty: 0,
    isActive: true,
  };
}

export function parseUomConversion(
  raw: unknown,
  baseUom: string,
): ProductUomConversion | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as { pack_uom?: string; factor?: number };
  const packUom = (o.pack_uom ?? "").trim();
  const piecesPerPack = Math.round(Number(o.factor ?? 0));
  const base = baseUom.trim() || "PCS";
  if (!packUom || packUom === base || piecesPerPack < 2) return null;
  return { packUom, piecesPerPack };
}

export function toDbUomConversion(c: ProductUomConversion | null): {
  pack_uom: string;
  factor: number;
} | null {
  if (!c || c.piecesPerPack < 2) return null;
  return { pack_uom: c.packUom, factor: c.piecesPerPack };
}

/** Save shape for products.uom_prices. */
export function toDbUomPrices(
  prices: Record<string, ProductUomPrice>,
): Record<string, { mrp: number; sale_price: number }> {
  const o: Record<string, { mrp: number; sale_price: number }> = {};
  for (const [uom, p] of Object.entries(prices)) {
    if (!uom.trim()) continue;
    o[uom.trim()] = { mrp: p.mrp, sale_price: p.sellingPrice };
  }
  return o;
}

export function conversionLabel(c: ProductUomConversion, baseUom: string): string {
  return `1 ${c.packUom} = ${c.piecesPerPack} ${baseUom}`;
}

export function priceForPackFromBase(
  base: ProductUomPrice,
  piecesPerPack: number,
): ProductUomPrice {
  return {
    mrp: roundMoney(base.mrp * piecesPerPack),
    sellingPrice: roundMoney(base.sellingPrice * piecesPerPack),
  };
}

export function priceForBaseFromPack(
  pack: ProductUomPrice,
  piecesPerPack: number,
): ProductUomPrice {
  if (piecesPerPack < 1) return { mrp: 0, sellingPrice: 0 };
  return {
    mrp: roundMoney(pack.mrp / piecesPerPack),
    sellingPrice: roundMoney(pack.sellingPrice / piecesPerPack),
  };
}

/** Merge manual prices with pack conversion (auto-fill pack or base if missing). */
export function mergeUomPricesWithConversion(
  baseUom: string,
  basePrice: ProductUomPrice,
  manual: Record<string, ProductUomPrice>,
  conversion: ProductUomConversion | null,
): Record<string, ProductUomPrice> {
  const out: Record<string, ProductUomPrice> = {
    ...manual,
    [baseUom]: manual[baseUom] ?? basePrice,
  };
  if (!conversion) return out;

  const { packUom, piecesPerPack } = conversion;
  const base = out[baseUom];
  const packManual = out[packUom];

  if (packManual && packManual.mrp > 0) {
    out[packUom] = packManual;
    if (!manual[baseUom] || base.mrp <= 0) {
      out[baseUom] = priceForBaseFromPack(packManual, piecesPerPack);
    }
  } else if (base.mrp > 0) {
    out[packUom] = priceForPackFromBase(base, piecesPerPack);
  }
  return out;
}

/** UOMs configured on this product (for sale line dropdown). */
export function productUomChoices(product: Product, currentLineUom?: string): string[] {
  const set = new Set(Object.keys(product.uomPrices).filter(Boolean));
  set.add(product.uom || "PCS");
  if (product.uomConversion?.packUom) {
    set.add(product.uomConversion.packUom);
  }
  const sorted = [...set].sort((a, b) => {
    if (a === product.uom) return -1;
    if (b === product.uom) return 1;
    if (product.uomConversion?.packUom === a) return -1;
    if (product.uomConversion?.packUom === b) return 1;
    return a.localeCompare(b);
  });
  const cur = currentLineUom?.trim();
  if (cur && !sorted.includes(cur)) sorted.push(cur);
  return sorted;
}

export function linePricingForProduct(product: Product, sellUom: string): { mrp: number; rate: number } {
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

/** UOM options still available when adding another price row on product form. */
export function availableExtraUoms(
  baseUom: string,
  packUom: string,
  existing: { uom: string }[],
  catalog: readonly string[] = DEFAULT_UOM_OPTIONS,
): string[] {
  const used = new Set(
    [baseUom.trim(), packUom.trim(), ...existing.map((r) => r.uom.trim())].filter(Boolean),
  );
  return catalog.filter((u) => !used.has(u));
}

export function packUomOptions(
  baseUom: string,
  catalog: readonly string[] = DEFAULT_UOM_OPTIONS,
): string[] {
  return catalog.filter((u) => u !== baseUom);
}

/** Human hint: qty in line UOM ↔ base units (e.g. "6 Ctn = 108 PCS"). */
export function lineUomQtyHint(
  qty: number,
  lineUom: string,
  product: Product,
): string | null {
  const q = Number(qty) || 0;
  if (q <= 0) return null;
  const conv = product.uomConversion;
  if (!conv) return null;
  const base = product.uom?.trim() || "PCS";
  const unit = lineUom.trim();
  if (unit === conv.packUom) {
    const pcs = billQtyToBaseUnits(q, unit, base, conv);
    return `${q} ${conv.packUom} = ${pcs} ${base}`;
  }
  if (unit === base) {
    const packs = q / conv.piecesPerPack;
    const packLabel = Number.isInteger(packs) ? String(packs) : packs.toFixed(2);
    return `${q} ${base} = ${packLabel} ${conv.packUom}`;
  }
  return null;
}

/** Base-unit qty → bill UOM qty (e.g. 108 PCS → 6 Box when 1 Box = 18 PCS). */
export function baseUnitsToBillQty(
  baseQty: number,
  billUom: string,
  baseUom: string,
  conversion: ProductUomConversion | null,
): number {
  const q = Number(baseQty) || 0;
  if (q <= 0) return 0;
  if (
    conversion &&
    billUom.trim() === conversion.packUom &&
    baseUom.trim() !== conversion.packUom
  ) {
    return q / conversion.piecesPerPack;
  }
  return q;
}

/** Bill qty → base-unit qty for stock (e.g. 2 Box × 10 = 20 PCS). */
export function billQtyToBaseUnits(
  billQty: number,
  sellUom: string,
  baseUom: string,
  conversion: ProductUomConversion | null,
): number {
  const q = Number(billQty) || 0;
  if (q <= 0) return 0;
  if (conversion && sellUom.trim() === conversion.packUom && baseUom.trim() !== conversion.packUom) {
    return q * conversion.piecesPerPack;
  }
  return q;
}

/** RPC line item with unit for bill + stock. */
export function saleLineToRpcItem(
  line: {
    productId: string;
    qty: number;
    mrp?: number;
    rate: number;
    discountPct?: number;
    uom: string;
  },
  priceMode: SalesBillPriceMode = "mrp",
): { product_id: string; qty: number; rate: number; unit: string } {
  const uom = (line.uom || "PCS").trim() || "PCS";
  return {
    product_id: line.productId,
    qty: line.qty,
    rate: effectiveRateForRpcWithMode(
      {
        qty: line.qty,
        mrp: line.mrp ?? line.rate,
        rate: line.rate,
        discountPct: line.discountPct,
      },
      priceMode,
    ),
    unit: uom,
  };
}
