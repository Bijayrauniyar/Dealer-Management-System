# Your turn — Phase 0 Tier B

**Navigate:** [Docs hub](README.md) · [Tier A sign-off](YOUR_TURN_PHASE0_TIER_A.md) · [Delegation prompts](PHASE0_TIER_B_DELEGATION.md) · [Migrations runbook](../app/supabase/README.txt)

**Sign-off status (2026-05-26):** QA + Supabase **0024** on dev and prod **done**. **Pending:** commit on `dev`, push, MR → `main`, Netlify deploy, prod smoke.

---

## 1. Supabase — done

| Step | Status |
|------|--------|
| Run `0024_block_oversell_in_sales.sql` on **dev** | [x] |
| Run on **prod** | [x] |
| `assert_sale_stock_available` exists (verify query below) | [x] |

```sql
select proname from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and proname = 'assert_sale_stock_available';
```

---

## 2. Local verify — done

| Command | Status |
|---------|--------|
| `npm run deploy:check` | [x] |
| `npm run e2e:smoke` | [x] |
| `npm run e2e:stock` | [x] |
| `npm run e2e:stock:live` (47/47) | [x] |

---

## 3. Manual QA — done

| # | Test | Pass |
|---|------|------|
| 1 | Product form → **Back** → list | [x] |
| 2 | Settings → **Back** | [x] |
| 3 | VAT on, empty address → save blocked | [x] |
| 4 | VAT on, filled fields → save OK | [x] |
| 5 | Credit limit → **warning**, bill still saves | [x] |
| 6 | Sale qty &gt; stock → error (0024) | [x] |
| 7 | Notifications → correct links | [x] |

---

## 4. Deploy — pending

| Step | Status |
|------|--------|
| Commit Tier B (+ UX follow-ups) on `dev` | [ ] |
| Push `dev` | [ ] |
| MR / merge → `main` | [ ] |
| Netlify green on `main` | [ ] |
| Prod smoke (login, one sale, settings) | [ ] |

Prod Supabase already has **0019–0024**.

---

## Shipped in Tier B

| ID | Item |
|----|------|
| UI-0.9 | `PageBackLink` on inner pages + Settings |
| VAT-0b | VAT registration validation on Settings save |
| CRED-0 | Credit limit **warning** (warn only) |
| Notifications | Due-soon vs overdue boundary fix |
| INV-1 | Migration **0024** + live e2e oversell check |

**Also in same release branch:** Home UX (`fmtDateDual`, outstanding card), PAN **Sales Invoice** print title, compact list filters (sort UI hidden), `e2e-stock-dates` `rate_excl` fix.

---

## When Tier B is fully “done”

- [x] 0024 on dev + prod Supabase
- [x] `e2e:stock:live` passes
- [x] Manual QA (7 rows)
- [ ] **Deployed** to production (Netlify `main`)

After deploy: mark this section complete and treat **Tier C** or **Phase 1** as next per [PHASE_ROADMAP.md](PHASE_ROADMAP.md).

---

*2026-05-26 — QA signed off; deploy pending.*
