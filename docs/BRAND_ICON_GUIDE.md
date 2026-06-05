# BikriKhata — app icon guide

**In repo today:**

| File | Use |
|------|-----|
| `icon.png` (512×512) | PWA / favicon (`BRAND_LOGO_SRC`) |
| `icon-source.png` / `logo-lockup.png` (1254×1254) | Hero + login full lockup (`BRAND_LOGO_LOCKUP_SRC`) |
| `icon-mark.png` (512×512) | **PWA / favicon only** — square app graphic (teal zone), not used in site nav |

**Website nav and hero** use `logo-lockup.png` (full file, not cropped) so the name and tagline stay intact.

`icon-mark` exists only because browser and “Add to home screen” icons must be a **square** without the tall wordmark block below. Regenerate from source if needed:

```bash
cd app/public/icons
sips --cropToHeightWidth 860 860 --cropOffset 0 197 icon-source.png --out icon-mark-temp.png
sips -z 512 512 icon-mark-temp.png --out icon-mark.png && cp icon-mark.png icon.png
rm icon-mark-temp.png
```

**After you replace the file:** `cd app && npm run build` (Vite syncs `index.html` + manifest).

---

## What the icon should communicate

| Show | Avoid |
|------|--------|
| Godown / warehouse, stacked cartons, stock on hand | Retail checkout, restaurant, single shopping bag |
| B2B distribution (bulk, ledger, invoice) | Pharmacy pills, van GPS, generic “ERP cloud” |
| Nepal wholesaler energy — simple, trustworthy | Busy photo backgrounds, tiny text, gradients |

**Brand colors:** background **#0d9488** (teal), symbol **#ffffff**. Match [productBrand.ts](../app/src/config/productBrand.ts) `BRAND_THEME_COLOR`.

---

## ChatGPT / image AI prompts

Use **one** of these; ask for **square 1024×1024**, flat vector style, no photograph.

### Prompt A — recommended (godown + boxes)

```
App icon for "BikriKhata", a Nepal B2B billing app for wholesalers, distributors, dealers and stockists (not retail POS).

Design: flat minimal vector, square with rounded corners (iOS style). Background solid teal #0d9488. White icon only: small warehouse/godown with roll-up door, three stacked cardboard cartons in front, subtle arrow suggesting distribution to shops. No text, no gradients, no shadows. Must stay readable at 32×32 pixels — very simple shapes.

Style reference: modern fintech/SaaS app icons (Stripe, Notion simplicity). Professional, trustworthy.
```

### Prompt B — ledger + stock (alternative)

```
Square app icon, flat design. Teal #0d9488 background, white symbol: clipboard or invoice document with three small boxes/crates beside it — represents wholesale billing + inventory for Nepal distributors. No letters, no photo, no retail shopping cart. Minimal geometric shapes, high contrast, readable at favicon size.
```

### Prompt C — monogram + trade (if you want “BK”)

```
App icon: rounded square teal #0d9488. White bold letters "BK" integrated with two simple crate/box shapes underneath (wholesale stock). Clean sans-serif, no 3D, no shadow. B2B wholesale software for Nepal — not consumer shopping app.
```

---

## Export checklist (after AI generates PNG)

| Step | Detail |
|------|--------|
| 1 | Export **1024×1024** PNG (master) |
| 2 | Optional: run through [Squoosh](https://squoosh.app) or SVG trace if you want vector |
| 3 | Replace or convert to SVG for repo — PWA uses `app/public/icons/icon.svg` |
| 4 | `npm run build` and check tab favicon + “Add to Home Screen” on phone |
| 5 | Landing/login: same path `/icons/icon.svg` — no code change if filename unchanged |

**PNG-only path:** Add `icon-512.png` and update `vite.config.ts` PWA `icons` array — prefer keeping one SVG source for sharp scaling.

---

## Manual tweaks in ChatGPT

- “Simplify — remove arrow, only warehouse and two boxes”
- “Make cartons larger, godown smaller”
- “Use Nepal-inspired palette but keep teal #0d9488 background”

---

## Landing screenshots (mobile — replace placeholders)

Capture on a **phone** (390×780 crop or full-height PNG). Drop into `app/public/marketing/` keeping the filename.

| File | App screen |
|------|------------|
| `mobile-home.svg` | `/app/home` — KPIs + bottom tabs |
| `mobile-bill.svg` | `/app/bills/:billNo` — Print / Share visible |
| `mobile-inventory.svg` | `/app/home?tab=stock` — Inventory list |
| `mobile-customers.svg` | `/app/home?tab=customers` — Customer list |
| `mobile-export.svg` | Settings → **Export** tab |

Paths are defined in `landingContent.ts` (`MOBILE_SHOWCASES`). **Do not** show file paths or “replace this placeholder” text on the public site — only short captions (e.g. “Home — sales, stock & credit”).

**Logo placement:** Nav, footer, hero, and login use `logo-lockup.png` (full artwork). Favicon/PWA use `icon-mark.png` / `icon.png` (square crop).

---

## Legal

Do not use competitor logos, IRD emblem, or brand-owned product art (e.g. ice-cream brand marks) in the app icon.
