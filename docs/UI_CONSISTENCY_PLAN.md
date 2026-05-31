# UI / UX consistency plan (BikriKhata)

**Goal:** One visual language — same buttons, list chrome, forms, filters — via reusable components in `app/src/components/app/patterns.tsx`.

**Hub:** Phase 1 backlog item **UI-1** in [PHASE1_TIER_D_SCOPE.md](PHASE1_TIER_D_SCOPE.md) and [PHASE_ROADMAP.md §4](PHASE_ROADMAP.md#4-phase-1--retain--expand-after-first-paying-tenants).

---

## Reusable components (`patterns.tsx`)

| Export | Use for |
|--------|---------|
| `PageTitle` | Single H1 style on any page |
| `SectionLabel` | “PAYMENTS RECEIVED”, filter section headers |
| `FormPageHeader` | Back + title + subtitle (forms, support, sale entry) |
| `ListPageHeader` | Back (optional) + **Add** + title (products, suppliers, …) |
| `AddEntityButton` | Standard `+ Add …` (`Button` primary sm) |
| `SegmentedTabs` | Home Customers / Stock; Settings-style toggles |
| `InfoCallout` | VAT note, non-error hints |
| `LinkActionRow` | Support phone / email / WhatsApp rows |
| `PreviewToolbar` | Bill preview Print / PDF / Close |

**Already shared elsewhere:**

| Component | File |
|-----------|------|
| `Button` | `components/ui/button.tsx` |
| `StickyBar` | Form save + totals |
| `PageActionBar` | Bill detail footer actions |
| `DetailActions` | Stacked actions on entity detail |
| `ListBrowsePanel` + `ListPagination` | Search + filters + export + pages |
| `EmptyState` | Empty lists |

---

## Rollout status

### Done (Phase 0 / pre–Phase 1)

- [x] `patterns.tsx` library
- [x] `PageActionBar` + bill detail
- [x] Home: `SegmentedTabs`, `Button` for Sales invoice
- [x] Products / Suppliers: `ListPageHeader`
- [x] Customer form, Support, Sale entry header: `FormPageHeader`
- [x] Sale entry: `InfoCallout`, preview `Button`s
- [x] Phase 1 todo **UI-1** documented

### Phase 1 — UI-1 (symmetry pass)

- [ ] Migrate remaining list pages → `ListPageHeader` + `ListBrowsePanel` (customers route redirect, stock standalone, reports hub cards)
- [ ] Migrate entry forms → `FormPageHeader` (payment, purchase, return, expense, damage, scheme, capital, stock adjustment, product form)
- [ ] `PageBackLink` → optional `Button variant="ghost"` wrapper (one style)
- [ ] Delete / danger: `Button variant="danger"` only (when delete ships)
- [ ] `grep bg-teal-600 app/src/pages` → zero (except `SegmentedTabs` active state inside `patterns.tsx`)
- [ ] Manual checklist row + optional `e2e-ui-patterns.mjs` smoke (routes render)
- [ ] Settings tabs → `SegmentedTabs` or shared tab component

**Do not** mix UI-1 with first Tier D migration in same deploy without QA.

---

## Design rules

| Role | Implementation |
|------|----------------|
| Primary (save only) | `Button variant="primary"` on **StickyBar** / login / Home Sales invoice |
| Secondary | `Button variant="secondary"` |
| Tertiary | `outline` or `ghost` |
| Form save | `StickyBar` only |
| Detail document actions | `PageActionBar` — utility actions **secondary**; **Collect** (money) **primary** green |
| Entity shortcuts | `DetailActions` (or converge to `PageActionBar` in UI-1) |

---

## Acceptance

1. New pages import from `patterns.tsx` / `Button` — no ad-hoc teal button classes.
2. List pages: same header (title + Add), same browse card (`ListBrowsePanel`).
3. Form pages: same header block (`FormPageHeader`).
4. Bill / form footers use `PageActionBar` or `StickyBar` only.

---

## Reference files

```
app/src/components/app/patterns.tsx
app/src/components/app/PageActionBar.tsx
app/src/components/ui/button.tsx
app/src/components/app/ListBrowsePanel.tsx
app/src/components/app/StickyBar.tsx
```
