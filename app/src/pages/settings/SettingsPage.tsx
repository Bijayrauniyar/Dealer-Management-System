import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Building2, Phone, MapPin, FileText, Receipt, SlidersHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
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
  allow_stock_adjustment?: boolean | null;
  list_page_size?: number | null;
  show_district_province_on_bill?: boolean | null;
};

const SETTINGS_TABS = [
  { id: "business", label: "Business" },
  { id: "bills", label: "Bills & VAT" },
  { id: "stock", label: "Stock" },
  { id: "export", label: "Export" },
] as const;

type SettingsTab = (typeof SETTINGS_TABS)[number]["id"];

export function SettingsPage() {
  const navigate = useNavigate();
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
  const [defaultMarkupPct, setDefaultMarkupPct] = useState(15);
  const [defaultMinQty, setDefaultMinQty] = useState(20);
  const [defaultMinPackQty, setDefaultMinPackQty] = useState(2);
  const [defaultVatPct, setDefaultVatPct] = useState(13);
  const [productCategories, setProductCategories] = useState<string[]>(["General"]);
  const [allowStockAdjustment, setAllowStockAdjustment] = useState(false);
  const [listPageSize, setListPageSize] = useState(10);
  const [showDistrictOnBill, setShowDistrictOnBill] = useState(false);
  const [tab, setTab] = useState<SettingsTab>("business");
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
    setDefaultMarkupPct(data.default_markup_pct);
    setDefaultMinQty(data.default_min_qty);
    setDefaultMinPackQty(data.default_min_pack_qty ?? 2);
    setDefaultVatPct(Number(data.default_vat_pct ?? 13));
    const cats = Array.isArray(data.product_categories)
      ? (data.product_categories as unknown[]).map((x) => String(x).trim()).filter(Boolean)
      : ["General"];
    setProductCategories(cats.length ? cats : ["General"]);
    setAllowStockAdjustment(Boolean(data.allow_stock_adjustment));
    setListPageSize(parseListPageSize(data.list_page_size));
    setShowDistrictOnBill(Boolean(data.show_district_province_on_bill));
  };

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
        setLoadError("No tenant_settings row. Run migration 0002 and ensure signup_tenant created settings.");
        setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  const handleSave = async () => {
    if (!tenantId) return;
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
      allow_stock_adjustment: allowStockAdjustment,
    };

    type OptionalCol = "list_page_size" | "show_district_province_on_bill";
    let payload: Record<string, unknown> = {
      ...basePayload,
      list_page_size: parseListPageSize(listPageSize),
      show_district_province_on_bill: showDistrictOnBill,
    };
    const skipped = new Set<OptionalCol>();
    let error: { message: string } | null = null;

    for (let attempt = 0; attempt < 4; attempt++) {
      const res = await supabase.from("tenant_settings").update(payload).eq("tenant_id", tenantId);
      error = res.error;
      if (!error) break;
      const msg = error.message;
      const missing = (["list_page_size", "show_district_province_on_bill"] as const).find(
        (col) => msg.includes(col) && col in payload,
      );
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
      const parts: string[] = [];
      if (skipped.has("list_page_size")) parts.push("rows per page needs migration 0022");
      if (skipped.has("show_district_province_on_bill")) parts.push("district on bill needs migration 0023");
      toast.success("Settings saved.", {
        description: `${parts.join("; ")}. Run SQL in app/supabase/README.txt until then.`,
        duration: 8000,
      });
    } else {
      toast.success("Settings saved.");
    }
  };

  return (
    <PageShell stickyBar>
      <h1 className="mb-1 text-lg font-bold text-foreground">Settings</h1>
      <p className="mb-4 text-sm text-muted">Business profile, stock, and data export</p>

      <div className="mb-5 flex gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1">
        {SETTINGS_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "shrink-0 rounded-md px-3 py-2 text-xs font-semibold transition-colors",
              tab === t.id ? "bg-white text-teal-700 shadow-sm" : "text-muted",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loadError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{loadError}</div>
      )}

      {!loaded && !loadError && <p className="text-sm text-muted">Loading…</p>}

      {loaded && tab === "export" && <ExportSection />}

      {loaded && tab !== "export" && (
        <>
          {tab === "business" && (
            <>
          <SectionTitle icon={SlidersHorizontal} label="Lists &amp; display" />
          <div className="mb-6 space-y-4">
            <FormField label="Rows per page">
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

          <SectionTitle icon={Building2} label="Product categories" />
          <div className="mb-6">
            <ProductCategoriesSection
              categories={productCategories}
              onChange={setProductCategories}
            />
          </div>

          <SectionTitle icon={Building2} label="Business identity" />
          <div className="space-y-4">
            <FormField label="Trading name" hint="Shown on app header and invoices">
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
            <FormField
              label="Address line 1"
              hint="Shown on printed sales and purchase invoices. Example: Ward 5, Main Road, Kathmandu."
            >
              <Input value={addr1} onChange={(e) => setAddr1(e.target.value)} />
            </FormField>
            <FormField
              label="Address line 2"
              hint="Optional second line on invoices. Example: Industrial Area, Ring Road."
            >
              <Input value={addr2} onChange={(e) => setAddr2(e.target.value)} />
            </FormField>
            <FormField label="District" hint="Stored for your business profile. Not shown on invoices unless enabled below.">
              <Input value={district} onChange={(e) => setDistrict(e.target.value)} />
            </FormField>
            <FormField label="Province" hint="Stored for your business profile. Example: Bagmati, Madhesh.">
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
                <span className="mt-0.5 block text-xs text-muted">
                  When enabled, district and province appear below address line 1 and 2.
                </span>
              </span>
            </label>
          </div>
            </>
          )}

          {tab === "bills" && (
            <>
          <SectionTitle icon={FileText} label="Tax &amp; registration" />
          <div className="space-y-4">
            <FormField
              label="Registration type"
              hint="Use PAN for non-VAT businesses. Use VAT if you are VAT registered. Only one number is saved and printed on bills."
            >
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
            <FormField
              label="Default VAT (%)"
              hint="Used on purchase bills (always) and sales bills when VAT registered"
            >
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
          </div>
            </>
          )}

          {tab === "stock" && (
            <>
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
            <FormField label="Default sell markup (%)" hint="e.g. 15 or 4.5 — used when adding new products">
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
                Applied to new products. Stock is in pieces (PCS); Box applies when the product has pack
                conversion.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Min (PCS / pieces)">
                  <NumericInput min={0} value={defaultMinQty} onChange={setDefaultMinQty} />
                </FormField>
                <FormField label="Min (Box / pack)">
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

      {tab !== "export" && (
      <StickyBar
        action="Save settings"
        onAction={() => void handleSave()}
        loading={saving}
        disabled={!loaded || !tenantId || !!loadError}
      />
      )}

      {loaded && (
        <div className="mt-4 border-t border-border-subtle pt-4 pb-6">
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
            Sign out
          </Button>
        </div>
      )}
    </PageShell>
  );
}
