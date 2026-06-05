# Documentation hub

**[Project README](../README.md)** — app setup and commands.

---

## Start here

| Who | Open first |
|-----|------------|
| **Human — launch / ads** | **[FIRST_LAUNCH.md](FIRST_LAUNCH.md)** · [P0 runbook](P0_LAUNCH_RUNBOOK.md) |
| **Human — what to build next** | **[BACKLOG.md](BACKLOG.md)** |
| **AI agent** | **[AI_AGENT.md](AI_AGENT.md)** |
| **Phase 0 done?** | **[PHASE0_SIGNOFF.md](PHASE0_SIGNOFF.md)** |
| **P1 done? Where are we?** | **[FIRST_LAUNCH.md](FIRST_LAUNCH.md)** — P1 product complete; ads blocked on L2 + L6 |

---

## Active docs (daily)

| File | Role |
|------|------|
| [FIRST_LAUNCH.md](FIRST_LAUNCH.md) | P0/P1/P2 checklist — **edit priorities here** |
| [BACKLOG.md](BACKLOG.md) | Deferred features — move to/from FIRST_LAUNCH |
| [PHASE_ROADMAP.md](PHASE_ROADMAP.md) | Phase 0–3 strategy |
| [LLM_CONTEXT.md](LLM_CONTEXT.md) | Code handbook + changelog |
| [DELETE_POLICY.md](DELETE_POLICY.md) | Archive/restore; no hard delete in shop UI |
| [ONBOARDING_FIRST_SHOP.md](ONBOARDING_FIRST_SHOP.md) | First shop setup |
| [TENANT_ACTIVATION.md](TENANT_ACTIVATION.md) | Approve signup, 7-day trial, monthly/annual license |
| [GTM_NEPAL.md](GTM_NEPAL.md) | ICP, pricing, VAT |
| [UI_CONSISTENCY_PLAN.md](UI_CONSISTENCY_PLAN.md) | UI-1 migration list |
| [BRAND_ICON_GUIDE.md](BRAND_ICON_GUIDE.md) | App icon meaning + ChatGPT prompts |
| [MARKETING_HERO_IMAGE_BRIEF.md](MARKETING_HERO_IMAGE_BRIEF.md) | Hero illustration brief (pain → product) |
| [MARKETING_SCREENSHOTS_PLAN.md](MARKETING_SCREENSHOTS_PLAN.md) | Landing 4-phone row — combined features + captions |
| [CONTACT_FORM_LEADS.md](CONTACT_FORM_LEADS.md) | Contact form → Supabase table |
| [CONTACT_FORM_EMAIL_SETUP.md](CONTACT_FORM_EMAIL_SETUP.md) | Email alerts (Resend or Zapier) |

**Redirects (short — do not expand):** [DEFERRED_WORK.md](DEFERRED_WORK.md) → BACKLOG

**Backend:** [data-model](backend/data-model.md) · [BACKEND-TODO](backend/BACKEND-TODO.md) · [manual E2E](backend/phase1-manual-e2e-checklist.md) · [e2e commands](backend/phase1-use-cases-and-tests.md) · [deployment](deployment.md)

---

## Archive (`docs/archive/`)

Completed sign-offs, old delegation prompts, brand research, Gemma prompt.

**Policy:** **Archive first** — do not delete until the team agrees. See **[archive/README.md](archive/README.md)**.

AI agents: **ignore `archive/`** unless the user asks for history.

---

## Maintaining docs

| Change | Update |
|--------|--------|
| Feature / UX | FIRST_LAUNCH or BACKLOG, LLM_CONTEXT changelog, e2e script, manual checklist |
| Migration | `app/supabase/README.txt`, data-model, phase1-use-cases pre-flight |
| New deferred idea | Row in **BACKLOG** only |

Rule: [.cursor/rules/docs-on-change.mdc](../.cursor/rules/docs-on-change.mdc)

---

## Reading order (new developer)

1. [README](../README.md) (project root)  
2. [FIRST_LAUNCH.md](FIRST_LAUNCH.md)  
3. [app/supabase/README.txt](../app/supabase/README.txt)  
4. [testing-live-supabase.md](backend/testing-live-supabase.md)  
5. [data-model.md](backend/data-model.md)  

---

*Last updated: 2026-06-05 — P1 product complete; migrations through `0039` on prod; launch ops: L2 + L6.*
