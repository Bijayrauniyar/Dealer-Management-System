# Guide for AI agents (and humans)

**Do not read every file in `docs/`.** Use this order.

---

## Read order

| Step | File | Use when |
|------|------|----------|
| 1 | **[BACKLOG.md § Feature status index](BACKLOG.md#feature-status-index-single-source-of-truth)** | **SSOT** — every feature ID, shipped vs todo vs backlog |
| 2 | **[FIRST_LAUNCH.md](FIRST_LAUNCH.md)** | Launch ops order (L2, L6, polish sequence) |
| 3 | **[BACKLOG.md § Master register](BACKLOG.md#master-register)** | Full ID table + detail sections |
| 4 | **[LLM_CONTEXT.md](LLM_CONTEXT.md)** | Routes, RPCs, file map, E2E commands (coding sessions) |
| 5 | [backend/data-model.md](backend/data-model.md) | Schema / migrations |
| 6 | [backend/phase1-use-cases-and-tests.md](backend/phase1-use-cases-and-tests.md) | `npm run e2e:*` |

**Humans — quick status:** [BACKLOG § Feature status index](BACKLOG.md#feature-status-index-single-source-of-truth) · [FIRST_LAUNCH](FIRST_LAUNCH.md) · [PHASE0_SIGNOFF](PHASE0_SIGNOFF.md)

**Strategy / market:** [PHASE_ROADMAP.md](PHASE_ROADMAP.md) · [GTM_NEPAL.md](GTM_NEPAL.md)

---

## Do not use (unless asked)

| Location | Reason |
|----------|--------|
| **`docs/archive/`** | Historical sign-offs, old prompts — [archive policy](archive/README.md) |
| **`DEFERRED_WORK.md`** | Redirect only → [BACKLOG.md](BACKLOG.md) |

---

## Tenant data (read before touching `domainLive.ts`)

**Never break dealer accuracy:** one workspace per login; all domain reads must stay scoped by `tenant_id` (`["domain", "v2"]`). Do not change money/stock RPC flows or run seed/e2e against pilot tenants.

→ [.cursor/rules/tenant-data-integrity.mdc](../.cursor/rules/tenant-data-integrity.mdc) · [TENANT_ACTIVATION.md](TENANT_ACTIVATION.md) troubleshooting

---

## On every code or UX change

Follow [.cursor/rules/docs-on-change.mdc](../.cursor/rules/docs-on-change.mdc):

1. Update **[BACKLOG § Feature status index](BACKLOG.md#feature-status-index-single-source-of-truth)** + master register (status / new ID)  
2. Sync **[FIRST_LAUNCH](FIRST_LAUNCH.md)** if launch order changed  
3. **LLM_CONTEXT** changelog (one dated bullet)  
3. Matching **`e2e-*.mjs`** script  
4. [phase1-manual-e2e-checklist.md](backend/phase1-manual-e2e-checklist.md) if user-visible  

---

## Documentation layout (simplified)

```text
docs/
  AI_AGENT.md          ← you are here
  BACKLOG.md           ← SSOT: feature status index + master register
  FIRST_LAUNCH.md      ← launch execution order (sync from BACKLOG)
  PHASE0_SIGNOFF.md    ← Phase 0 done (one page)
  README.md            ← hub index
  LLM_CONTEXT.md       ← deep handbook
  backend/             ← schema, tests, manual QA
  archive/             ← old docs (archive first; delete later)
```

**Product:** BikriKhata · **Phase 0:** complete · **P1 product:** complete (2026-06-05) · **Launch:** L2 prod smoke + L6 pilot week → see FIRST_LAUNCH.

---

*Last updated: 2026-06-05*
