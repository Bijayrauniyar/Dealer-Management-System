# Marketing landing — proposed plan (approve before build)

**Status:** Draft for owner review — **no further landing code changes until you confirm.**

---

## Problem today

| Issue | Why it feels wrong |
|-------|-------------------|
| Too many sections saying similar things | Hero pains + 4 pillars + 6 distributor cards + 4 how-it-work steps + 2 phone screens |
| Hero + screens overlap | Bill in hero, then stock + purchase (purchase shot clipped, E2E supplier names) |
| Stale copy in UI | Pills still say “Wholesalers”; pains push “export for CA” before core product |
| Screenshots | Purchase invoice cropped; test labels (E2E, Matrix) on bills |
| Screen 3 | Purchase manager duplicate of “purchase” story; not a strong visual |

---

## Recommended story (one thread)

**One sentence:** BikriKhata is the **phone-first** app for Nepal **distributors, dealers & stockists** to **bill, buy, track stock, and manage credit** — not a retail POS.

**Four product pillars (what we sell):**

| # | Module | What visitor should understand |
|---|--------|--------------------------------|
| 1 | **Sales billing** | 13% VAT tax invoice, discount on bill, print/PDF/WhatsApp |
| 2 | **Purchase** | Supplier bill, VAT, stock in (text + pricing list — not necessarily a 4th screenshot) |
| 3 | **Stock** | Godown on-hand after every movement |
| 4 | **Customer credit** | Per-shop balance, overdue, payments |

**Screens (4 visuals, all different):**

| Slot | Show | Why |
|------|------|-----|
| **Hero (1)** | **Finished tax invoice** (13% VAT, discount below subtotal) | Proof of output — what the dealer sends the buyer & CA cares about |
| **Screen A (2)** | **New sales invoice** (`/app/sales/new` — customer + lines) | Shows *how* you bill (not the same as hero) |
| **Screen B (3)** | **Stock** (`/app/home?tab=stock`) | Godown numbers |
| **Screen C (4)** | **Customer credit** (`/app/home?tab=customers` — overdue/balance) | Route / dealer credit — core for distribution |

**Do not use for screenshots (for now):**

- Desktop company overview  
- Settings → Export (keep in pricing checklist only)  
- Purchase invoice in phone frame (current shot is clipped + ugly test supplier)  
- Second copy of sales bill below hero  

**Optional later:** Purchase detail screenshot only after demo seed with real supplier names and capture fix.

---

## Is the hero bill the right choice?

| Option | Pros | Cons |
|--------|------|------|
| **A. Tax invoice (recommended)** | Instant “this is billing software”; shows VAT 13%; familiar to Nepal B2B | Must be a clean capture (no E2E names) |
| B. New sale entry screen | Shows workflow | Less emotional; looks like “another form” |
| C. Home dashboard | Shows “one app” | Generic; hides VAT invoice strength |

**Recommendation:** Keep **A** for hero. Use **B** as screen A so hero = *result*, screen A = *workflow*.

---

## Proposed page order (simpler)

1. **Hero** — Headline + one-line mobile-first + 3 short pains (not 3 big cards) + CTAs + **bill**  
2. **See the app** — Mobile-first banner + **3 phones** (sale entry, stock, credit) + one line each  
3. **Who it’s for** — Audience pills + **4–6 distributor-specific bullets** (godown, route credit, pack/PCS, schemes, purchase, B2B VAT) — **no duplicate of section 2**  
4. **How it works** — 4 steps (setup → bill → buy & collect → review) — export only in step 4 as optional  
5. **Pricing** — NPR 3,000 + full checklist (unchanged style)  
6. **FAQ** → **Contact** → footer  

**Remove or shrink:**

- Separate “4 feature pillar” card grid (merge into “Who it’s for” or hero copy) — avoids triple feature list  
- Long “Example: your van returns…” paragraphs under each phone  

---

## Copy — proposed rewrite (English)

### Hero headline (pick one)

- **H1-a:** `Sales, purchase, stock & credit for Nepal distributors, dealers & stockists`  
- **H1-b:** `Bill, stock, and dealer credit — from your godown phone`  
- **H1-c (keep current):** `Manage Stock, Sales, Credit & Customers in One Place`

### Hero sub (pick one)

- **S-a:** `Mobile-first — run the full business in your phone browser. Laptop is optional.`  
- **S-b:** `Tax invoices with 13% VAT, godown stock, supplier purchases, and per-shop credit — one login.`  

### Three pains under hero (replace current 3 cards)

1. **Bill with 13% VAT** — Line and bill discount; print, PDF, or WhatsApp.  
2. **Stock = godown** — One on-hand number after sales, purchases, returns, and damage.  
3. **Credit on the route** — Who owes what and who is overdue before the next load.  

### Three phone captions

| Screen | Title | One line |
|--------|-------|----------|
| A | Create sales invoice | Pick customer, add lines, schemes — stock checks on save. |
| B | Stock manager | On-hand by product for the godown and van. |
| C | Customer credit | Balance, overdue, and payments per shop. |

### “Who it’s for” section title

- `Built for distribution — not retail POS`  
- Sub: `Godown + counter, route credit, pack/PCS, and B2B tax invoices.`

### Wording — Nepal ICP (confirmed)

Use **“distributors, dealers & stockists”** (or shorter **“distribution businesses”** in tight spaces).  
Avoid **“wholesalers” alone** — it misses dealers and stockists.

---

## Screenshots — how we fix “cut wrongly”

**Before capture:**

1. `npm run seed:demo` (or manual) with **realistic names** — shop, customers, suppliers, products (no E2E/Matrix in frame).  
2. Script sets shop to e.g. **Shree Bajrang Traders**, Birgunj.  
3. One **sales bill** with **13% VAT + bill discount** for hero.  

**Capture rules:**

| Asset | Route | Technique |
|-------|-------|-----------|
| `mobile-bill.png` | Bill detail | Screenshot `#bill-print-root` only, scale ~0.78, padding; verify VAT row + discount row visible |
| `mobile-sales-new.png` | `/app/sales/new` | Full `main` at 390×844, scroll top |
| `mobile-inventory.png` | `?tab=stock` | Full `main`, scroll top |
| `mobile-customers.png` | `?tab=customers` | Full `main`, filter “overdue” or “dues” if possible |

**Delete from landing:** `mobile-purchase.png` until we have a clean purchase capture.

**QA checklist (you approve screenshots):**

- [ ] Shop name looks real (not Matrix / MPRV test codes in footer)  
- [ ] Customer name looks real (not E2E StockCust…)  
- [ ] No horizontal clip on invoice  
- [ ] Bottom nav not cut mid-icon (or crop intentionally with padding)  

---

## What we will change in code (after your OK)

- [ ] Reorder/trim sections per plan above  
- [ ] Update `landingContent.ts`, `productBrand.ts`, pains, distributor pills (sync all “wholesalers”)  
- [ ] `ESSENTIAL_SCREENS` → 3 items: sales-new, stock, customers  
- [ ] Hero stays `mobile-bill.png`  
- [ ] Improve `capture-marketing-screenshots.mjs` + optional `seed:marketing` demo names  
- [ ] Re-run `npm run capture:marketing` and you sign off PNGs  

---

## Decisions needed from you

Reply with choices (e.g. `H1-a, S-a, approve plan`):

1. **Hero:** A tax invoice / B new sale / C home?  
2. **Headline:** H1-a, H1-b, or H1-c?  
3. **Three screens:** OK with **sales new + stock + credit**? (drop purchase screenshot)  
4. **Remove the 4-card “Features” grid** and keep only “Who it’s for” + 3 phones? (yes/no)  
5. **Demo data:** OK to add a small marketing seed script with fake-but-real Nepal names for captures?  

When you confirm, we implement in one pass and send you fresh screenshots to approve.
