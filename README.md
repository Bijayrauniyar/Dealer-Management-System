# Havmor — Dealer Management System (DMS)

Web app for distributors / dealers: sales, stock, purchases, receivables, and company reporting. The UI is a **Progressive Web App** built with React; persistence is **Supabase** (Postgres + Auth + Row Level Security) with **security-definer RPCs** for transactions.

If you are new to the codebase, read this file first, then follow the **numbered reading order** in **[`docs/README.md` → Reading order](docs/README.md#reading-order)** (environment → migrations → live testing → checklist → data model → E2E docs).

**Local AI (Gemma 4, Codex, etc.):** **[`docs/GEMMA_SYSTEM_PROMPT.md`](docs/GEMMA_SYSTEM_PROMPT.md)** (paste into System) + **[`docs/LLM_CONTEXT.md`](docs/LLM_CONTEXT.md)** (attach as handbook). Update after large features (see §10 in LLM_CONTEXT).

---

## Features (Phase 1 scope)

| Area | What users can do |
|------|-------------------|
| **Auth & tenancy** | Email login, registration (`signup_tenant`), tenant pending approval, role-gated app shell (`owner` / `accountant`). |
| **Home & cash** | Dashboard-style home, aging buckets, overdue list, period views. |
| **Sales** | Create and edit bills (lines, discount, VAT, extra charges, partial pay at billing). RPCs: `create_sales_bill`, `update_sales_bill` (`0007`). |
| **Bills** | Bill detail, navigation from home; print-oriented layout. |
| **Payments** | Customer payments with FIFO-style bill allocation (`apply_customer_payment`). |
| **Returns** | Goods return with stock and bill credit (`apply_goods_return`). |
| **Purchases & suppliers** | Record purchase (`record_purchase`); supplier payments (`apply_supplier_payment`). |
| **Stock** | On-hand from `v_stock`; affected by sales, returns, purchases. |
| **Products & customers** | CRUD in UI; live `upsertProductLive`, customer commit helpers. |
| **Suppliers** | Listing; add via DB/API (full supplier form wiring is incremental). |
| **Expenses & damages** | `record_expense`, `record_damage`. |
| **Daily cash** | Page present; deeper wiring tracked in backlog. |
| **Schemes** | Promotional scheme entry (UI). |
| **Settings** | `tenant_settings` — branding, bill prefix, VAT defaults, etc. |
| **Company** | Overview KPIs, capital list/add (**live** reads/writes to `capital_entries`). |
| **More / settings** | Navigation hub, app settings. |

**Requires Supabase:** Without `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, the app shows a setup screen (`MissingSupabaseEnv`) — there is no offline demo mode.

**Planned (Phase 2+):** Notifications, bill images, capital edit / inclusion-in-totals / audit UI, sales bill **amendment history** (`sales_bill_audit`) — see [`docs/backend/data-model.md`](docs/backend/data-model.md) and [`docs/backend/BACKEND-TODO.md`](docs/backend/BACKEND-TODO.md).

---

## Tech stack

| Layer | Choice |
|-------|--------|
| **UI** | React 19, TypeScript, Vite 7 |
| **Routing** | React Router 6 |
| **Styling** | Tailwind CSS 3, `tailwind-merge`, `class-variance-authority`, `tailwindcss-animate` |
| **Forms** | Local `useState` on pages (`react-hook-form` + Zod are deps but unused) |
| **Server state** | TanStack React Query |
| **Backend** | Supabase: Postgres, Auth, RLS |
| **Charts** | Recharts |
| **CSV** | Papa Parse |
| **Toasts** | Sonner |
| **PWA** | `vite-plugin-pwa` |
| **E2E** | Node scripts + Playwright (Chromium) for UI flows |

---

## Repository layout

```
havmor/
├── app/                    # Main application (npm package: havmor-dms)
│   ├── src/
│   │   ├── components/     # Shared UI (layout, forms, primitives)
│   │   ├── pages/          # Route-level screens
│   │   ├── routes/         # AppRouter
│   │   ├── store/          # domainHooks → domainLive (React Query)
│   │   ├── domain/         # types.ts, defaults.ts, catalogs.ts
│   │   ├── lib/            # supabase, auth, live/domainLive
│   ├── scripts/            # E2E and Supabase smoke scripts (.mjs)
│   └── supabase/migrations # 0001…0007 — ordered SQL
├── docs/                   # Project documentation (index: docs/README.md)
└── netlify.toml            # SPA deploy: base app/, publish dist/
```

---

## How we developed it (approach)

1. **Product-first screens** — Flows match dealer workflows (sale → payment → return → purchase) before backend polish.
2. **Supabase-only client** — `domainHooks.ts` + `domainLive.ts` call PostgREST and RPCs; app requires `VITE_*` env vars.
3. **Postgres as source of truth** — Non-trivial money/stock changes go through **RPCs** (`0003` … `0007`) so constraints stay server-side.
4. **RLS by tenant** — Data isolation via `tenant_id` and policies tied to `auth.uid()` / `tenant_users`.
5. **Incremental migration** — Numbered SQL files; document order in `app/supabase/README.txt`.
6. **Automated regression** — API matrix + UI E2E scripts (see Testing below).

---

## Coding style & conventions

- **TypeScript** throughout; domain models in `src/domain/types.ts`.
- **Path alias** `@/` → `src/` (see Vite/TS config).
- **Naming** — React components `PascalCase`; hooks `use*`; live Supabase helpers often suffixed `Live` (`fetchXLive`, `commitSaleLive`).
- **UI** — Prefer existing layout (`AppShell`), shared patterns for forms and lists; Tailwind utility classes; avoid one-off inline styles unless necessary.
- **Mutations** — Invalidate or refetch via React Query keys (`DOMAIN_QUERY_KEY`, `CAPITAL_QUERY_KEY`, etc.) after `domainLive` writes.
- **Secrets** — Never commit `.env.local`, `.e2e-credentials.local`, or real keys. Use `.env.example` patterns described in docs if you add one locally.
- **Git** — `.gitignore` excludes `app/node_modules`, `app/dist`, env files, E2E artifacts (e.g. `.e2e-ui-failure.png`), and `.cursor/*.log`.

---

## Local development

**Prerequisites:** Node 20+ (recommended), npm.

```bash
cd app
npm install
npm run dev
```

Open the URL Vite prints (typically `http://localhost:5173`).

- Copy `app/.env.example` → `app/.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (never commit `.env.local`).
- Apply migrations per [`app/supabase/README.txt`](app/supabase/README.txt) (`0001` → `0007`). Auth setup: [`docs/backend/mcp-and-env.md`](docs/backend/mcp-and-env.md), [`docs/backend/testing-live-supabase.md`](docs/backend/testing-live-supabase.md).

**Build:**

```bash
cd app
npm run build
npm run preview   # optional local check of production bundle
```

---

## Testing

From **`app/`**:

| Script | Purpose |
|--------|---------|
| `npm run e2e:smoke` | Schema / RPC presence |
| `npm run e2e:live` | Authenticated reads (needs env + `E2E_EMAIL` / `E2E_PASSWORD`) |
| `npm run e2e:matrix` | Full API matrix (masters, maths, stock) |
| `npm run e2e:ui` | Browser UI (needs `npm run dev` in another terminal) |
| `npm run e2e:full` | smoke → live → matrix → UI |

Details, credentials file, and use-case mapping: [`docs/backend/phase1-use-cases-and-tests.md`](docs/backend/phase1-use-cases-and-tests.md). Manual-only coverage: [`docs/backend/phase1-manual-e2e-checklist.md`](docs/backend/phase1-manual-e2e-checklist.md).

---

## Documentation map

Start here for navigation: **[`docs/README.md`](docs/README.md)** (hub + **recommended reading order** + links to every file).

| Document | Contents |
|----------|----------|
| [`docs/README.md`](docs/README.md) | Hub, reading-order flow, full index |
| [`docs/backend/mcp-and-env.md`](docs/backend/mcp-and-env.md) | `VITE_*` env, Cursor MCP vs app |
| [`app/supabase/README.txt`](app/supabase/README.txt) | Migration order (`0001` … `0007`) |
| [`docs/backend/testing-live-supabase.md`](docs/backend/testing-live-supabase.md) | First live run, Dashboard checks |
| [`docs/backend/BACKEND-TODO.md`](docs/backend/BACKEND-TODO.md) | Phase 0–2 checklist, quality bar |
| [`docs/backend/data-model.md`](docs/backend/data-model.md) | Schema, Phase 2 design, RPC notes |
| [`docs/backend/phase1-use-cases-and-tests.md`](docs/backend/phase1-use-cases-and-tests.md) | Automated E2E / matrix reference |
| [`docs/backend/phase1-manual-e2e-checklist.md`](docs/backend/phase1-manual-e2e-checklist.md) | Manual QA, gaps scripts do not cover |
| [`docs/deployment.md`](docs/deployment.md) | Netlify, env secrets, GitHub Actions |

---

## Deployment

**Start here:** [`docs/deployment.md`](docs/deployment.md) — ordered checklist (GitHub → Supabase migrations → Netlify env → Auth URLs).

```bash
cd app && npm run deploy:check   # lint + production build before you push
```

| Piece | What to do |
|-------|------------|
| **Netlify** | Import repo; [`netlify.toml`](netlify.toml) sets `base = app`, Node 20, `npm ci && npm run build` |
| **Secrets** | `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` in Netlify (never commit) |
| **CI** | [`.github/workflows/ci.yml`](.github/workflows/ci.yml) — build on every PR (no secrets) |
| **Smoke** | [`.github/workflows/e2e-smoke.yml`](.github/workflows/e2e-smoke.yml) — not run on push; use `npm run e2e:smoke` locally, or **Run workflow** in Actions if secrets are set |

---

## Contributing (quick)

1. Branch from main; keep changes focused.
2. Run `npm run build` in `app/` before PR; run `e2e:smoke` / `e2e:matrix` when you touch RPCs or domain math.
3. Update **`docs/backend/BACKEND-TODO.md`** or **`data-model.md`** if behaviour or schema expectations change.
4. New docs: add them to **[`docs/README.md`](docs/README.md)** so they stay discoverable.

---

## License / product

Private project (`"private": true` in `app/package.json`). Internal use unless otherwise stated by the owners.
