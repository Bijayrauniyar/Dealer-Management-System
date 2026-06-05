# Guide for AI agents (and humans)

**Do not read every file in `docs/`.** Use this order.

---

## Read order

| Step | File | Use when |
|------|------|----------|
| 1 | **[FIRST_LAUNCH.md](FIRST_LAUNCH.md)** | Priorities before ads; P0/P1/P2 (user edits Status) |
| 2 | **[BACKLOG.md](BACKLOG.md)** | Deferred feature IDs; promote to FIRST_LAUNCH when building |
| 3 | **[LLM_CONTEXT.md](LLM_CONTEXT.md)** | Routes, RPCs, file map, E2E commands (coding sessions) |
| 4 | [backend/data-model.md](backend/data-model.md) | Schema / migrations |
| 5 | [backend/phase1-use-cases-and-tests.md](backend/phase1-use-cases-and-tests.md) | `npm run e2e:*` |

**Humans — quick status:** [PHASE0_SIGNOFF.md](PHASE0_SIGNOFF.md) (Phase 0 complete) · [README.md](README.md) (full index)

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

1. Update **FIRST_LAUNCH** or **BACKLOG** (status / new ID)  
2. **LLM_CONTEXT** changelog (one dated bullet)  
3. Matching **`e2e-*.mjs`** script  
4. [phase1-manual-e2e-checklist.md](backend/phase1-manual-e2e-checklist.md) if user-visible  

---

## Documentation layout (simplified)

```text
docs/
  AI_AGENT.md          ← you are here
  FIRST_LAUNCH.md      ← active launch checklist
  BACKLOG.md           ← all deferred work
  PHASE0_SIGNOFF.md    ← Phase 0 done (one page)
  README.md            ← hub index
  LLM_CONTEXT.md       ← deep handbook
  backend/             ← schema, tests, manual QA
  archive/             ← old docs (archive first; delete later)
```

**Product:** BikriKhata · **Phase 0:** complete · **Launch:** finish P0 in FIRST_LAUNCH.

---

*Last updated: 2026-05-26*
