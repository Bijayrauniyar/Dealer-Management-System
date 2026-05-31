# Tier D → Phase 1–3 scope

**Tier D is not a single sprint.** It maps deferred product work to later phases. Phase 0 Tier C finishes the launch shell; **Tier D starts with Phase 1.0**.

Full map: [PHASE_ROADMAP.md §7](PHASE_ROADMAP.md#7-tier-d--later-phases-13).

---

## Recommended Phase 1.0 order (first paid shops)

| Priority | ID | What | Notes |
|----------|-----|------|--------|
| 0 | **UI-1** | **UI symmetry & reusable patterns** | [UI_CONSISTENCY_PLAN.md](UI_CONSISTENCY_PLAN.md) — `patterns.tsx`, migrate all list/form/action pages; no one-off buttons. Ship before or parallel with first Tier D feature. |
| 1 | **SF-0** | Salesman name on invoice + report slice | Light field; no login |
| 2 | **ORD-1** | Sales order draft (no stock move) | Header + lines |
| 3 | **ORD-3** | Convert order → sales bill | Full convert first |
| 4 | **RPT-1** | Salesman / period reports | After SF-0 or ORD |
| 5 | **BRAND-1** / inline **+** | Brands on product form | See DEFERRED_WORK |
| 6 | **IMP-1** (Phase 2) | CSV import hub | After backup story |

Phase **1.1**: partial convert, salesman login, PO, stock reserve (ORD-2b, 3b, 5, 6).  
Phase **3**: van, beat, offline field force.

---

## Explicitly not Tier C / not Phase 0

- Sales orders, PO, stock reserve
- Parent/child categories (**CAT-1** tree UI **CAT-2**)
- Full tenant backup / restore (**IMP-0**, **IMP-2**)
- Supplier scheme engine (**SUP-1**)
- IRD certify API, Tally, multi-godown

Track checkboxes: [backend/BACKEND-TODO.md](backend/BACKEND-TODO.md), [DEFERRED_WORK.md](DEFERRED_WORK.md).

---

## Phase 1 — UI-1 checklist (symmetric app chrome)

Use `app/src/components/app/patterns.tsx` + existing `Button` / `ListBrowsePanel` / `StickyBar` / `PageActionBar`.

| Area | Target |
|------|--------|
| **Lists** | `ListPageHeader` + `ListBrowsePanel` on every master list |
| **Add / edit** | `AddEntityButton` on lists; `FormPageHeader` on all form routes |
| **Delete** | `Button variant="danger"` when implemented (no custom red classes) |
| **Search / filter** | Only `ListBrowsePanel` (no duplicate search boxes) |
| **Save actions** | `StickyBar` on entry forms |
| **Document actions** | `PageActionBar` on bill-like detail |
| **Tabs** | `SegmentedTabs` for 2–5 segment switches |
| **Hints** | `InfoCallout` for VAT and similar |

**Done in repo (partial):** Home, Products, Suppliers, Customer form, Support, Sale entry header/preview/VAT, Bill detail footer.

**Remaining:** payment/purchase/return/expense/damage/scheme/capital/product form headers; dashboard/reports hub cards; settings segment control; audit `bg-teal-600` in `pages/`.

---

## How to start Phase 1 in this repo

1. Finish **UI-1** slice above OR pick **SF-0** / **ORD-1** — avoid large UI + schema change in one release.
2. Pick **SF-0** or **ORD-1** from the table above.
2. Add migration + RPC + route; extend `phase1-manual-e2e-checklist.md` and `e2e-*` scripts.
3. Update [PHASE_ROADMAP.md](PHASE_ROADMAP.md) status when 1.0 ships.

Do not mix Tier D migrations into Tier C deploy without a separate QA pass.
