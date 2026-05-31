# Your turn — Phase 0 Tier C sign-off

**Tier C** = app shell polish, support contacts, WhatsApp on bills, onboarding doc, optional customer VAT.

Code is in the branch; you run migrations and manual QA before calling Phase 0 complete.

---

## 1. Migrations (dev then prod)

Run in SQL Editor (see [`app/supabase/README.txt`](../app/supabase/README.txt)):

| Step | File |
|------|------|
| 26 | `0025_tenant_support_contacts.sql` |
| 27 | `0026_customer_tax_ids.sql` |

---

## 2. Manual QA (≈15 min)

Full step-by-step list: **[phase1-manual-e2e-checklist.md](backend/phase1-manual-e2e-checklist.md)** §3.0c (T0C1–T0C10). Quick tick list:

| # | Test | Pass? |
|---|------|-------|
| 1 | Bottom tabs: **Home · Customers · Inventory · Reports** + centre **+** | ☐ |
| 2 | **☰ Menu** opens drawer: Masters, Entry, Reports, Support sections | ☐ |
| 3 | `/app/more` redirects to **Reports** | ☐ |
| 4 | **Help & support** — shows **BikriKhata** (software owner) contact, not shop retail helpline | ☐ |
| 5 | Help only via menu → **Help & support** (not in Settings tabs) | ☐ |
| 6 | Bill detail: **Share** button — system share sheet (WhatsApp, email, etc.) or PDF download | ☐ |
| 7 | Customer form: optional PAN/VAT; prints on bill when filled (after 0026) | ☐ |
| 8 | Home: date + Sales invoice + Customers/Stock tabs + browse lists | ☐ |

---

## 3. Docs sanity

- [ONBOARDING_FIRST_SHOP.md](ONBOARDING_FIRST_SHOP.md) matches your pilot flow.
- Set **software owner** phone/WhatsApp in `app/src/config/supportContacts.ts` (`PLATFORM_SUPPORT`) before GTM. Migration **0025** is optional (reserved DB columns).

---

## 4. Automated checks (optional)

From `app/`:

```bash
npm run e2e:phase0        # Tier A + B + C source
npm run e2e:phase0:live   # + DB checks (needs .e2e-credentials.local)
```

Or per tier: `e2e:tier-a`, `e2e:tier-b`, `e2e:tier-c` (add `:live` for DB).

**After any Tier C (or shell/UI) code change:** update `app/scripts/e2e-tier-c.mjs` in the same commit and re-run `e2e:phase0`. See [phase1-use-cases-and-tests.md](backend/phase1-use-cases-and-tests.md#keeping-tests-in-sync-required-on-every-change).

## 5. Deploy

- `npm run build` in `app/`
- Deploy to Netlify (or your host) after prod migrations.

---

## Tier D (not this checklist)

Phase 1+ features (sales orders, CSV import, CAT-1, …) are tracked in [PHASE1_TIER_D_SCOPE.md](PHASE1_TIER_D_SCOPE.md) — not part of Tier C sign-off.
