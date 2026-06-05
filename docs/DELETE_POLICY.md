# Delete, deactivate, and void policy

**Navigate:** [FIRST_LAUNCH](FIRST_LAUNCH.md) · [BACKLOG](BACKLOG.md) · [Data model](backend/data-model.md) (cross-cutting policy)

> Nepal dealer ERP norm (Tally / Busy / Marg / Sigma-style): **masters deactivate**, **posted bills never hard-delete**.

---

## Matrix

| Entity | User action | Hard delete? | Implementation |
|--------|-------------|--------------|----------------|
| Product | Deactivate | No | `is_active = false`; hide from pickers |
| Customer | Deactivate | No | Block or warn if outstanding > 0 |
| Supplier | Deactivate | No | Block or warn if payable > 0 |
| Salesman | Deactivate | No | Keep on old bills/orders |
| Scheme | Deactivate / end date | No | `is_active` |
| Sales order (open) | Cancel | No | `cancelled_at` / status |
| Sales order (invoiced) | — | No | Read-only; link to bill |
| Sales / purchase **bill** | Edit / return / void (future) | **Never** | Rows stay for CA/export |
| Payment | Reverse (future) | No | |
| Return, expense, damage | Soft hide (Phase 2) | No | |
| Capital | Soft delete + audit (Phase 2-C) | No | |
| Stock adjustment | Opposing entry | No | |
| Category (Settings jsonb) | Remove if unused | N/A | |
| Notification | Dismiss / read | Soft OK | |

---

## Rules

1. If it touched **stock, money, or VAT books** → no hard delete from the app.  
2. If it is **master or draft workflow** → soft deactivate or cancel.  
3. **Concurrent / support:** optional hard delete of empty never-used drafts — support tool only, not shop UI.

---

## DEL-1 (implementation backlog)

- [ ] `docs/DELETE_POLICY.md` (this file)  
- [ ] RPC: `deactivate_product`, `deactivate_customer`, `deactivate_supplier`  
- [ ] UI: Deactivate on form/detail + confirm modal (`Button variant="danger"`)  
- [ ] Optional: “Show inactive” on master lists  
- [ ] Cancel open sales order (with ORD-1)

See [FIRST_LAUNCH.md](FIRST_LAUNCH.md) **DEL-1**.

---

*Last updated: 2026-05-26*
