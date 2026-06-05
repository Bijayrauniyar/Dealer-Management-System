# Phase 0 Tier B — copy-paste prompts for local Claude Code (Gemma 4 26B)

**Product:** BikriKhata · **Tier A done** · **Tier B next**

**How to use**

1. Open Claude Code at **repo root** (`havmor/`), not only `app/`.
2. Paste **System prompt** from [`GEMMA_SYSTEM_PROMPT.md`](GEMMA_SYSTEM_PROMPT.md) (section “COPY FROM HERE”) once per machine.
3. (`/init` optional — cloud Claude Code only; skip for `ollama launch claude`.)
4. For **each task below**: new chat or clear context → attach `docs/LLM_CONTEXT.md` → paste **one User block** → run verify commands → commit on branch `feature/phase0-tier-b`.
5. **You** do deploy (Part 0). **Cursor** reviews B4 (INV-1) before merging.

**CRED-0 decision:** Credit limit → **warning toast only**, save still allowed.

---

## Part 0 — YOU only (not for Gemma)

```text
I will merge and deploy myself. Do not run git push or change Supabase production.

My checklist:
1. cd app && npm run deploy:check
2. git checkout main && git pull && git merge dev && git push origin main
3. Netlify: wait for green deploy on main
4. Supabase SQL Editor: confirm migrations 0019–0023 already applied on production
5. Browser smoke: login BikriKhata → Settings save → one sale → Export CSV
6. git checkout -b feature/phase0-tier-b
```

---

## Session 0 — Bootstrap (once, before B1)

**User message:**

```text
Read docs/LLM_CONTEXT.md (attached). Summarize in 10 bullets: stack, money/stock rules, and what Tier A already shipped.

Then list the 5 Tier B tasks (B1–B5) from docs/PHASE0_TIER_B_DELEGATION.md in order.

Do not change any code in this session.
```

---

## Task B1 — Back button (UI-0.9)

**User message:**

```text
## Context
- BikriKhata — React 19 + TS + Tailwind, repo root
- Attach: docs/LLM_CONTEXT.md
- Branch: feature/phase0-tier-b
- Tier B task B1 only

## Goal
Add a reusable back control and use it on inner pages. Many pages use ad-hoc:
  <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm font-medium text-teal-600">
Replace with one component for consistency.

## Implement
1. Create app/src/components/app/PageBackLink.tsx
   - import { useNavigate } from "react-router-dom"
   - import { ArrowLeft } from "lucide-react"
   - Props: optional label default "Back", optional className, optional fallbackTo (default "/app/home")
   - onClick: navigate(-1) — same behavior as today
   - Same visual: text-sm font-medium text-teal-600, flex items-center gap-1, mb-4

2. Replace inline back buttons on inner/form/detail pages. Grep for navigate(-1) in app/src/pages/ and swap to <PageBackLink />.

3. Do NOT add back on AppShell tab home (Home/More) — only inner routes.

4. Add PageBackLink to SettingsPage (top, under title) — Settings currently has no back.

## Scope — only these areas
- app/src/components/app/PageBackLink.tsx (new)
- app/src/pages/**/*.tsx (back buttons only — no other refactors)

## Do NOT
- Change RPCs, domainLive, migrations
- Refactor PageShell or AppShell
- Change business logic

## Verify
cd app && npm run deploy:check

## Output format
1. Files changed (list)
2. Any pages you intentionally skipped
3. Manual test: Product form → Back → list
```

---

## Task B2 — VAT settings validation (VAT-0b)

**User message:**

```text
## Context
- BikriKhata — Settings save goes to tenant_settings via supabase.from().update in SettingsPage
- Attach: docs/LLM_CONTEXT.md
- Branch: feature/phase0-tier-b
- Tier B task B2 only

## Goal
When tenant is VAT-registered, block Settings save if required bill fields are missing.

## Read first
- app/src/pages/settings/SettingsPage.tsx — handleSave
- app/src/lib/billDisplay.ts — taxKind, taxFieldsForSave, TaxRegistrationKind

## Implement
In handleSave(), BEFORE setSaving(true) and BEFORE any supabase call:

If taxKind === "vat" (VAT registered):
- address line 1 (addr1) must be non-empty after trim
- taxNumber (VAT number) must be non-empty after trim
- legalName OR name must be non-empty after trim

If validation fails:
- toast.error with one clear message listing what is missing
- return (do not save)

If taxKind === "pan" only:
- no new address requirement (keep current behavior)

Optional: one-line hint under Bills & VAT tab: "VAT shops need address line 1 and VAT number for Tax Invoice."

## Scope
- app/src/pages/settings/SettingsPage.tsx only

## Do NOT
- Change migration or bill print logic
- Change tax RPCs

## Verify
cd app && npm run deploy:check

Manual:
- VAT on, empty address → save blocked
- VAT on, filled address + VAT no → save works
- PAN only → save without address OK

## Output
1. Validation rules applied
2. Exact toast messages used
```

---

## Task B3 — Credit limit warning (CRED-0, warn only)

**User message:**

```text
## Context
- Customers have creditLimit and outstanding in domain (app/src/domain/types.ts)
- SaleEntryPage saves via commitSale() → commitSaleLive → create_sales_bill / update_sales_bill
- Attach: docs/LLM_CONTEXT.md
- Branch: feature/phase0-tier-b
- Tier B task B3 only

## Goal
When a sale would push customer outstanding above credit limit, show toast.warning but ALLOW save (do not block).

## Read first
- app/src/pages/sales/SaleEntryPage.tsx — validate(), handleSave(), balanceDue, customerId
- Customer type: creditLimit, outstanding
- For edit bill: existing sale balance — adjust projected outstanding (exclude old bill balance from outstanding when isEdit if you can use existing.balance)

## Logic
On successful validate(), before or after commitSale (prefer before commit so user sees warning before navigation):

If customer.creditLimit > 0:
  projectedOutstanding = customer.outstanding + balanceDue
  (For edit: projectedOutstanding = customer.outstanding - (existing?.balance ?? 0) + balanceDue)

  If projectedOutstanding > customer.creditLimit:
    toast.warning("Credit limit exceeded", {
      description: `Limit ${npr(creditLimit)}, projected outstanding ${npr(projected)} after this bill.`,
    })
    // DO NOT return false — continue save

Use npr from @/lib/utils.

Optional (small): when customer selected, show muted hint if already over limit.

## Scope
- app/src/pages/sales/SaleEntryPage.tsx only

## Do NOT
- Block save
- Change database or RPC
- Hide credit limit field on customer form

## Verify
cd app && npm run deploy:check

Manual:
- Customer limit 100000, outstanding 90000, new credit bill balance 20000 → warning + bill saves
- creditLimit 0 → no warning

## Output
1. Formula used for edit vs new bill
2. Where warning is triggered
```

---

## Task B4 — Block oversell in DB (INV-1) — Cursor must review

**User message:**

```text
## Context
- Today: UI blocks out-of-stock on new sale lines (app/src/lib/stockAlert.ts) but RPCs still allow oversell
- Stock formula: v_stock in app/supabase/migrations/0020_stock_adjustments.sql (opening + purchased + adjusted - sold - damaged + returned)
- Pack UOM: sales_items.unit matched to uom_conversion.pack_uom multiplies qty (see 0020 sal subquery)
- Attach: docs/LLM_CONTEXT.md, docs/DEFERRED_WORK.md section INV-1
- Branch: feature/phase0-tier-b
- Tier B task B4 only — HIGH RISK SQL

## Goal
New migration 0024: reject create_sales_bill / update_sales_bill when line qty (base PCS) exceeds available stock.

## Step 1 — Read latest RPC bodies
Read FULL current definitions from repo (do not guess):
- create_sales_bill — latest in app/supabase/migrations/0010_sales_items_unit_stock.sql and any later file that replaces it
- update_sales_bill — app/supabase/migrations/0007_update_sales_bill.sql and 0010 if replaced
grep "create or replace function create_sales_bill" app/supabase/migrations/

## Step 2 — New file
app/supabase/migrations/0024_block_oversell_in_sales.sql

Include:
1. Function line_qty_to_base_pcs(p_product_id uuid, p_qty numeric, p_unit text) returns numeric
   - Same pack conversion rules as v_stock sales subquery in 0020

2. Function assert_sale_stock_available(
     p_tenant_id uuid,
     p_items jsonb,
     p_exclude_bill_id uuid default null
   ) returns void
   - Parse p_items JSON array: each element product_id, qty, unit (match existing RPC item shape — read create_sales_bill loop)
   - Sum demand per product_id
   - Available stock = same closing formula as v_stock for that tenant/product
   - When p_exclude_bill_id set: subtract that bill's sales_items from "sold" (for update_sales_bill edit)
   - If any product demand > available: raise exception 'Insufficient stock for %', product name

3. create or replace function create_sales_bill — COPY latest body, add call to assert_sale_stock_available(tenant_id, p_items, null) BEFORE inserting lines

4. create or replace function update_sales_bill — COPY latest body, pass bill id to assert with p_exclude_bill_id

Rules:
- FOC / scheme free lines (qty > 0, rate 0) still consume stock
- Multiple lines same product_id: sum qty first
- security invoker, search_path public, grant execute to authenticated (match existing)

## Step 3 — App (minimal)
- app/src/lib/live/domainLive.ts — commitSaleLive already throws on error; no change unless needed
- app/src/pages/sales/SaleEntryPage.tsx — ensure catch shows error.message (friendly if contains Insufficient stock)

## Step 4 — Tests
- app/scripts/e2e-stock-dates.mjs — update test that expects "oversell allowed" to expect RPC failure when draining last stock (or add new check)

## Step 5 — Docs
- app/supabase/README.txt — add step 25 for 0024
- docs/LLM_CONTEXT.md — one changelog bullet (you can draft text; user will commit)

## Scope
- app/supabase/migrations/0024_block_oversell_in_sales.sql
- app/scripts/e2e-stock-dates.mjs
- app/supabase/README.txt
- Optional tiny SaleEntryPage toast mapping only

## Do NOT
- Change v_stock view unless required
- Implement INV-2 (stock as-of bill date)
- Touch unrelated migrations

## Verify
cd app && npm run deploy:check
cd app && npm run e2e:smoke
cd app && npm run e2e:stock
# If .e2e-credentials.local exists:
cd app && npm run e2e:stock:live

## Output
1. Full path to migration file
2. Exact exception message text
3. Note: USER must run 0024 in Supabase SQL Editor before live test
4. List any uncertainty about latest create_sales_bill source file
```

---

## Task B5 — Notifications QA (fix only if broken)

**User message:**

```text
## Context
- Notifications built in app/src/components/app/NotificationPanel.tsx — buildNotifications(sales, products, overdueDays, dueSoonDays)
- Settings overdue_days / due_soon_days from useBusinessSettings()
- Low stock uses isLowStock from app/src/lib/stockAlert.ts
- Attach: docs/LLM_CONTEXT.md
- Branch: feature/phase0-tier-b
- Tier B task B5

## Goal
Review buildNotifications logic and fix bugs only. Do not add DB notifications table.

## Check
1. Overdue: balance > 0, dueDate past overdueDays → urgent, tab bills, linkTo /app/bills/{billNo}
2. Due soon: within dueSoonDays window, not double-counted as overdue incorrectly
3. Low stock: isLowStock(product) → tab stock, sensible title/body
4. Every linkTo route exists in AppRouter.tsx
5. Empty state when no items

## If bugs found
- Minimal fix in NotificationPanel.tsx only
- Add one comment explaining date math if non-obvious

## If no bugs
- Reply "QA code review OK" and list manual steps for human tester (do not change code)

## Scope
- app/src/components/app/NotificationPanel.tsx
- app/src/routes/AppRouter.tsx — read only unless link wrong

## Verify
cd app && npm run deploy:check

## Output
1. Findings table: issue | fixed? | file
2. Manual QA checklist for human (5 bullets)
```

---

## After all tasks — commit message (for you)

```text
Phase 0 Tier B: back nav, VAT settings validation, credit warn, oversell RPC, notifications QA
```

---

## Cursor review prompt (paste in Cursor Agent after Gemma finishes a task)

```text
Review my Tier B work for task [B1|B2|B3|B4|B5] against docs/PHASE0_TIER_B_DELEGATION.md.

Check:
- Scope creep (only listed files?)
- Money/stock still via RPCs only
- npm run deploy:check would pass
- B4: migration 0024 copies latest create_sales_bill/update_sales_bill correctly; pack UOM math matches 0020 v_stock

List: must-fix | nice-to-have | approve
```

---

## Human manual QA (you) — after B1–B5 merged

| # | Test | Pass |
|---|------|------|
| 1 | Inner page Back → previous screen | |
| 2 | Settings VAT on, empty address → blocked | |
| 3 | Sale over credit limit → warning, bill still saves | |
| 4 | Sale qty > stock → error, no bill created (after 0024 on Supabase) | |
| 5 | Bell: overdue / low stock links open correct page | |

---

*2026-05-26 — Tier B delegation for local Gemma + Cursor review.*
