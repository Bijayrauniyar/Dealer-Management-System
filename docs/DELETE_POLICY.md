# Delete, archive, and void policy

**Navigate:** [FIRST_LAUNCH](FIRST_LAUNCH.md) · [BACKLOG](BACKLOG.md) · [Data model](backend/data-model.md) (cross-cutting policy)

> Nepal dealer ERP norm (Tally / BUSY / Marg / Sigma-style): **masters archive** (hide from daily work), **posted bills never hard-delete**.

---

## Shop app rule (now)

**No hard delete in the shop UI for any entity** — not products, customers, bills, payments, or anything else.

| What users do | What happens in DB |
|---------------|-------------------|
| **Archive** a master | `is_active = false` — hidden from bill/purchase pickers |
| **Restore** a master | `is_active = true` |
| **Cancel** an open order | `cancelled_at` / status — row kept |
| **Edit / return / void** a bill (void future) | Rows kept for books and export |

**Permanent delete** is **not shipped** in v1. Wrong rows are fixed by archive, edit, return, or support SQL — not `DELETE` from the app.

**Future (optional, not v1):** permanent delete for a master **only** if it was **never used** on any bill, payment, or stock line — via RPC + support tool, not a normal shop button.

---

## UI wording (DEL-1)

Use **Archive** / **Restore** on master screens (maps to `is_active`). Do **not** show **Delete** on master lists for now.

Master lists show **active only**. Archived records: **More → Archives** (`/app/archives`) — tabs for products, customers, suppliers; **Restore** only (no permanent delete). Pickers load **active only**.

---

## Matrix

| Entity | User action | Hard delete? | Implementation |
|--------|-------------|--------------|----------------|
| Product | Archive / restore | **No** | `is_active`; hide from pickers when archived |
| Customer | Archive / restore | **No** | Warn or block archive if outstanding > 0 |
| Supplier | Archive / restore | **No** | Warn or block archive if payable > 0 |
| Salesman | Archive / restore | **No** | Keep on old bills/orders |
| Scheme | Archive / end date | **No** | `is_active` |
| Sales order (open) | Cancel | **No** | `cancelled_at` / status |
| Sales order (invoiced) | — | **No** | Read-only; link to bill |
| Sales / purchase **bill** | Edit / return / void (future) | **Never** | Rows stay for books and export |
| Payment | Reverse (future) | **No** | |
| Return, expense, damage | Soft hide (Phase 2) | **No** | |
| Capital | Soft hide + audit (Phase 2-C) | **No** | |
| Stock adjustment | Opposing entry | **No** | |
| Category (Settings jsonb) | Remove if unused | N/A | Not a ledger row |
| Notification | Dismiss / read | Soft OK | |

---

## Rules

1. If it touched **stock, money, or VAT books** → **never** hard delete from the app.  
2. If it is **master or draft workflow** → archive or cancel; row stays in DB.  
3. **Shop UI:** no **Delete** / permanent remove — archive + restore only until a later deliberate release.  
4. **Support / SQL Editor:** fix mistakes out of band; not a product feature for dealers.

---

## DEL-1 (implementation backlog)

- [x] `docs/DELETE_POLICY.md` (this file)  
- [x] RPC: `set_product_active`, `set_customer_active`, `set_supplier_active` (`0037`)  
- [x] UI: **Archive** / **Restore** on product, customer, supplier detail  
- [x] Master lists: filter **Active · Archived · All**  
- [x] Pickers: active masters only (unchanged behaviour)  
- [ ] Cancel open sales order (with ORD-1 — P2)  
- [x] **No** permanent delete button in shop UI (v1)

See [FIRST_LAUNCH.md](FIRST_LAUNCH.md) **DEL-1**.

---

*Last updated: 2026-05-26 — no hard delete in shop app; archive/restore for masters.*
