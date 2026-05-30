# Bill letterhead layout (Nepal IRD alignment)

**Not legal advice.** Product layout follows **VAT Rules** tax-invoice particulars (**Schedule 5**). Confirm with a CA or IRD for each tenant (abbreviated invoice, e-billing mandate, etc.).

**Official reference:** [ird.gov.np](https://ird.gov.np) — VAT Act / VAT Rules and schedules.

**Code:** `app/src/lib/sellerLetterhead.ts`, `app/src/lib/sellerAddressLine.ts` (2-line address), `app/src/components/app/BillLetterhead.tsx` — used by `BillPrintView`, `PurchaseBillView`, `billPdfDocument.ts`.

---

## Schedule 5 → BikriKhata letterhead (seller block)

| Schedule 5 particular (seller) | BikriKhata app |
|--------------------------------|--------|
| Name of registered person | Left, bold — `sellerBillName` (legal name if set, else trading) |
| Address of registered place of business | Left — **Address line 1** (and optional line 2); district/province only if Settings toggle on |
| VAT registration number | Right — **VAT** + number when `vatRegistered` + `vatNumber` |
| PAN (non-VAT shops) | Right — **PAN** when no VAT number |
| Contact | Right, **below** tax id — **Ph** (mobile preferred); not embedded in address string |
| Document must show it is a **tax invoice** | Center — **TAX INVOICE** when VAT registered (`billDocumentTitle`) |

IRD does not prescribe pixel layout; it requires particulars to be **clear and conspicuous**. This header matches common Nepali printed tax invoices and audit practice.

---

## App labels vs printed titles (do not mix)

| Layer | Sales | Purchase |
|-------|-------|----------|
| **App** (menus, buttons) | Sales invoice | Purchase invoice |
| **Print / PDF** (VAT shop) | **TAX INVOICE** | **Purchase invoice** (your input-VAT record) |
| **Print** (non-VAT) | **INVOICE** | Purchase invoice |

**Why:** IRD expects the words **tax invoice** on outward taxable supply documents. “Sales invoice” is workflow language only — using it on print would confuse buyers and accountants.

---

## Why this layout

| Area | What we show | IRD / practice reason |
|------|----------------|------------------------|
| **Left — name** | Legal or trading name (`sellerBillName`) | Seller identification on tax invoice |
| **Left — address** | **Line 1** (and optional **line 2**) from Settings — e.g. `Ranighat-11, Birgunj` | Dealer controls what prints; put full address in line 1 if needed. Optional second line: district · province · Nepal (toggle, off by default) |
| **Right — VAT or PAN** | One tax id (VAT if registered, else PAN) | Seller registration on tax invoice |
| **Right — Ph** | Mobile or landline **below** tax id | Contact for buyer/audit; **not** mixed into address (saves space on mobile/A4) |
| **Center** | **TAX INVOICE** (VAT shop) or **INVOICE** | Statutory document title when VAT registered ([`billDocumentTitle`](app/src/lib/billDisplay.ts)) |

IRD does not mandate “phone under VAT,” but it requires seller **address** and **registration** to be **clear and conspicuous**. This layout matches most Nepali printed tax invoices and audit expectations.

---

## What we do *not* put on the letterhead

- **“Sales invoice”** — app menu label only; print uses **Tax Invoice** / **Invoice** per law.
- Phone at the end of address (`Birgunj · … · Ph 98…`) — old layout; removed 2026-05-26.
- City-only address (e.g. “Kathmandu”) — allowed in minimal software; we encourage full Settings address for VAT shops.

---

## Settings → bill mapping

| Settings field | Letterhead |
|----------------|------------|
| Trading / legal name | Bold name |
| **Address line 1** | Printed on invoices |
| **Address line 2** | Optional second printed line |
| District, province | **Not printed** unless **Include district and province on invoices** is on |
| Mobile / phone | Right column under VAT/PAN |
| VAT registered + VAT no. | Right: **VAT** … |
| PAN only | Right: **PAN** … |

**Default:** only address lines 1–2 appear on bills (like many local invoices: `Ranighat-11, Birgunj`). Turn on the checkbox to also print `Parsa · Madhesh Pradesh · Nepal` under them. DB: `tenant_settings.show_district_province_on_bill` (migration **0023**).

---

## Purchase bills

Same letterhead for **your shop** on purchase print (`PurchaseBillView`). Supplier name/address stays in the **To / From** block below; center title is **Purchase invoice** (input VAT record, not customer tax invoice).

---

## Related docs

- [GTM_NEPAL.md §5](GTM_NEPAL.md#5-nepal-vat--ird-compliance-checklist) — field checklist  
- [PURCHASE_REFERENCE_NUMBERS.md](PURCHASE_REFERENCE_NUMBERS.md) — purchase bill header  
- [data-model.md](backend/data-model.md) — `tenant_settings`, customers  
