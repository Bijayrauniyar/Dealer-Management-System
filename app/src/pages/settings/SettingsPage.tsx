import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Building2, Phone, MapPin, FileText, Receipt, SlidersHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import { ExportSection } from "@/pages/settings/ExportSection";
import { PageShell } from "@/components/app/PageShell";
import { FormField } from "@/components/app/FormField";
import { StickyBar } from "@/components/app/StickyBar";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/app/NumericInput";
import { numericPercentProps } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";
import { DOMAIN_QUERY_KEY } from "@/lib/live/domainLive";
import {
  taxFieldsForSave,
  taxKindFromSettings,
  taxNumberFromSettings,
  type TaxRegistrationKind,
} from "@/lib/billDisplay";
import { LIST_PAGE_SIZE_OPTIONS, parseListPageSize } from "@/lib/listPageSize";
import { Select } from "@/components/ui/select";
import { ProductCategoriesSection } from "@/components/app/ProductCategoriesSection";
import { ProductUnitsSection } from "@/components/app/ProductUnitsSection";
import { PageBackLink } from "@/components/app/PageBackLink";
import { SegmentedTabs } from "@/components/app/patterns";
import { SubscriptionSection } from "@/pages/settings/SubscriptionSection";
import {
  parsePurchaseBillPriceMode,
  parseSalesBillPriceMode,
  type PurchaseBillPriceMode,
  type SalesBillPriceMode,
} from "@/lib/billPriceDisplay";
import {
  createSalesBillQrSignedUrl,
  uploadSalesBillQrImage,
} from "@/lib/salesBillQrStorage";

const SectionTitle = ({ icon: Icon, label }: { icon: React.ElementType; label: string }) => (
  <div className="mb-3 mt-6 flex items-center gap-2 first:mt-0">
    <Icon size={15} className="text-teal-600" />
    <p className="text-xs font-bold uppercase tracking-wider text-teal-600">{label}</p>
  </div>
);


type TenantSettingsRow = {
  name: string;
  legal_name: string | null;
  region: string | null;
  phone: string | null;
  mobile: string | null;
  email: string | null;
  address_line1: string | null;
  address_line2: string | null;
  district: string | null;
  province: string | null;
  country: string;
  pan_number: string | null;
  vat_registered: boolean;
  vat_number: string | null;
  invoice_prefix: string;
  bill_footer: string | null;
  overdue_days: number;
  due_soon_days: number;
  default_markup_pct: number;
  default_min_qty: number;
  default_min_pack_qty: number;
  default_vat_pct?: number;
  product_categories?: unknown;
  product_units?: unknown;
  allow_stock_adjustment?: boolean | null;
  list_page_size?: number | null;
  show_district_province_on_bill?: boolean | null;
  support_phone?: string | null;
  support_email?: string | null;
  support_whatsapp?: string | null;
  sales_bill_price_mode?: string | null;
  purchase_bill_price_mode?: string | null;
  sales_bill_qr_image_url?: string | null;
  sales_bill_qr_bank_text?: string | null;
  sales_bill_qr_enabled?: boolean | null;
  sales_bill_qr_object_path?: string | null;
};

const SETTINGS_TABS = [
  { id: "shop", label: "Business" },
  { id: "bills", label: "Bills & tax" },
  { id: "catalog", label: "Catalog & stock" },
  { id: "data", label: "Data & account" },
] as const;

type SettingsTab = (typeof SETTINGS_TABS)[number]["id"];

function normalizeSettingsTab(raw: string | undefined): SettingsTab | null {
  if (!raw) return null;
  const legacy: Record<string, SettingsTab> = {
    business: "shop",
    stock: "catalog",
    export: "data",
    shop: "shop",
    bills: "bills",
    catalog: "catalog",
    data: "data",
  };
  return legacy[raw] ?? null;
}

function initialSettingsTab(location: ReturnType<typeof useLocation>): SettingsTab {
  const raw = (location.state as { settingsTab?: string } | null)?.settingsTab;
  return normalizeSettingsTab(raw) ?? "shop";
}

export function SettingsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tenantId, signOut } = useAuth();
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const [name, setName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [region, setRegion] = useState("");
  const [phone, setPhone] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [addr1, setAddr1] = useState("");
  const [addr2, setAddr2] = useState("");
  const [district, setDistrict] = useState("");
  const [province, setProvince] = useState("");
  const [taxKind, setTaxKind] = useState<TaxRegistrationKind>("pan");
  const [taxNumber, setTaxNumber] = useState("");
  const [prefix, setPrefix] = useState("INV");
  const [billFooter, setBillFooter] = useState("");
  const [overdueDays, setOverdueDays] = useState(7);
  const [dueSoonDays, setDueSoonDays] = useState(3);
  const [defaultMarkupPct, setDefaultMarkupPct] = useState(0);
  const [defaultMinQty, setDefaultMinQty] = useState(20);
  const [defaultMinPackQty, setDefaultMinPackQty] = useState(2);
  const [defaultVatPct, setDefaultVatPct] = useState(13);
  const [productCategories, setProductCategories] = useState<string[]>(["General"]);
  const [productUnits, setProductUnits] = useState<string[]>(["PCS", "Pkt", "Box", "Ctn", "Doz", "Ltr", "Kg"]);
  const [allowStockAdjustment, setAllowStockAdjustment] = useState(false);
  const [listPageSize, setListPageSize] = useState(10);
  const [showDistrictOnBill, setShowDistrictOnBill] = useState(false);
  const [salesBillPriceMode, setSalesBillPriceMode] = useState<SalesBillPriceMode>("mrp");
  const [purchaseBillPriceMode, setPurchaseBillPriceMode] =
    useState<PurchaseBillPriceMode>("rate_excl");
  const [salesBillQrEnabled, setSalesBillQrEnabled] = useState(false);
  const [salesBillQrObjectPath, setSalesBillQrObjectPath] = useState("");
  const [salesBillQrBankText, setSalesBillQrBankText] = useState("");
  const [qrPreviewUrl, setQrPreviewUrl] = useState("");
  const [qrChosenFileName, setQrChosenFileName] = useState("");
  const [uploadingQr, setUploadingQr] = useState(false);
  const qrFileInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<SettingsTab>(() => initialSettingsTab(location));
  const [saving, setSaving] = useState(false);

  const applyRow = (data: TenantSettingsRow) => {
    setName(data.name);
    setLegalName(data.legal_name ?? "");
    setRegion(data.region ?? "");
    setPhone(data.phone ?? "");
    setMobile(data.mobile ?? "");
    setEmail(data.email ?? "");
    setAddr1(data.address_line1 ?? "");
    setAddr2(data.address_line2 ?? "");
    setDistrict(data.district ?? "");
    setProvince(data.province ?? "");
    const row = {
      vatRegistered: data.vat_registered,
      vatNumber: data.vat_number ?? "",
      panNumber: data.pan_number ?? "",
    };
    const kind = taxKindFromSettings(row);
    setTaxKind(kind);
    setTaxNumber(taxNumberFromSettings(row, kind));
    setPrefix(data.invoice_prefix);
    setBillFooter(data.bill_footer ?? "");
    setOverdueDays(data.overdue_days);
    setDueSoonDays(data.due_soon_days);
    setDefaultMarkupPct(data.default_markup_pct ?? 0);
    setDefaultMinQty(data.default_min_qty ?? 20);
    setDefaultMinPackQty(data.default_min_pack_qty ?? 2);
    setDefaultVatPct(Number(data.default_vat_pct ?? 13));
    const cats = Array.isArray(data.product_categories)
      ? (data.product_categories as unknown[]).map((x) => String(x).trim()).filter(Boolean)
      : ["General"];
    setProductCategories(cats.length ? cats : ["General"]);
    const units = Array.isArray(data.product_units)
      ? (data.product_units as unknown[]).map((x) => String(x).trim()).filter(Boolean)
      : ["PCS", "Pkt", "Box", "Ctn", "Doz", "Ltr", "Kg"];
    setProductUnits(units.length ? units : ["PCS"]);
    setAllowStockAdjustment(Boolean(data.allow_stock_adjustment));
    setListPageSize(parseListPageSize(data.list_page_size));
    setShowDistrictOnBill(Boolean(data.show_district_province_on_bill));
    setSalesBillPriceMode(parseSalesBillPriceMode(data.sales_bill_price_mode));
    setPurchaseBillPriceMode(parsePurchaseBillPriceMode(data.purchase_bill_price_mode));
    setSalesBillQrEnabled(Boolean(data.sales_bill_qr_enabled));
    setSalesBillQrObjectPath(data.sales_bill_qr_object_path?.trim() ?? "");
    setSalesBillQrBankText(data.sales_bill_qr_bank_text?.trim() ?? "");
    setQrChosenFileName("");
  };

  const qrFileStatus = uploadingQr
    ? "Uploading…"
    : qrChosenFileName ||
      (salesBillQrObjectPath.trim() ? "QR image saved" : "No file chosen");

  useEffect(() => {
    let cancelled = false;
    const path = salesBillQrObjectPath.trim();
    if (!path) {
      setQrPreviewUrl("");
      return;
    }
    void createSalesBillQrSignedUrl(path)
      .then((url) => {
        if (!cancelled) setQrPreviewUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrPreviewUrl("");
      });
    return () => {
      cancelled = true;
    };
  }, [salesBillQrObjectPath]);

  useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;
    void (async () => {
      setLoadError(null);
      const { data, error } = await supabase.from("tenant_settings").select("*").eq("tenant_id", tenantId).maybeSingle();

      if (cancelled) return;
      if (error) {
        setLoadError(error.message);
        toast.error(error.message);
        return;
      }
      if (data) {
        applyRow(data as TenantSettingsRow);
        setLoaded(true);
      } else {
        setLoadError("Business settings are missing. Contact support.");
        setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  const handleSave = async () => {
    if (!tenantId) return;

    if (taxKind === "vat") {
      const missing: string[] = [];
      if (!addr1.trim()) missing.push("address line 1");
      if (!taxNumber.trim()) missing.push("VAT number");
      if (!legalName.trim() && !name.trim()) missing.push("business or legal name");
      if (missing.length > 0) {
        toast.error(`VAT registration requires: ${missing.join(", ")}.`);
        return;
      }
    }

    setSaving(true);

    const basePayload = {
      name,
      legal_name: legalName || null,
      region: region || null,
      phone: phone || null,
      mobile: mobile || null,
      email: email || null,
      address_line1: addr1 || null,
      address_line2: addr2 || null,
      district: district || null,
      province: province || null,
      country: "Nepal",
      ...taxFieldsForSave(taxKind, taxNumber),
      invoice_prefix: prefix || "INV",
      bill_footer: billFooter || null,
      overdue_days: overdueDays,
      due_soon_days: dueSoonDays,
      default_markup_pct: defaultMarkupPct,
      default_min_qty: defaultMinQty,
      default_min_pack_qty: defaultMinPackQty,
      default_vat_pct: defaultVatPct,
      product_categories: productCategories,
      product_units: productUnits,
      allow_stock_adjustment: allowStockAdjustment,
    };

    type OptionalCol =
      | "list_page_size"
      | "show_district_province_on_bill"
      | "sales_bill_price_mode"
      | "purchase_bill_price_mode"
      | "sales_bill_qr_bank_text"
      | "sales_bill_qr_enabled"
      | "sales_bill_qr_object_path"
      | "product_units";
    const optionalCols: OptionalCol[] = [
      "list_page_size",
      "show_district_province_on_bill",
      "sales_bill_price_mode",
      "purchase_bill_price_mode",
      "sales_bill_qr_bank_text",
      "sales_bill_qr_enabled",
      "sales_bill_qr_object_path",
      "product_units",
    ];
    let payload: Record<string, unknown> = {
      ...basePayload,
      list_page_size: parseListPageSize(listPageSize),
      show_district_province_on_bill: showDistrictOnBill,
      sales_bill_price_mode: salesBillPriceMode,
      purchase_bill_price_mode: purchaseBillPriceMode,
      sales_bill_qr_enabled: salesBillQrEnabled,
      sales_bill_qr_object_path: salesBillQrObjectPath.trim() || null,
      sales_bill_qr_bank_text: salesBillQrBankText.trim() || null,
    };
    const skipped = new Set<OptionalCol>();
    let error: { message: string } | null = null;

    for (let attempt = 0; attempt < 8; attempt++) {
      const res = await supabase.from("tenant_settings").update(payload).eq("tenant_id", tenantId);
      error = res.error;
      if (!error) break;
      const msg = error.message;
      const missing = optionalCols.find((col) => msg.includes(col) && col in payload);
      if (!missing) break;
      skipped.add(missing);
      const next = { ...payload };
      delete next[missing];
      payload = next;
    }

    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    void queryClient.invalidateQueries({ queryKey: DOMAIN_QUERY_KEY });
    if (skipped.size > 0) {
      toast.success("Settings saved.", {
        description: "Some options need a database update — contact support if they do not apply.",
        duration: 6000,
      });
    } else {
      toast.success("Settings saved.");
    }
  };

  return (
    <PageShell stickyBar>
      <PageBackLink />
      <h1 className="mb-1 text-lg font-bold text-foreground">Settings</h1>
      <p className="mb-4 text-sm text-muted">Business profile, bills, catalog, and account</p>

      <SegmentedTabs
        value={tab}
        options={SETTINGS_TABS.map((t) => ({ id: t.id, label: t.label }))}
        onChange={setTab}
        className="mb-5"
      />

      {loadError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{loadError}</div>
      )}

      {!loaded && !loadError && <p className="text-sm text-muted">Loading…</p>}

      {loaded && tab === "data" && (
        <>
          <ExportSection />
          <SectionTitle icon={SlidersHorizontal} label="Lists &amp; display" />
          <div className="mb-6 space-y-4">
            <FormField label="Rows per page" hint="Default rows on product and customer lists">
              <Select
                className="h-10"
                value={String(listPageSize)}
                onChange={(e) => setListPageSize(parseListPageSize(Number(e.target.value)))}
                aria-label="Rows per page"
              >
                {LIST_PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n} rows
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
          <div className="mt-4 border-t border-border-subtle pt-4 pb-2">
            <SubscriptionSection />
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Account</p>
            <Button
              variant="secondary"
              size="full"
              onClick={() => {
                void signOut().then(() => {
                  toast.info("Signed out.");
                  navigate("/login", { replace: true });
                });
              }}
              className="text-danger border-danger/30 hover:bg-red-50"
            >
              Log out
            </Button>
          </div>
        </>
      )}

      {loaded && tab !== "data" && (
        <>
          {tab === "shop" && (
            <>
          <SectionTitle icon={Building2} label="Business identity" />
          <div className="space-y-4">
            <FormField label="Trading name" hint="On app header and invoices">
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </FormField>
            <FormField label="Legal / registered name">
              <Input value={legalName} onChange={(e) => setLegalName(e.target.value)} />
            </FormField>
            <FormField label="Region / depot area">
              <Input value={region} onChange={(e) => setRegion(e.target.value)} />
            </FormField>
          </div>

          <SectionTitle icon={Phone} label="Contact details" />
          <div className="space-y-4">
            <FormField label="Office / landline phone">
              <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </FormField>
            <FormField label="Mobile number">
              <Input type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} />
            </FormField>
            <FormField label="Email address">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </FormField>
          </div>

          <SectionTitle icon={MapPin} label="Business address" />
          <div className="space-y-4">
            <FormField label="Address line 1" hint="Printed on invoices">
              <Input value={addr1} onChange={(e) => setAddr1(e.target.value)} />
            </FormField>
            <FormField label="Address line 2" hint="Optional">
              <Input value={addr2} onChange={(e) => setAddr2(e.target.value)} />
            </FormField>
            <FormField label="District">
              <Input value={district} onChange={(e) => setDistrict(e.target.value)} />
            </FormField>
            <FormField label="Province">
              <Input value={province} onChange={(e) => setProvince(e.target.value)} />
            </FormField>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border-subtle bg-surface-card px-3 py-3">
              <input
                type="checkbox"
                checked={showDistrictOnBill}
                onChange={(e) => setShowDistrictOnBill(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-teal-600"
              />
              <span className="text-sm text-gray-800">
                <span className="font-medium">Include district and province on invoices</span>
                <span className="mt-0.5 block text-xs text-muted">Also print district and province on invoices.</span>
              </span>
            </label>
          </div>
            </>
          )}

          {tab === "bills" && (
            <>
          <SectionTitle icon={FileText} label="Tax &amp; registration" />
          {taxKind === "vat" && (
            <p className="mb-3 text-xs text-muted">
              VAT shops need address line 1 and VAT number for Tax Invoice.
            </p>
          )}
          <div className="space-y-4">
            <FormField label="Registration type">
              <div className="flex gap-3">
                {(["pan", "vat"] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setTaxKind(k)}
                    className={`flex-1 rounded-lg border py-2.5 text-sm font-semibold transition-colors ${
                      taxKind === k
                        ? "border-teal-600 bg-teal-600 text-white"
                        : "border-border-subtle bg-surface-card text-muted"
                    }`}
                  >
                    {k === "pan" ? "PAN" : "VAT"}
                  </button>
                ))}
              </div>
            </FormField>
            <FormField label={taxKind === "vat" ? "VAT number" : "PAN number"}>
              <Input
                value={taxNumber}
                onChange={(e) => setTaxNumber(e.target.value)}
                maxLength={9}
                placeholder={taxKind === "vat" ? "VAT registration no." : "PAN no."}
              />
            </FormField>
          </div>

          <SectionTitle icon={Receipt} label="Invoice / bill settings" />
          <div className="space-y-4">
            <FormField label="Default VAT (%)">
              <NumericInput
                {...numericPercentProps}
                min={0}
                max={100}
                value={defaultVatPct}
                onChange={setDefaultVatPct}
              />
            </FormField>
            <FormField label="Invoice prefix">
              <Input value={prefix} onChange={(e) => setPrefix(e.target.value)} maxLength={6} />
            </FormField>
            <FormField label="Currency">
              <Input value="NPR — Nepalese Rupee" disabled />
            </FormField>
            <FormField label="Bill footer text">
              <textarea
                className="w-full rounded-lg border border-border-subtle bg-surface-card px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                rows={3}
                value={billFooter}
                onChange={(e) => setBillFooter(e.target.value)}
              />
            </FormField>
            <FormField
              label="Sales bill pricing"
              hint="Bill always prints Rate column. MRP billing = label price (+ line Disc%). Sell-price billing = catalog rate. Pick before saving new bills."
            >
              <Select
                className="h-10"
                value={salesBillPriceMode}
                onChange={(e) =>
                  setSalesBillPriceMode(parseSalesBillPriceMode(e.target.value))
                }
                aria-label="Sales bill pricing mode"
              >
                <option value="mrp">MRP + line discount</option>
                <option value="selling_price">Rate (selling price)</option>
              </Select>
            </FormField>
            <FormField
              label="Purchase bill rate column"
              hint="Excl. VAT matches purchase entry. Incl. VAT shows landed unit rate."
            >
              <Select
                className="h-10"
                value={purchaseBillPriceMode}
                onChange={(e) =>
                  setPurchaseBillPriceMode(parsePurchaseBillPriceMode(e.target.value))
                }
                aria-label="Purchase bill rate column"
              >
                <option value="rate_excl">Rate excl. VAT</option>
                <option value="rate_incl">Rate incl. VAT</option>
              </Select>
            </FormField>
          </div>

          <SectionTitle icon={Receipt} label="Payment QR on sales invoice" />
          <div className="mb-4 space-y-3">
            <label className="flex items-center gap-3 rounded-lg border border-border-subtle bg-white px-4 py-3">
              <input
                type="checkbox"
                checked={salesBillQrEnabled}
                onChange={(e) => setSalesBillQrEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-border-subtle text-teal-600"
              />
              <span className="text-sm">Show payment QR on sales invoice (balance due only)</span>
            </label>
          </div>
          <div className="space-y-4">
            <FormField
              label="QR image"
              hint="PNG, JPEG, WebP, or GIF — max 1 MB. Upload replaces any previous image."
            >
              <div className="space-y-2">
                <input
                  ref={qrFileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="sr-only"
                  disabled={uploadingQr}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (!file || !tenantId) return;
                    setQrChosenFileName(file.name);
                    void (async () => {
                      setUploadingQr(true);
                      try {
                        const path = await uploadSalesBillQrImage(tenantId, file);
                        setSalesBillQrObjectPath(path);
                        const preview = await createSalesBillQrSignedUrl(path);
                        setQrPreviewUrl(preview);
                        toast.success("QR image uploaded. Save settings to apply.");
                      } catch (err) {
                        setQrChosenFileName("");
                        toast.error(err instanceof Error ? err.message : "Upload failed.");
                      } finally {
                        setUploadingQr(false);
                      }
                    })();
                  }}
                />
                <div className="flex h-11 w-full items-center gap-3 rounded-lg border border-border-subtle bg-white px-3 text-sm">
                  <button
                    type="button"
                    disabled={uploadingQr}
                    onClick={() => qrFileInputRef.current?.click()}
                    className="shrink-0 rounded border border-teal-600 bg-white px-3 py-1.5 text-sm font-medium text-teal-700 transition-colors hover:bg-teal-50 disabled:opacity-50"
                  >
                    Choose file
                  </button>
                  <span className="min-w-0 truncate text-foreground">{qrFileStatus}</span>
                </div>
                {qrPreviewUrl ? (
                  <img
                    src={qrPreviewUrl}
                    alt="Payment QR preview"
                    className="h-24 w-24 rounded border border-border-subtle object-contain"
                  />
                ) : null}
              </div>
            </FormField>
            <FormField label="Bank details" hint="Printed under the QR, e.g. NMB Bank · A/c 1234567890">
              <Input
                value={salesBillQrBankText}
                onChange={(e) => setSalesBillQrBankText(e.target.value)}
                placeholder="Bank name · account number · branch"
              />
            </FormField>
          </div>
            </>
          )}

          {tab === "catalog" && (
            <>
          <SectionTitle icon={Building2} label="Product categories" />
          <p className="mb-3 text-xs text-muted">Categories on the product form and filters.</p>
          <div className="mb-6">
            <ProductCategoriesSection
              categories={productCategories}
              onChange={setProductCategories}
            />
          </div>

          <SectionTitle icon={SlidersHorizontal} label="Product units" />
          <p className="mb-3 text-xs text-muted">
            Unit labels on the product form (e.g. PCS, Box, Bag). Save settings after changes.
          </p>
          <div className="mb-6">
            <ProductUnitsSection units={productUnits} onChange={setProductUnits} />
          </div>

          <SectionTitle icon={SlidersHorizontal} label="Stock adjustment" />
          <div className="mb-6 space-y-3">
            <label className="flex items-center gap-3 rounded-lg border border-border-subtle bg-white px-4 py-3">
              <input
                type="checkbox"
                checked={allowStockAdjustment}
                onChange={(e) => setAllowStockAdjustment(e.target.checked)}
                className="h-4 w-4 rounded border-border-subtle text-teal-600"
              />
              <span className="text-sm">
                Allow manual stock adjustment (+/− without purchase)
              </span>
            </label>
            {allowStockAdjustment && (
              <Link
                to="/app/stock-adjustment/new"
                className="block text-sm font-medium text-teal-600 hover:underline"
              >
                New stock adjustment →
              </Link>
            )}
          </div>

          <SectionTitle icon={SlidersHorizontal} label="Alerts & thresholds" />
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Overdue (days)">
                <NumericInput min={0} max={90} value={overdueDays} onChange={setOverdueDays} />
              </FormField>
              <FormField label="Due soon (days)">
                <NumericInput min={0} max={30} value={dueSoonDays} onChange={setDueSoonDays} />
              </FormField>
            </div>
            <FormField label="Default sell markup (%)">
              <NumericInput
                {...numericPercentProps}
                min={0}
                max={500}
                value={defaultMarkupPct}
                onChange={setDefaultMarkupPct}
              />
            </FormField>

            <div className="rounded-lg border border-border-subtle bg-slate-50 p-3">
              <p className="mb-2 text-xs font-semibold text-foreground">Default low stock alert</p>
              <p className="mb-3 text-[11px] text-muted leading-snug">
                Applied to new products. Stock is in pieces (PCS); Box/Ctn applies when the product has
                pack conversion.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Min (PCS / pieces)">
                  <NumericInput min={0} value={defaultMinQty} onChange={setDefaultMinQty} />
                </FormField>
                <FormField label="Min (Box / Ctn / pack)">
                  <NumericInput min={0} value={defaultMinPackQty} onChange={setDefaultMinPackQty} />
                </FormField>
              </div>
            </div>
          </div>
            </>
          )}

          <div className="h-4" />
        </>
      )}

      <StickyBar
        action="Save settings"
        onAction={() => void handleSave()}
        loading={saving}
        disabled={!loaded || !tenantId || !!loadError}
      />
    </PageShell>
  );
}
