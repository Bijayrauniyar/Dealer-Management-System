# Your turn — Phase 0 Tier B

**Navigate:** [Docs hub](README.md) · [Tier A sign-off](YOUR_TURN_PHASE0_TIER_A.md) · [Delegation prompts](PHASE0_TIER_B_DELEGATION.md) · [Migrations runbook](../app/supabase/README.txt)

Tier B code is in the repo. **You must apply migration 0024** on each Supabase project (dev + prod) before oversell protection works live.

---

## 1. Supabase (required)

| Step | Action |
|------|--------|
| 1 | SQL Editor → new query |
| 2 | Paste full file `app/supabase/migrations/0024_block_oversell_in_sales.sql` |
| 3 | Run → Success |

Verify (optional):

```sql
select proname from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and proname = 'assert_sale_stock_available';
```

Expect **1 row**.

---

## 2. Local verify

```bash
cd app
npm run deploy:check
npm run e2e:smoke
npm run e2e:stock
npm run e2e:stock:live   # after 0024 on your project
```

---

## 3. Manual QA

| # | Test | Pass |
|---|------|------|
| 1 | Open Product form → **Back** → product list | |
| 2 | Settings → **Back** → previous screen | |
| 3 | VAT on, empty address line 1 → save **blocked** with clear toast | |
| 4 | VAT on, address + VAT no + name → save OK | |
| 5 | Customer with credit limit; sale pushes over limit → **warning**, bill still saves | |
| 6 | New sale qty &gt; stock → error, bill not created (after 0024) | |
| 7 | Bell → overdue / low stock links open bill or stock page | |

---

## 4. Deploy

Merge branch with Tier B changes → `main` → Netlify green → smoke login on prod.

Confirm prod Supabase has **0019–0024** (Tier A + Tier B).

---

## Shipped in Tier B (2026-05-26)

| ID | Item |
|----|------|
| UI-0.9 | `PageBackLink` on inner pages + Settings |
| VAT-0b | VAT registration validation on Settings save |
| CRED-0 | Credit limit **warning** (warn only; save still allowed) |
| Notifications | Due-soon vs overdue boundary fix |
| INV-1 | Migration **0024** + live e2e oversell check |

---

## When Tier B is “done”

- [ ] 0024 applied on dev Supabase
- [ ] 0024 applied on prod Supabase
- [ ] `e2e:stock:live` passes
- [ ] Manual QA table above checked
- [ ] Deployed to production

---

*2026-05-26*
