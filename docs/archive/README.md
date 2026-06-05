# Archived documentation

**Policy:** Move confusing or completed docs here **first**. Do **not** delete from git until the team agrees (usually 3+ months after archive). Old links may point to `docs/archive/…`.

---

## For humans

| Use instead of archive | File |
|------------------------|------|
| What to do before ads | [FIRST_LAUNCH.md](../FIRST_LAUNCH.md) |
| Future features | [BACKLOG.md](../BACKLOG.md) |
| Phase 0 done? | [PHASE0_SIGNOFF.md](../PHASE0_SIGNOFF.md) |
| How to work in repo | [README.md](../README.md) · [AI_AGENT.md](../AI_AGENT.md) |

---

## For AI agents

- **Do not read** `docs/archive/` unless the user asks for history or old Tier sign-off steps.
- **Do read:** [AI_AGENT.md](../AI_AGENT.md) → FIRST_LAUNCH → BACKLOG → LLM_CONTEXT (when coding).
- **New features:** update BACKLOG / FIRST_LAUNCH, not files in this folder.

---

## Files in this folder

| File | Why archived |
|------|----------------|
| [YOUR_TURN_PHASE0_TIER_A.md](YOUR_TURN_PHASE0_TIER_A.md) | Tier A sign-off complete — summary in PHASE0_SIGNOFF |
| [YOUR_TURN_PHASE0_TIER_B.md](YOUR_TURN_PHASE0_TIER_B.md) | Tier B sign-off complete |
| [YOUR_TURN_PHASE0_TIER_C.md](YOUR_TURN_PHASE0_TIER_C.md) | Tier C sign-off complete |
| [PHASE0_TIER_B_DELEGATION.md](PHASE0_TIER_B_DELEGATION.md) | One-off Gemma delegation prompts |
| [BRAND_NAME_OPTIONS.md](BRAND_NAME_OPTIONS.md) | Name locked → [PRODUCT_NAMING_BRIEF.md](../PRODUCT_NAMING_BRIEF.md) |
| [GEMMA_SYSTEM_PROMPT.md](GEMMA_SYSTEM_PROMPT.md) | Local LLM system prompt; use LLM_CONTEXT + Cursor rules |
| [PHASE1_TIER_D_SCOPE.md](PHASE1_TIER_D_SCOPE.md) | Redirect stub → use BACKLOG |

---

## When to archive vs delete

| Action | When |
|--------|------|
| **Archive** | Sign-off done, superseded doc, duplicate index, old delegation prompts |
| **Keep redirect stub at `docs/` root** | Only if many external links exist (e.g. `DEFERRED_WORK.md` → BACKLOG) |
| **Delete** | After archive period and no links in repo — **team decision** |

---

*Last updated: 2026-05-26*
