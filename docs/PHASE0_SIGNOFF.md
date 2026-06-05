# Phase 0 sign-off (complete)

**Status:** **Phase 0 done (2026-05-26)** — Tier A + B + C on prod.

**Next work:** [FIRST_LAUNCH.md](FIRST_LAUNCH.md) (P0 before ads) · [BACKLOG.md](BACKLOG.md) (Phase 1+).

---

## Tier A — Must (export, stock, settings)

- Migrations **0019–0023**
- Export hub, categories, stock adjustment, BikriKhata brand
- Sign-off detail (historical): [archive/YOUR_TURN_PHASE0_TIER_A.md](archive/YOUR_TURN_PHASE0_TIER_A.md)

## Tier B — Should (trust)

- Migration **0024** oversell guard
- Credit warn, VAT validation, PageBackLink, notifications QA
- Detail: [archive/YOUR_TURN_PHASE0_TIER_B.md](archive/YOUR_TURN_PHASE0_TIER_B.md)

## Tier C — Polish (shell)

- Migrations **0025–0026**, drawer/tabs, Share bill, support, customer PAN/VAT on bill
- Prod deploy + manual QA §3.0c
- Detail: [archive/YOUR_TURN_PHASE0_TIER_C.md](archive/YOUR_TURN_PHASE0_TIER_C.md)

---

## Verify anytime

```bash
cd app && npm run e2e:phase0
```

Manual: [backend/phase1-manual-e2e-checklist.md](backend/phase1-manual-e2e-checklist.md) §3.0a–c.

---

*Last updated: 2026-05-26*
