# BikriKhata USPs vs Competitors
## For Dealers & Distributors

---

## 🏆 UNIQUE SELLING PROPOSITIONS (5 Core USPs)

### **USP #1: Supplier Invoice-First Purchases** ⭐ MOST UNIQUE
**What:** Real supplier invoice numbers, immutable after save, VAT tracking  
**Why Matters:** Every good purchase comes with a real supplier invoice. BikriKhata locks this number after you save (can't edit). Most software lets you edit = audit nightmare.

**Competitor Comparison:**
- ❌ **Tally:** No supplier invoice number field (you add notes manually)
- ❌ **BUSY:** Has supplier field but editable = not audit-ready
- ❌ **MrSolution:** Similar to BUSY; editable
- ❌ **Excel/Notebooks:** Manual = prone to errors
- ✅ **BikriKhata:** Immutable supplier invoice number + VAT excl/incl split = audit-ready

**Business Impact:** Accountant accepts your books immediately. No "fix the supplier numbers" back-and-forth.

**Code Reference:** Migration `0017_purchase_vat.sql`, `PurchasePage.tsx`, `record_purchase` RPC

---

### **USP #2: Schemes (Buy-X-Get-Y) Automation** ⭐ FMCG-SPECIFIC
**What:** Set promotions on products (buy 3 boxes, get 1 free). Auto free lines on matching sales.

**Why Matters:** Ice-cream & FMCG dealers run schemes constantly. Manual free lines = errors, missed margins.

**Competitor Comparison:**
- ❌ **Tally:** No schemes feature (manual entry)
- ❌ **BUSY:** No schemes (manual)
- ❌ **MrSolution:** No schemes (manual)
- ❌ **Bizom:** Schemes exist but wrong buyer (Bizom is for brands, not dealers)
- ✅ **BikriKhata:** Schemes on products. Auto free lines. Tracks usage per scheme.

**Business Impact:** One less calculation. Margins protected. Sales team less likely to make errors.

**Code Reference:** `scheme_tracker` table, `app/src/pages/sales/SaleEntryPage.tsx` (auto free lines), migration `0006_schemes.sql`

---

### **USP #3: Real-Time Stock + Credit Sync** ⭐ OPERATIONAL EXCELLENCE
**What:** One save = stock updates + customer credit updates together. No separate manual entry.

**Why Matters:** 
- Most software: You bill → must manually update credit. Or credit updates but stock doesn't.
- BikriKhata: Bill once → stock goes down → customer balance increases → both visible instantly

**Competitor Comparison:**
- ❌ **Tally:** Bill saved, but stock/credit updates might not sync real-time
- ❌ **BUSY:** Same issue; requires manual reconciliation
- ❌ **MrSolution:** Manual steps
- ❌ **Excel/Notebooks:** Completely manual
- ✅ **BikriKhata:** Atomic transaction via RPC. Both update together or nothing.

**Business Impact:** No end-of-day reconciliation. Stock always matches credit. Home dashboard shows truth instantly.

**Code Reference:** RPCs: `create_sales_bill`, `update_sales_bill`, `apply_customer_payment`, `apply_goods_return`

---

### **USP #4: Short-Receive Tracking on Purchases** ⭐ REALISTIC FOR NEPAL
**What:** When supplier sends 90 qty but invoice says 100, BikriKhata tracks the short (10 qty). Stock goes in as 90 (what you received), not 100 (what was invoiced).

**Why Matters:** Real-world: Suppliers short-deliver constantly. Most systems just take invoice qty = wrong stock count = discrepancies.

**Competitor Comparison:**
- ❌ **Tally:** No short-receive tracking
- ❌ **BUSY:** No short-receive tracking
- ❌ **MrSolution:** Weak short-receive
- ✅ **BikriKhata:** "Inv. qty vs Rcvd" on every purchase line. Stock takes received qty. Short tracked.

**Business Impact:** Stock counts accurate on day 1. No "phantom inventory" that never arrived.

**Code Reference:** `PurchasePage.tsx` (invoice qty vs received qty UI), `record_purchase` RPC, purchase_items table

---

### **USP #5: Honest, Transparent Pricing (Per Company, Not Per Salesman)** ⭐ BUSINESS MODEL
**What:** NPR 3,000/year per company. One price. No per-user seats. No per-salesman lakhs.

**Why Matters:** Competitors (Bizom, FieldAssist) charge ₹50,000+ per salesman. Small dealer with 1–5 staff pays 1/100th the price.

**Competitor Comparison:**
- ❌ **Bizom:** ₹50,000–100,000/year per salesman (brands pay; wrong buyer)
- ❌ **FieldAssist:** ₹50,000+/year per salesman
- ⚠️ **Tally:** ₹3,000–5,000/year but desktop, outdated feel
- ⚠️ **BUSY:** ₹3,500–8,000/year; still desktop
- ✅ **BikriKhata:** NPR 3,000/year per company. Cloud + phone-first + modern UX.

**Business Impact:** Dealer actually tries it. No "too expensive" objection.

**Code Reference:** `app/src/config/launchPricing.ts`, LAUNCH_PRICE_NPR = 2999

---

## 🎯 SECONDARY USPs (Supporting Differentiators)

### **USP #6: Nepal-First Design**
**What:** Built for Nepal, not India port-over or generic.
- VAT/PAN fields (not GST)
- Bikram Sambat dates on bills
- Nepali language options (pain points in Nepali)
- "Udhar" (credit) is core, not afterthought
- Godown terminology (vs "warehouse")

**Competitor Comparison:**
- ❌ **Tally:** India-first (GST, Indian language first)
- ❌ **BUSY:** India-first
- ❌ **MrSolution:** Local but aging product
- ✅ **BikriKhata:** Built from ground up for Nepal

**Business Impact:** Dealer feels understood. Copy resonates. Business model matches dealer workflow.

**Code Reference:** `toMiti()` for Bikram Sambat dates, landingContent.ts (Nepali pain headlines), productBrand.ts (country-specific branding)

---

### **USP #7: Cloud + Phone-First (Modern UX)**
**What:** No install. Works on phone in browser. Same login on laptop. Real-time sync.

**Competitor Comparison:**
- ❌ **Tally:** Desktop install required. Dated UI. Heavy.
- ❌ **BUSY:** Desktop install. Heavy. Learning curve.
- ❌ **MrSolution:** Desktop option available but phone feel second-class
- ✅ **BikriKhata:** Mobile app in browser. Works on laptop too. Modern design.

**Business Impact:** Dealer can bill from counter on phone. Check reports on office laptop. No training on "desktop shortcuts."

**Code Reference:** React + Vite PWA, `vite.config.ts` PWA config, responsive Tailwind CSS

---

### **USP #8: Data Export & No Lock-In**
**What:** Download all your data as CSV or ZIP backup anytime. Your data, your terms.

**Competitor Comparison:**
- ⚠️ **Tally:** Data locked in proprietary format; export complex
- ⚠️ **BUSY:** Similar lock-in
- ❌ **MrSolution:** Difficult export
- ✅ **BikriKhata:** Settings → Export. CSV + ZIP. Done.

**Business Impact:** Dealer trusts you. Can leave anytime = makes them more likely to stay.

**Code Reference:** `ExportSection.tsx`, `lib/export/buildRegisters.ts`, `backupZip.ts`

---

### **USP #9: Combo: Purchase VAT (Excl/Incl) + Supplier Payable Tracking**
**What:** When you buy from supplier, track VAT separately (excl/incl). Supplier payable linked to real invoice = payment matching automatic.

**Competitor Comparison:**
- ❌ **Tally:** Purchase VAT exists but clunky
- ❌ **BUSY:** Purchase VAT but not supplier-linked
- ✅ **BikriKhata:** Purchase VAT + supplier ledger + short-receive all connected

**Business Impact:** Supplier payments never confused. Accountant loves it. No "which invoice was paid?" back-and-forth.

**Code Reference:** Migration `0017_purchase_vat.sql`, `PurchaseBillView.tsx`, `commitSupplierPaymentLive`

---

### **USP #10: Pack/PCS Pricing + Schemes Together**
**What:** Sell in boxes and pieces. Different prices per unit. Schemes work on both.

**Competitor Comparison:**
- ❌ **Tally:** One unit per product (PCS or Box, not both)
- ❌ **BUSY:** Limited multi-unit support
- ✅ **BikriKhata:** Box, PCS, custom units. Schemes work on any unit.

**Business Impact:** Ice-cream dealer: Sell 1 box (12 pieces) or 1 piece. Scheme: "Buy 3 boxes get 1 free" works across both units.

**Code Reference:** `products.uom_prices`, `products.uom_conversion`, `lib/uom.ts`, `SaleEntryPage.tsx` (pack/PCS selector)

---

## 📊 COMPETITOR COMPARISON MATRIX

| Feature | BikriKhata | Tally | BUSY | MrSolution | Bizom | Excel |
|---------|-----------|-------|------|-----------|-------|-------|
| **Supplier invoice no. (immutable)** | ✅ | ❌ | ⚠️ | ❌ | N/A | ❌ |
| **Schemes (Buy-X-get-Y)** | ✅ | ❌ | ❌ | ❌ | ⚠️ | ❌ |
| **Short-receive tracking** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Real-time stock + credit sync** | ✅ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ❌ |
| **Cloud-based** | ✅ | ❌ | ❌ | ⚠️ | ✅ | ✅ |
| **Phone-first (browser)** | ✅ | ❌ | ❌ | ❌ | ✅ | ⚠️ |
| **Nepal-specific** | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Data export (CSV/ZIP)** | ✅ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ✅ |
| **Per-company pricing** | ✅ (3k/yr) | ✅ (3-5k/yr) | ✅ (3-8k/yr) | ✅ | ❌ (50k+/yr) | ✅ |
| **Pricing per salesman** | ❌ | ❌ | ❌ | ❌ | ✅ (50k+) | ❌ |
| **Purchase VAT split** | ✅ | ⚠️ | ⚠️ | ❌ | ❌ | ❌ |
| **Multi-unit pricing** | ✅ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ❌ |
| **VAT invoices** | ✅ | ✅ | ✅ | ✅ | N/A | ❌ |
| **Customer credit** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Van/field route** | ❌ | ❌ | ⚠️ | ✅ | ✅ | ❌ |

---

## 🎯 YOUR COMPETITIVE POSITION

### **You Win On (Emphasize These):**
1. ✅ **Supplier invoicing** — Real invoice numbers, immutable, audit-ready
2. ✅ **Schemes automation** — FMCG/ice-cream specific
3. ✅ **Honest pricing** — NPR 3k/year beats ₹50k+/salesman
4. ✅ **Phone-first modern UX** — vs Tally's dated desktop feel
5. ✅ **Stock + credit real-time** — One transaction does both

### **You're Weak On (for now):**
1. ⚠️ **Van/route/offline** — You're office-based; MrSolution wins here
2. ⚠️ **Accountant depth** — Tally has 20 years of CA relationships
3. ⚠️ **IRD integration** — You complement E-Billing; not replace it
4. ⚠️ **Performance at scale** — 10,000+ bills = slow (not shipped yet)

### **You're Neutral On:**
- ⚠️ **VAT invoices** — Everyone does this
- ⚠️ **Customer credit** — Standard feature
- ⚠️ **Export** — You have it (Tier A shipped)

---

## 💡 HOW TO MARKET EACH USP

### **Messaging for Dealers:**

**If ice-cream dealer:**  
"Schemes work automatically. Buy 3 get 1 free? Free lines auto-add. No manual entry. Works on phone."

**If general FMCG wholesaler:**  
"Real supplier invoices. Short receives tracked. Stock accurate day 1. No 'phantom inventory.'"

**If accountant-involved dealer:**  
"Supplier invoice numbers locked after save. Purchase VAT excl/incl tracked. Accountant accepts books immediately."

**If price-conscious:**  
"NPR 3,000/year. Not ₹50,000 per salesman. One price, one company. No seat charges."

**If tech-averse:**  
"Bill on your phone at the counter. Check reports on laptop same day. No desktop software to install."

---

## 🚀 POSITIONING STATEMENT FOR MARKETING

**Current:** "Manage Stock, Sales, Credit & Customers in One Place"  
**Better:** "Real supplier invoices, automatic schemes, real-time stock sync — billing software for Nepal wholesalers. No per-salesman fees."

---

*This document is your competitive differentiation guide. Use these USPs in:*
- ✅ Website copy (add "Why BikriKhata vs Competitors" section)
- ✅ Sales calls (lead with relevant USP for each dealer)
- ✅ Marketing emails
- ✅ FAQ section

