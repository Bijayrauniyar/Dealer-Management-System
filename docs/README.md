# Documentation hub

All project docs live under **`docs/`**. The **[project README](../README.md)** is the main onboarding entry (features, stack, layout, dev commands).

**Agents & contributors:** After any feature, migration, or UX change, update the docs listed in [Maintaining documentation](#maintaining-documentation). The repo enforces this via Cursor rule `.cursor/rules/docs-on-change.mdc` (`alwaysApply`).

---

## Maintaining documentation

Update docs in the **same change** as code — do not leave README/schema/UI docs stale.

| If you changed… | Update at minimum |
|-----------------|-------------------|
| SQL migration | [`app/supabase/README.txt`](../app/supabase/README.txt), [`backend/data-model.md`](backend/data-model.md), [`phase1-use-cases-and-tests.md`](backend/phase1-use-cases-and-tests.md) pre-flight |
| Purchases / supplier invoice / VAT | [`PURCHASE_REFERENCE_NUMBERS.md`](PURCHASE_REFERENCE_NUMBERS.md), `data-model.md` |
| Products / pricing | `data-model.md` (§ products), [`phase1-manual-e2e-checklist.md`](backend/phase1-manual-e2e-checklist.md) § Products |
| Settings fields | `data-model.md` (§ `tenant_settings`), manual checklist § Settings |
| User-facing flow | [`LLM_CONTEXT.md`](LLM_CONTEXT.md) changelog + manual checklist row |
| E2E script | `phase1-use-cases-and-tests.md` command table |

Also add a dated line to **`docs/LLM_CONTEXT.md`** changelog and extend **`app/scripts/e2e-*.mjs`** when the behavior is assertable.

---

## Reading order

Follow this path the first time you touch the repo:

| Step | Document | Why |
|------|----------|-----|
| 1 | [Project README](../README.md) | What the app does, tech stack, `cd app` workflow, test scripts |
| 2 | [Environment: MCP vs `.env`](backend/mcp-and-env.md) | Why `app/.env.local` exists vs Cursor MCP — avoids confusion |
| 3 | [Migrations runbook](../app/supabase/README.txt) | Exact SQL file order: `0001` → `0002` → `0003` → `0005` → `0006` → `0007` (optional `0004` dev) |
| 4 | [Testing against live Supabase](backend/testing-live-supabase.md) | Dashboard auth, first-run checklist, where to see data |
| 5 | [Backend checklist](backend/BACKEND-TODO.md) | Done vs planned (Phase 0–2), what to build next |
| 5b | [Product evolution (pain-first)](PRODUCT_EVOLUTION.md) | What to build next and **why** — client pains, not feature count |
| 5c | [Deferred work register](DEFERRED_WORK.md) | **Plan later:** INV-1/INV-2, export, supplier scheme — effort, files, acceptance |
| 5d | [Data export spec](DATA_EXPORT_SPEC.md) | Phase 2-E: reporting, migration ZIP, backup (**deferred** — backlog only) |
| 6 | [Data model](backend/data-model.md) | Tables, views, Phase 2 design (capital policy, bill amendments) |
| 7 | [Phase 1 — automated tests](backend/phase1-use-cases-and-tests.md) | `npm run e2e:*` matrix and RPC expectations |
| 8 | [Phase 1 — manual E2E](backend/phase1-manual-e2e-checklist.md) | What scripts skip; full human QA |

**Shortcut — deploy:** [deployment.md](deployment.md) (GitHub → Supabase → Netlify → Auth URLs).  
**Shortcut — QA day:** steps **3 → 4 → 7 → 8**.  
**Shortcut — schema / roadmap:** steps **5 → 6**.

```mermaid
flowchart LR
  R[README]
  E[mcp-and-env]
  M[migrations README.txt]
  T[testing-live]
  B[BACKEND-TODO]
  D[data-model]
  A[phase1-use-cases]
  M1[manual checklist]
  R --> E --> M --> T
  T --> B
  B --> D
  T --> A --> M1
  D -.-> A
```

---

## All documents

### Backend & data

| File | When to open it |
|------|------------------|
| [backend/data-model.md](backend/data-model.md) | Schema, RLS ideas, formulas, Phase 2 (capital, bill amendments, export) |
| [PURCHASE_REFERENCE_NUMBERS.md](PURCHASE_REFERENCE_NUMBERS.md) | Supplier invoice no. vs PO, migrations 0014–0017, purchase bill UI |
| [backend/BACKEND-TODO.md](backend/BACKEND-TODO.md) | Implementation checklist, Phase 2 tasks, production quality bar |
| [DEFERRED_WORK.md](DEFERRED_WORK.md) | **Deferred backlog register** — INV-1/INV-2, effort, touchpoints, how to maintain |
| [PRODUCT_EVOLUTION.md](PRODUCT_EVOLUTION.md) | Client pain points + pain-first roadmap |
| [DATA_EXPORT_SPEC.md](DATA_EXPORT_SPEC.md) | Phase 2-E export design (deferred) |
| [PRODUCT_NAMING_BRIEF.md](PRODUCT_NAMING_BRIEF.md) | Product name & rebrand brief (deferred) |
| [backend/mcp-and-env.md](backend/mcp-and-env.md) | `VITE_*` vars, Supabase MCP, security notes |
| [backend/testing-live-supabase.md](backend/testing-live-supabase.md) | Running the app on a real project; auth and dashboard tips |

### Testing & quality

| File | When to open it |
|------|------------------|
| [backend/phase1-use-cases-and-tests.md](backend/phase1-use-cases-and-tests.md) | E2E commands, use-case IDs, what each script asserts |
| [backend/seed-demo-and-reset.md](backend/seed-demo-and-reset.md) | Supabase tenant seed (`seed:demo`), purge, credentials |
| [backend/phase1-manual-e2e-checklist.md](backend/phase1-manual-e2e-checklist.md) | Manual-only coverage, print/UI edge cases, sign-off template |

### Deployment & CI

| File | When to open it |
|------|------------------|
| [deployment.md](deployment.md) | Quick-start deploy: GitHub, Supabase, Netlify, secrets |
| [.github/workflows/ci.yml](../.github/workflows/ci.yml) | Build + lint on every push/PR (no secrets) |
| [.github/workflows/e2e-smoke.yml](../.github/workflows/e2e-smoke.yml) | Supabase smoke — run locally (`npm run e2e:smoke`); optional manual Actions run with secrets |

### Operational (repo tree)

| File | When to open it |
|------|------------------|
| [app/supabase/README.txt](../app/supabase/README.txt) | Copy-paste migrations into Supabase SQL Editor |

### AI / local LLM assistants

| File | When to open it |
|------|------------------|
| [GEMMA_SYSTEM_PROMPT.md](GEMMA_SYSTEM_PROMPT.md) | **Copy-paste into Gemma 4 26B System field** — compact rules + routes + verify commands |
| [LLM_CONTEXT.md](LLM_CONTEXT.md) | **Attach every session** — full handbook: files, bill logic, deploy, maintenance |
| [PRODUCT_NAMING_BRIEF.md](PRODUCT_NAMING_BRIEF.md) | Paste into ChatGPT when choosing a generic product name (deferred rebrand) |

---

## Adding a new doc

- Place backend / schema / testing notes under **`docs/backend/`**.
- Link it in the **All documents** table above and add it to **Reading order** if it belongs on the default onboarding path.
- Add a **Navigate** line at the top of the new file pointing back to **[this hub](README.md)** and **[project README](../README.md)**.
