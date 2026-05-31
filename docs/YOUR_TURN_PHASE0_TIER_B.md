# Your turn — Phase 0 Tier B

**Status:** **Tier B sign-off complete** (migrations 0019–**0024**, QA, `e2e:stock:live`, deploy to production). **Next:** Tier C or Phase 1 per [PHASE_ROADMAP.md](PHASE_ROADMAP.md).

**Navigate:** [Docs hub](README.md) · [Tier A sign-off](YOUR_TURN_PHASE0_TIER_A.md) · [Delegation prompts](PHASE0_TIER_B_DELEGATION.md) · [Migrations runbook](../app/supabase/README.txt)

---

## 1. Supabase — done

| Step | Status |
|------|--------|
| `0024_block_oversell_in_sales.sql` on **dev** | [x] |
| On **prod** | [x] |
| `assert_sale_stock_available` RPC | [x] |

---

## 2. Local verify — done

| Command | Status |
|---------|--------|
| `npm run deploy:check` | [x] |
| `npm run e2e:smoke` | [x] |
| `npm run e2e:stock` | [x] |
| `npm run e2e:stock:live` (47/47) | [x] |
| `npm run e2e:tier-b` / `e2e:tier-b:live` | [x] optional gate |

---

## 3. Manual QA — done

Full checklist: **[phase1-manual-e2e-checklist.md](backend/phase1-manual-e2e-checklist.md)** §3.0b (T0B1–T0B8). Quick list:

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

## 4. Deploy — done

| Step | Status |
|------|--------|
| Commit + push `dev` | [x] |
| MR / merge → `main` | [x] |
| Netlify production deploy | [x] |
| Prod smoke | [x] |

Prod Supabase: **0019–0024**.

---

## Shipped in Tier B

| ID | Item |
|----|------|
| UI-0.9 | `PageBackLink` on inner pages + Settings |
| VAT-0b | VAT registration validation on Settings save |
| CRED-0 | Credit limit **warning** (warn only) |
| UI-0.12 | Notifications due-soon vs overdue boundary fix |
| INV-1 | Migration **0024** + live e2e oversell check |

**Same release:** Home UX (`fmtDateDual`, outstanding card), PAN **Sales Invoice** print title, compact list filters (sort UI hidden), `e2e-stock-dates` `rate_excl` fix.

---

*2026-05-26 — Tier B complete (QA + deploy).*
