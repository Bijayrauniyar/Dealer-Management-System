# P0 launch runbook

**Navigate:** [FIRST_LAUNCH](FIRST_LAUNCH.md) · [Onboarding first shop](ONBOARDING_FIRST_SHOP.md) · [Deployment](deployment.md) · [Live Supabase testing](backend/testing-live-supabase.md)

Ordered checklist for **ads-ready GTM** (Phase 0 app is already shipped). Do **L2** before scaling register on prod.

---

## L1 — Platform support (~30 min)

| Step | Action |
|------|--------|
| 1 | Confirm `app/src/config/supportContacts.ts` phone/WhatsApp/email are **your** GTM lines |
| 2 | Prod: open `/app/support` → test call, WhatsApp, email |
| 3 | Tick L1 **done** in [FIRST_LAUNCH](FIRST_LAUNCH.md) |

---

## L2 — Supabase email auth (~1–2 h)

**Dashboard:** Supabase project → **Authentication**

| Setting | Value |
|---------|--------|
| Providers → Email | Enabled |
| **Confirm email** | **OFF** for P0 pilot (otherwise `signup_tenant` may fail with no session) |
| **Site URL** | `https://bikrikhata.com` (or your prod URL) |
| **Redirect URLs** | `https://bikrikhata.com/**`, `http://localhost:5173/**` |

**Smoke test (prod):**

1. `/register` → create workspace → lands `/app/home`
2. Sign out → `/login` → works on mobile + desktop

Refs: [testing-live-supabase §1.3](backend/testing-live-supabase.md), [deployment.md](deployment.md).

---

## L4 + L7 — Marketing SPA (code)

Routes in same Netlify deploy:

| Route | Page |
|-------|------|
| `/` | Landing (hero, features, pricing from `launchPricing.ts`) |
| `/privacy` | Privacy policy |
| `/terms` | Terms of use |
| `/login`, `/register` | Auth (footer links to legal) |
| `/app/*` | Product (unchanged) |

Unknown paths → `/` (signed-in user at `/` → `/app/home`).

**FAQ:** `/#faq` on landing — edit copy in `app/src/pages/marketing/landingFaq.ts`.

**Contact form:** `/#contact` → inserts into `platform_inquiries`. Easiest SQL: `RUN_ONCE_contact_form.sql` in SQL Editor. Verify: `cd app && npm run test:contact-form`. View leads: **Table Editor** → `platform_inquiries`.

**Contact email (optional — L8):** Inbox alerts via Resend — not Supabase Auth mail. Follow [CONTACT_FORM_EMAIL_SETUP.md](CONTACT_FORM_EMAIL_SETUP.md): Resend key → `supabase secrets set` (3 vars) → `npm run deploy:contact-email` → Database **Webhook** on INSERT `platform_inquiries`.

**Hero image (optional before ads):** Add compressed WebP under `app/public/marketing/` — prefer **sales invoice / bill print** screenshot (demo data). See FIRST_LAUNCH § Website.

---

## L3 — Legal copy

Short plain-English pages at `/privacy` and `/terms`. Register footer: “By registering you agree…”

**Internal:** Review with lawyer before large ad spend — copy is not legal advice.

---

## L5 — Release checks (~2–4 h)

```bash
cd app
npm run deploy:check
npm run e2e:phase0          # includes P0 public route checks
npm run e2e:phase0:live      # optional; needs .e2e-credentials.local
```

Push → Netlify rebuild with `VITE_*` env set.

**Post-deploy:** `/`, `/privacy`, `/login`, `/app/home`, Share on one bill.

---

## L6 — One pilot shop (~1 week)

Follow [ONBOARDING_FIRST_SHOP.md](ONBOARDING_FIRST_SHOP.md) on **prod**.

| Day | Activity |
|-----|----------|
| 1 | Onboard tenant |
| 2–3 | Products, 1 purchase, 5–10 sales, 1 payment |
| 4 | Export CSV; print/Share one bill |
| 5–7 | Fix **P0 bugs only**; log P1 in [BACKLOG](BACKLOG.md) |

Record pilot name + date in [FIRST_LAUNCH sign-off](FIRST_LAUNCH.md#sign-off).

---

## P0 done when

| ID | Done when |
|----|-----------|
| L1 | Support tested on prod |
| L2 | Auth URLs + confirm-email decision documented |
| L3 | `/privacy` + `/terms` live |
| L4 | `/` landing live with CTAs |
| L5 | `e2e:phase0` + `deploy:check` green |
| L6 | Pilot week complete |
| L7 | Annual price on landing (`launchPricing.ts`) |

Then: **First ad live** row in FIRST_LAUNCH sign-off.
