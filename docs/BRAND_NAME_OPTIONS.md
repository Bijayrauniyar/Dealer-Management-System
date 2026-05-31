# Product name options (Nepal wholesaler DMS)

**Status:** **Shipped — BikriKhata** ([bikrikhata.com](https://bikrikhata.com), `productBrand.ts`). Google check below was used to pick the name (May 2026).

**Navigate:** [PRODUCT_NAMING_BRIEF.md](PRODUCT_NAMING_BRIEF.md) · [GTM_NEPAL.md](GTM_NEPAL.md) · [PHASE_ROADMAP.md](PHASE_ROADMAP.md) BRAND-0

**Interim in app today:** **BikriKhata** (बिक्री + खाता — sales ledger).

---

## What the name should signal

| Must convey | Avoid |
|-------------|--------|
| Wholesaler / dealer (not retail POS only) | “ERP”, “Tally”, “Bizom” clones |
| Bills, stock, customer credit (udhar) | One client shop name in Settings only |
| Nepal-friendly (sayable in Nepali + English) | Long English-only jargon |
| Works on phone home screen + login | Generic “DMS” alone |

**Tenant shop name** (your legal/trading name) stays in **Settings** — product name is **BikriKhata**.

---

## Recommended shortlist (pick one)

### 1. **HisabKitab** (current interim) — recommended default for v1

| | |
|--|--|
| **Meaning** | Hisab (हिसाब) = accounts; Kitab (किताब) = book / ledger |
| **Tagline (EN)** | For Nepal distributors & wholesalers + detail line in `productBrand.ts` |
| **Tagline (NE optional)** | वितरकको बिल, स्टक र उधार |
| **Pitch** | “Your wholesaler’s account book — bill, stock, and udhar in one app.” |
| **Pros** | Local, memorable, not tied to ice cream; matches what you do |
| **Cons** | Slightly informal; check .com / app store later if you go public |

### 2. **Vitran** (वितरण)

| | |
|--|--|
| **Meaning** | Distribution / supply (वितरण) |
| **Tagline** | Bill, stock & credit for Nepal distributors |
| **Pitch** | “Distribution made simple — from godown to retailer.” |
| **Pros** | Professional, vertical-agnostic, short |
| **Cons** | Less obvious = “accounting”; may need subtitle on login |

### 3. **GodamHisab**

| | |
|--|--|
| **Meaning** | Godam (गोदाम) = warehouse; Hisab = accounts |
| **Tagline** | Warehouse billing & stock |
| **Pitch** | “Godown sales, stock, and udhar — one place.” |
| **Pros** | Very clear for warehouse wholesalers |
| **Cons** | Longer; “Godam” alone can sound informal |

### 4. **BikriKhata** (बिक्री खाता)

| | |
|--|--|
| **Meaning** | Sales (बिक्री) + ledger (खाता) |
| **Tagline** | Sales ledger for wholesalers |
| **Pitch** | “Your sales khata — bills and stock together.” |
| **Pros** | Strong Nepal market fit (khata = familiar) |
| **Cons** | Roman spelling varies (BikriKhata / Bikri Khata) |

### 5. **StockBill** (English-simple)

| | |
|--|--|
| **Meaning** | Literal: stock + bill |
| **Tagline** | Wholesaler invoices & inventory |
| **Pitch** | “Stock and bills for your distribution business.” |
| **Pros** | Instant understanding for demos |
| **Cons** | Generic; weaker Nepal identity |

---

## Runner-up / avoid

| Name | Note |
|------|------|
| **DealerOS** | Sounds like US placeholder — **retire** |
| **Client shop name as product** | Settings only — not BikriKhata |
| **TallyNepal / BusyClone** | Trademark / wrong expectation |
| **NepalDMS** | Too generic, weak brand |
| **Karobar** | Often means “business” generally; may confuse with Karobar-style *layout* not product |

---

## Google check (May 2026)

| Name | Search result | Verdict |
|------|----------------|---------|
| **TradePilot** | Trading bots, share apps, TradingView tools | **Avoid** — wrong industry |
| **DistriPilot** | “Distribution Pilot” AI sales; “Distro Pilot” music | **Avoid** |
| **HisabKitab** | [hisabkitabnepal.com](https://hisabkitabnepal.com/) POS/karobar; [hisabakitab.com](https://hisabakitab.com/) wholesale orders; [hisabkitab.co](https://hisabkitab.co/) India GST app | **Avoid** as product name — same niche |
| **Vitran** | [vitran.ai](https://vitran.ai/) India B2B distribution ERP; HP Gas Vitran app; electricity “Vitran Nigam” | **Avoid** alone — distributor platform conflict |
| **VitranKhata** | No single product; fragments (Vitran + Khatabook etc.) | **OK** if you want Vitran + khata |
| **BikriKhata** | No product named BikriKhata; crowded **khata** space (Karobar, Khatapana, VatKhata) | **Best balance** — unique compound, clear meaning |
| **GodamHisab** | No prominent “GodamHisab” app; generic hisab/khata noise in India | **Good** — wholesaler-specific |
| **KhataBill** | No “KhataBill” in Nepal; Khata* names everywhere | **OK** — check domain |
| **VitranBill** | Not found in Nepal billing search | **OK** — coined, register domain early |
| **Karobar** | Dominant Nepal app [karobarapp.com](https://www.karobarapp.com/) | **Never** — taken |

**Nepal market (positioning, not product names):** Karobar, Khatapana, Tigg, Nepular, Vyapar, Byaparo, BizPro, BISage, CrossOver — all compete on billing/stock/IRD. Your name should **not** sound like another hisab-kitab POS.

**Recommended pick after search:** **BikriKhata** or **GodamHisab** (tagline: *Wholesaler billing, stock & credit*).

---

## After you confirm

1. Set `PRODUCT_DISPLAY_NAME`, `PRODUCT_TAGLINE`, `PWA_DESCRIPTION` in `app/src/config/productBrand.ts`.
2. `npm run build` — updates PWA manifest + `index.html` title/theme.
3. Optional: Nepali subtitle on login (`RegisterPage` / `LoginPage`) — second line only.
4. Repo folder rename on disk is **optional**; production domain **bikrikhata.com** needs Supabase Auth URLs ([deployment.md](deployment.md)).

---

## Technical branding map

| Surface | Source |
|---------|--------|
| Login / Register title | `productBrand.ts` → `PRODUCT_DISPLAY_NAME` |
| Browser tab | `BRAND_HTML_TITLE` + `main.tsx` |
| PWA name / theme | `vite.config.ts` reads `vite.brand.ts` → `productBrand.ts` |
| Export ZIP readme | `PRODUCT_DISPLAY_NAME` |
| Shop name on bills | **Settings** `tenant_settings.name` / `legal_name` — not product brand |

---

*2026-05-26 — suggestions for founder decision; no rename applied until confirmed.*
