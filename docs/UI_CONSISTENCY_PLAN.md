# UI / UX consistency plan (BikriKhata)

**Goal:** One visual language — same buttons, list chrome, forms, filters — via reusable components in `app/src/components/app/patterns.tsx`.

**Hub:** **UI-1 done (2026-06-05)** — see [BACKLOG.md](BACKLOG.md) and [FIRST_LAUNCH.md](FIRST_LAUNCH.md).

---

## Reusable components (`patterns.tsx`)

| Export | Use for |
|--------|---------|
| `PageTitle` | Single H1 style on any page |
| `SectionLabel` | “PAYMENTS RECEIVED”, filter section headers |
| `FormPageHeader` | Back + title + subtitle (forms, support, sale entry) |
| `ListPageHeader` | Back (optional) + **Add** + title (products, suppliers, …) |
| `AddEntityButton` | Standard `+ Add …` (`Button` primary sm) |
| `SegmentedTabs` | Settings tabs; archives hub |
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
| `DateDisplay` | BS + AD; use `compact` in lists (`components/app/DateDisplay.tsx`) |
| `EntityList` / `EntityListCard` | Divided compact rows — products, customers, suppliers (`EntityListCard.tsx`) |
| `DateFormField` | One-row picker + inline BS/AD preview |

---

## Entity hub template (list → detail → form)

Every master entity (products, customers, suppliers) should follow:

| Layer | Components / behaviour |
|-------|------------------------|
| **List** | `ListPageHeader` (+ Add) → `ListBrowsePanel` → `EntityList` + `EntityListCard` (masters) or `ListRow` in `Card` (transactions) → `ListPagination` |
| **Detail** | `PageBackLink` → title + KPIs → `DetailActions` (related flows: sale, payment, purchase, …) → `MasterArchiveAction` when active |
| **Form** | `FormPageHeader` → fields → `StickyBar` save |
| **Archives** | `/app/archives` hub + Active/Archived filter on master lists (DEL-1) |

**Reference:** `ProductsPage` + `ProductDetailPage`. **Customers:** `CustomersPage` + `CustomerDetailPage`. **Suppliers:** `SuppliersPage` + `SupplierDetailPage`.

**Routes (bottom bar):** Home = ops dashboard; **Customers** → `/app/customers`; **Stock** → `/app/products`; `/app/stock` redirects to products.

---

## Rollout status

### Done (UI redesign Phase 0–5)

- [x] `patterns.tsx` library + `DateDisplay`
- [x] Entry forms → `FormPageHeader` (payment, purchase, return, expense, damage, scheme, capital, stock adjustment, daily cash, …)
- [x] Home → ops dashboard (`HOME_QUICK_ACTIONS`, today KPIs, attention cards)
- [x] Bottom bar: Home | Customers | + | Stock | Reports
- [x] `EntityList` / `EntityListCard` compact rows on products, customers, suppliers
- [x] `DateFormField` + `DateDisplay` (AD picker + BS line below)
- [x] Active/Archived filter on master lists (DEL-1)
- [x] `/app/support` — `AppSupportInquiryForm` + platform contact channels
- [x] `/app/customers` → `CustomersPage`; `/app/products` stock hub; supplier detail route
- [x] Suppliers list → `ListBrowsePanel` + detail page
- [x] Settings → Shop / Bills & tax / Catalog & stock / Data & account (`SegmentedTabs`)
- [x] Reports hub → categorized sections; dashboard unlocked via Period summary
- [x] Drawer deduped with + sheet quick entry
- [x] NPR amounts: `NumericInput` + `numericMoneyProps` (no raw `type="number"` on money in pages)

### Remaining (optional polish)

- [ ] `PageBackLink` → optional `Button variant="ghost"` wrapper (one style)
- [ ] `grep bg-teal-600 app/src/pages` audit for ad-hoc primary buttons
- [ ] **DATE-BS-1** — BS day/month/year dropdowns (backlog; native AD picker + BS line below today)

### Planned — **UX-HUB-1** (list + entry flow standard)

**Goal:** One hub per entity — list + **Add** on top; save returns to hub; inline sheet for simple masters. Full spec: [BACKLOG § UX-HUB-1](BACKLOG.md#detail--ux-hub-1-entity-hub--entry-flow--one-standard-for-whole-app).

Until shipped: keep current list → `/new` form → `navigate(-1)`; align new screens with `ListPageHeader` + `AddEntityButton` only.

---

## Design rules

| Role | Implementation |
|------|----------------|
| Primary (save only) | `Button variant="primary"` on **StickyBar** / login / Home Sales invoice |
| Secondary | `Button variant="secondary"` |
| Tertiary | `outline` or `ghost` |
| Form save | `StickyBar` only |
| Detail document actions | `PageActionBar` — utility actions **secondary**; **Collect** (money) **primary** green |
| Entity shortcuts | `DetailActions` |

---

## When you change UI — update tests (required)

| You change… | Update… | Run |
|-------------|---------|-----|
| `patterns.tsx` or a page that should use it | `e2e-tier-c.mjs` | `npm run e2e:tier-c` |
| Home / bottom nav / entity routes | `e2e-tier-c.mjs` + manual checklist § Home | `npm run e2e:phase0` |
| Settings tabs | `e2e-tier-c.mjs` + manual § Settings | `npm run e2e:tier-c` |

---

## Acceptance

1. New pages import from `patterns.tsx` / `Button` — no ad-hoc teal button classes.
2. List pages: same header (title + Add), same browse card (`ListBrowsePanel`).
3. Form pages: same header block (`FormPageHeader`).
4. Bill / form footers use `PageActionBar` or `StickyBar` only.
5. Matching e2e script updated and `e2e:phase0` passes before merge.

---

## Reference files

```
app/src/components/app/patterns.tsx
app/src/components/app/DateDisplay.tsx
app/src/components/app/PageActionBar.tsx
app/src/components/ui/button.tsx
app/src/components/app/ListBrowsePanel.tsx
app/src/components/app/StickyBar.tsx
app/src/pages/home/HomePage.tsx
app/src/pages/products/ProductsPage.tsx
app/src/pages/customers/CustomersPage.tsx
app/src/pages/suppliers/SuppliersPage.tsx
app/src/components/app/EntityListCard.tsx
app/src/components/app/DateFormField.tsx
app/src/components/app/AppSupportInquiryForm.tsx
```

*Last updated: 2026-06-05 — UI-1 done; Customers tab label; DEL-1 + EntityList shipped.*
