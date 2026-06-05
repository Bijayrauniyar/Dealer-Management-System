# First shop onboarding (ONB-0)

**Audience:** Shop owner or implementer setting up BikriKhata for the first time.  
**Time:** ~30–60 minutes for a minimal working shop.

---

## Before you start

1. Run Supabase migrations through **0026** ([`app/supabase/README.txt`](../app/supabase/README.txt)).
2. Sign in (or register) and complete **Settings → Business** (trading name, region, contact).
3. If VAT registered: **Settings → Bills & VAT** — address line 1, VAT number, legal name (required to save).

---

## Step 1 — About 10 products

1. **Menu (☰) → Masters → Products** or bottom tab **Inventory →** open **Products** from Stock page.
2. Add products with:
   - Name, category, base unit (PCS)
   - **Opening stock** on first save (or use a purchase in step 3)
   - MRP and sell price; cost from purchase or manual
3. Optional: set **min stock** for low-stock alerts (Settings → Stock defaults apply to new products).

**Check:** Stock tab shows on-hand qty for each SKU.

---

## Step 2 — About 5 customers

1. Bottom tab **Customers →** **+** (or **New customer**).
2. Add shop name, phone, area; optional **PAN / VAT** for B2B bills.
3. Set **credit limit** if you cap how much credit you give a customer.

**Check:** Customer list shows zero outstanding until you sell on credit.

---

## Step 3 — One purchase invoice

1. **Centre + → Purchase invoice** (or menu **Entry**).
2. Pick supplier (add one under **Suppliers** if needed).
3. Enter lines with **rate excl. VAT**; VAT % from Settings applies.
4. Save — stock should increase.

**Check:** **Inventory → Stock** shows higher on-hand.

---

## Step 4 — One sales invoice

1. **Centre + → Sales invoice** (or Home **New sales invoice**).
2. Customer, lines, payment mode (cash / credit).
3. Save — print or **Share** PDF from bill detail (WhatsApp, email, etc. on phone).

**Check:** Bill detail opens; stock decreases; outstanding updates if credit.

---

## Step 5 — Export sample (optional)

1. **Settings → Export** — download customers or products CSV for your records.
2. Reports hub: **Settings → Export** link from **Reports** tab.

---

## Daily use (after onboarding)

| Task | Where |
|------|--------|
| New sale | Home or **+** sheet |
| Collect payment | **+ → Payment received** |
| Outstanding | Home card or **Reports → Outstanding** |
| Help | **Menu (☰) → Help & support** |

---

## Troubleshooting

| Issue | Action |
|-------|--------|
| Cannot save VAT settings | Fill address line 1, VAT number, business/legal name |
| Insufficient stock on sale | Check on-hand; add purchase or stock adjustment (if enabled) |
| Support fields not saving | Run migration **0025** |
| Customer PAN not saving | Run migration **0026** |

See [phase1-manual-e2e-checklist.md](backend/phase1-manual-e2e-checklist.md) for full QA after Phase 0.
