import { useNavigate, useParams } from "react-router-dom";
import {FilePlus, Package, Pencil, ShoppingCart, Tag} from "lucide-react";
import { PageShell } from "@/components/app/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProducts, useSchemes } from "@/store/domain";
import {
  isLowStock,
  minStockLabel,
  productStockStatus,
} from "@/lib/stockAlert";
import {
  pickBestScheme,
  schemeSummaryLabel,
} from "@/lib/schemeApply";
import { conversionLabel } from "@/lib/uom";
import { DetailActions } from "@/components/app/DetailActions";
import {
  PURCHASE_INVOICE_LABEL,
  salesInvoiceWithProductLabel,
} from "@/lib/actionLabels";
import { npr, nprNum, toDateInput } from "@/lib/utils";
import { PageBackLink } from "@/components/app/PageBackLink";

const TODAY = toDateInput();

function stockStatusLabel(status: ReturnType<typeof productStockStatus>): string {
  if (status === "out") return "Out of stock";
  if (status === "low") return "Low stock";
  return "In stock";
}

function stockBadgeVariant(status: ReturnType<typeof productStockStatus>) {
  if (status === "out") return "danger" as const;
  if (status === "low") return "warning" as const;
  return "success" as const;
}

export const ProductDetailPage = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const PRODUCTS = useProducts();
  const SCHEMES = useSchemes();

  const product = PRODUCTS.find((p) => p.id === productId);

  if (!product) {
    return (
      <PageShell>
        <PageBackLink className="flex items-center gap-1 text-sm font-medium text-teal-600" />
        <p className="mt-8 text-center text-sm text-muted">Product not found.</p>
      </PageShell>
    );
  }

  const status = productStockStatus(product);
  const scheme = pickBestScheme(SCHEMES, product.id, TODAY);
  const uomChoices = Object.keys(product.uomPrices);

  return (
    <PageShell>
      <PageBackLink className="flex items-center gap-1 text-sm font-medium text-teal-600" />

      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold text-foreground">{product.name}</h1>
          <p className="mt-0.5 text-sm text-muted">{product.category || "—"}</p>
        </div>
        <Badge variant={stockBadgeVariant(status)}>{stockStatusLabel(status)}</Badge>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {isLowStock(product) && <Badge variant="danger">Below minimum</Badge>}
        {scheme && (
          <Badge className="bg-pink-100 text-pink-800 border-pink-200">
            {schemeSummaryLabel(scheme)}
          </Badge>
        )}
      </div>

      <Card className="mb-4">
        <CardContent className="space-y-3 p-4">
          <p className="text-sm font-semibold text-foreground">Stock</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted">On hand</p>
              <p
                className={`text-lg font-bold tabular-nums ${
                  status === "out" || status === "low" ? "text-danger" : "text-foreground"
                }`}
              >
                {nprNum(product.onHand)} {product.uom}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted">Minimum alert</p>
              <p className="text-sm font-medium text-foreground">{minStockLabel(product)}</p>
            </div>
          </div>
          {product.uomConversion && (
            <p className="text-xs text-emerald-700">
              {conversionLabel(product.uomConversion, product.uom)}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardContent className="space-y-3 p-4">
          <p className="text-sm font-semibold text-foreground">Pricing</p>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
            <div>
              <dt className="text-xs text-muted">MRP ({product.uom})</dt>
              <dd className="font-semibold">{npr(product.mrp)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Sell price</dt>
              <dd className="font-semibold text-teal-700">{npr(product.sellingPrice)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Cost</dt>
              <dd>{npr(product.costPrice)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Line discount</dt>
              <dd>{product.discountPct > 0 ? `${product.discountPct}%` : "—"}</dd>
            </div>
          </dl>
          {uomChoices.length > 1 && (
            <div className="border-t border-border-subtle pt-3">
              <p className="mb-2 text-xs font-medium text-muted">Prices by unit</p>
              <ul className="space-y-1 text-xs">
                {uomChoices.map((u) => (
                  <li key={u} className="flex justify-between gap-2">
                    <span className="text-muted">{u}</span>
                    <span className="tabular-nums">
                      MRP {npr(product.uomPrices[u]?.mrp ?? 0)} · Sell{" "}
                      {npr(product.uomPrices[u]?.sellingPrice ?? 0)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {scheme && (
        <Card className="mb-4 border-pink-200 bg-pink-50/40">
          <CardContent className="space-y-2 p-4">
            <div className="flex items-center gap-2 text-pink-900">
              <Tag size={16} />
              <p className="text-sm font-semibold">Active scheme today</p>
            </div>
            <p className="text-sm font-medium">{scheme.schemeName}</p>
            <p className="text-xs text-pink-800">{schemeSummaryLabel(scheme)}</p>
            <p className="text-xs text-muted">
              Valid {scheme.startDate} → {scheme.endDate}
            </p>
          </CardContent>
        </Card>
      )}

      <DetailActions
        actions={[
          {
            label: salesInvoiceWithProductLabel(),
            icon: FilePlus,
            variant: "primary",
            onClick: () => navigate("/app/sales/new"),
          },
          {
            label: PURCHASE_INVOICE_LABEL,
            icon: ShoppingCart,
            variant: "outline",
            onClick: () => navigate("/app/purchases/new"),
          },
          {
            label: "Edit product",
            icon: Pencil,
            variant: "outline",
            onClick: () => navigate(`/app/products/edit/${product.id}`),
          },
        ]}
      />

      {product.description && (
        <Card className="mt-4">
          <CardContent className="p-4">
            <p className="mb-1 flex items-center gap-1 text-sm font-semibold text-foreground">
              <Package size={14} /> Notes
            </p>
            <p className="text-sm text-muted">{product.description}</p>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
};
