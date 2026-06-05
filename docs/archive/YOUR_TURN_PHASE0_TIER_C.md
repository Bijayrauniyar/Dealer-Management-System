# Phase 0 Tier C — signed off

**Status: complete (2026-05-26)** — code, prod migrations **0025–0026**, manual QA §3.0c, deploy.

**Tier C** = app shell polish, support page, Share on bills, customer PAN/VAT, onboarding doc.

**Next:** [FIRST_LAUNCH.md](../FIRST_LAUNCH.md) · [BACKLOG.md](../BACKLOG.md).

> **Archived** — see [PHASE0_SIGNOFF.md](../PHASE0_SIGNOFF.md).

---

## Sign-off record

| Step | Done |
|------|------|
| Migrations **0025**, **0026** on prod | Yes |
| Manual QA §3.0c (T0C1–T0C10) | Yes |
| Netlify / prod deploy | Yes |
| `PLATFORM_SUPPORT` in `supportContacts.ts` | Verify before ads |

---

## Reference (historical checklist)

| # | Test | Pass |
|---|------|------|
| 1 | Bottom tabs: **Home · Customers · Inventory · Reports** + centre **+** | ✓ |
| 2 | **☰ Menu** drawer: Masters, Entry, Reports, Support | ✓ |
| 3 | `/app/more` → **Reports** | ✓ |
| 4 | **Help & support** — platform (BikriKhata) contact | ✓ |
| 5 | Help only via menu (not Settings tab) | ✓ |
| 6 | Bill detail: **Share** + Print + PDF | ✓ |
| 7 | Customer PAN/VAT on bill (0026) | ✓ |
| 8 | Home: date, Sales invoice, Customers/Stock tabs | ✓ |

Automated: `npm run e2e:phase0` / `e2e:tier-c` — see [phase1-use-cases-and-tests.md](backend/phase1-use-cases-and-tests.md).
