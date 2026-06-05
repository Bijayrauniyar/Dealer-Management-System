# Hero image / illustration brief — BikriKhata

Use this when briefing a designer or an image AI. Goal: in **3 seconds** the visitor understands **the pain** and **why they need the product**.

## Audience

Nepal **distributors, wholesalers, dealers, stockists** — godown + counter, sell on **credit**, VAT invoices, month-end handoff to CA.

## One scene to show (recommended)

**Split “before / after” or single busy godown moment:**

| Before (pain) | After (with BikriKhata) |
|---------------|-------------------------|
| Notebook + calculator, stressed owner | Same owner on phone/laptop — clear invoice on screen |
| Piles of cartons, unclear count | Same godown — “stock matches” feeling |
| Shopkeeper asking “how much do I owe?” | Phone shows customer balance / overdue |

**Emotion:** relief, control, professionalism — not “tech startup abstract.”

## Must show (pick 3–4)

1. **Godown / warehouse** — cartons, Nepal wholesale context (not retail checkout).
2. **Sales invoice** — tax bill or bill on phone (blur text; no fake IRD logo).
3. **Stock** — boxes + simple “on hand” idea.
4. **Credit** — shop counter conversation or “amount due” on screen (use word **credit**, not udhar).

## Do not show

- Retail POS / restaurant / pharmacy
- IRD emblem, competitor logos, brand-owned product art (e.g. ice-cream brand marks)
- “Phase 2”, “coming soon”, notebook screenshots with readable private data
- Cluttered UI mock with unreadable tiny text

## Product screenshots (landing)

Real app UI: hero `mobile-bill.png` (finished tax invoice); row: `mobile-sales-new.png`, `mobile-inventory.png`, `mobile-purchase.png`, `mobile-customers.png` — see [MARKETING_SCREENSHOTS_PLAN.md](./MARKETING_SCREENSHOTS_PLAN.md). Regenerate: `npm run capture:marketing`.

```bash
cd app && npm run dev   # separate terminal
npm run capture:marketing
```

The script sets shop name to **Shree Bajrang Traders** (Birgunj) and fixes one test customer label before capture. Re-run after UI changes.

## Style

- Flat or soft 3D illustration; teal **#0d9488** + white + slate
- 16:9 or 4:3 for hero right column; also export **square** crop for social
- Readable at mobile width — **large shapes**, few characters

## Sample AI prompt

```
Hero illustration for BikriKhata, B2B billing software for Nepal wholesalers.
Scene: distributor godown with stacked cartons; owner at counter issuing invoice on smartphone;
second panel or overlay: clear stock list and customer balance — calm, in control.
Flat modern SaaS illustration, teal #0d9488 and white, no photograph, no retail cashier,
no pharmacy. Large simple shapes, Nepal wholesale mood, trustworthy.
16:9 aspect ratio.
```

## Where it goes in the app

Save as `app/public/marketing/hero-illustration.png` (or `.webp`) and point `LandingPage` hero `<img>` to it beside or instead of the phone mock when ready.

## Logo note

Current artwork is a **full lockup** (icon + name + tagline). For nav, use the full lockup scaled — or commission a **simple square icon** (B + boxes only) for small sizes. Busy icons do not read well below 48px.
