# Scheme release — deploy checklist

**When schemes are not used:** no rows in `scheme_tracker` (or none active on bill date) → sales behave as before. No free lines, no hints. `syncSchemeFreeLines` is a no-op when the schemes list is empty.

## Pre-deploy (local)

```bash
cd app
npm run deploy:check
npm run e2e:smoke
# optional with credentials in .env.local:
npm run e2e:bill
npm run e2e:stock:live
```

Do **not** run `npm run seed:schemes` on production unless you want test promos.

## Supabase (production)

| Migration | Required? |
|-----------|-----------|
| `0001`–`0011` | Already applied if app works today |
| **`0012_scheme_uom.sql`** | **Only** for buy Box / free PCS schemes |

## Manual smoke (5 min)

1. **Without schemes:** new bill → add line → save → totals unchanged.
2. **With scheme:** More → Scheme → save → new bill with qualifying qty → FOC line on print (amount 0).
3. Reopen saved bill → FOC row still shows.

## Netlify

Push `main` → auto deploy. Hard-refresh client browsers.

## Backlog (not this release)

- Supplier scheme on purchase + pass-through to customer (`BACKEND-TODO.md`).
- **INV-1 / INV-2** — deferred; plan in [`DEFERRED_WORK.md`](DEFERRED_WORK.md). Does **not** block this deploy.
