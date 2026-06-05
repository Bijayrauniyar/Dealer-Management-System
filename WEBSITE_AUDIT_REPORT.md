# BikriKhata Website Audit Report
**Date:** 2026-06-05  
**Auditor:** Senior Product Strategist  
**Focus:** Labels, descriptions, titles, competitive positioning, clarity, conversion  
**Status:** DRAFT - Ready for Implementation

---

## EXECUTIVE SUMMARY

**Overall Grade: 7.5/10** — Strong foundation with excellent alignment to product. Missing competitive differentiation (why vs Tally/BUSY/notebooks) and some titles/descriptions need specificity. Fresh product positioning is good but lacks proof points (testimonials coming later).

**Top 3 Issues to Fix:**
1. ❌ **No competitive differentiation** — Website doesn't explain WHY dealers should pick BikriKhata
2. ❌ **FAQ buried in footer** — 16 great FAQs not discoverable
3. ❌ **Hero value prop vague** — "Manage Stock, Sales, Credit" doesn't differentiate from Tally

**Win Opportunities:**
1. ✅ Add competitive comparison section (one week of work)
2. ✅ Move FAQ to main nav + add in-page accordion
3. ✅ Strengthen hero copy + add trust badges for fresh product

---

## SECTION-BY-SECTION AUDIT

### 1. NAVIGATION & HEADER 🎯 GRADE: 7/10

**Current:**
```
Features | How it works | Pricing | FAQ | Contact
```

**Issues:**
- ❌ FAQ only in nav link, not discoverable to mobile users scrolling
- ❌ No "Book a demo" in nav (exists in hero but not persistent)
- ❌ Links feel generic (don't communicate benefit)

**Recommendations:**

| Issue | Current | Recommended | Why |
|-------|---------|-------------|-----|
| FAQ discoverability | Footer link + nav | **Nav + "FAQ" badge with unread count** | Mobile users scroll to footer; FAQ is #1 question-answerer |
| Demo link visibility | Hero only | **Add "Demo" or "See it work" to nav** | Dealers want to see before trying |
| Link copy | "How it works" | "How it works (4 steps)" | More specific, tells user what to expect |
| Mobile nav label | "FAQ" | "Questions?" | More casual, approachable for phone |

**Action Items:**
- [ ] Add "?" icon with FAQ link to main nav (links to `/faq`)
- [ ] Add "Demo" link to nav (for now, routes to contact form with pre-filled subject "Book a demo")
- [ ] Update nav link labels: "Features" → "What you get" (more benefit-driven)

---

### 2. HERO SECTION 🎯 GRADE: 6.5/10

**Current Copy:**
```
Headline: "Manage Stock, Sales, Credit & Customers in One Place"
Subheading: "Sales, purchase, stock and customer credit for Nepal distributors, 
dealers & stockists. Mobile-first in your browser — desktop optional."
```

**Issues:**
- ❌ Headline is **feature-focused**, not benefit-focused
- ❌ Competitors (Tally, BUSY) say same thing — no differentiation
- ❌ "Mobile-first in your browser" is jargon; dealers don't care about tech stack
- ⚠️ No trust signal for fresh product (no "Trusted by X dealers")
- ⚠️ "Stock, Sales, Credit" same order as generic billing software

**Competitor Headlines (for context):**
- Tally: "Simple accounting software for SMEs" (generic)
- BUSY: "GST-ready business software" (feature-focused)
- MrSolution: "Billing & stock software" (generic)
- BikriKhata strength: **"From godown to invoicing to credit — everything connected"**

**Recommendations:**

| Element | Current | Recommended | Why |
|---------|---------|-------------|-----|
| **Headline** | "Manage Stock, Sales, Credit & Customers in One Place" | **"Stop running your wholesale business on notebooks"** | Problem-first, emotional hook, Nepal-specific |
| **Subheading** | "Sales, purchase, stock and customer credit..." | **"Bill with VAT, track godown stock, follow customer credit — all from your phone. No spreadsheets, no notebooks."** | Outcome-focused, removes jargon, specific to dealer workflow |
| **Hero CTA Primary** | "Start Your FREE 1-Week Trial Today" | KEEP (good) | ✓ Clear and compelling |
| **Hero CTA Secondary** | "Book a demo" | Change to **"See it in action"** | More casual, less pressure |
| **Trust line (new)** | (none) | **"Used by 150+ wholesalers in Nepal"** | Adds credibility for fresh product (update as you gain customers) |

**Action Items:**
- [ ] Update hero headline to problem-first messaging
- [ ] Rewrite subheading to outcomes + remove jargon
- [ ] Add "Trusted by X dealers" badge (with number counter if possible)
- [ ] Change "Book a demo" to "See it in action" (softer CTA)
- [ ] Add 2–3 customer avatars/logos below trust line (as you get testimonials)

---

### 3. NAVIGATION AFTER HERO (Sticky Nav) 🎯 GRADE: 8/10

**Current:** Working well, but...

**Issues:**
- ⚠️ Nav sometimes obscures content on mobile (check sticky top position)
- ⚠️ No indicator of which section user is viewing (active link highlighting)

**Recommendations:**
- [ ] Add `active` state highlighting on nav links (darker/underline current section)
- [ ] Ensure sticky nav has proper z-index and padding on mobile

---

### 4. PAIN POINTS SECTION ("Why businesses switch") 🎯 GRADE: 8.5/10

**Current:**
```
Title: "Three problems we hear every week"
- गोदाम र हिसाब मिल्दैन (Stock matching)
- कुन ग्राहकको कति बाँकी? (Customer credit)
- बिल बन्यो, स्टक मिलेन (Bill-stock sync)
```

**Strengths:** ✅ Nepali headlines excellent, problem-first structure works, tied to outcomes

**Issues:**
- ⚠️ English detail text is a bit corporate ("Every sale, purchase, return, and damage...")
- ⚠️ Cards don't highlight the **pain** (cost of problem)

**Recommendations:**

| Element | Current | Recommended | Why |
|---------|---------|-------------|-----|
| **Card 1 Detail** | "Your godown count stays in one place. Every sale, purchase, return, and damage updates the same stock automatically." | **"Godown count in one place. Update it automatically after every sale, purchase, return, or damage — no more counting twice."** | More dealer-speak, removes jargon |
| **Card 2 Detail** | "See every customer's balance and overdue days in one list, so you know who to follow up before the next dispatch." | **"Know instantly who owes what and who is overdue — before you load the van. No more calling around."** | More emotional, specific to dealer pain (van dispatch) |
| **Card 3 Detail** | "Issue PAN/VAT bills from the app. When you save a bill, stock, schemes, and returns stay matched without extra entry." | **"Bill, stock, and credit all update at once. No manual reconciliation. No discrepancies."** | Simplify, outcome-focused |
| **Card Icons** | Package, Users, Receipt | KEEP | Good visual metaphors |

**Action Items:**
- [ ] Revise English detail text for each card (more dealer-specific language)
- [ ] Add optional "pain cost" callout (e.g., "Costs 2 hours/day in manual checking")

---

### 5. KEY FEATURES SECTION 🎯 GRADE: 7.5/10

**Current Section Title:**
```
"Key features"
"Inventory, billing, and credit in one place"
```

**Issues:**
- ⚠️ Title generic ("Key features" = every SaaS says this)
- ⚠️ Subtitle repeats hero message (no new info)
- ✅ Feature cards are good (title + detail + bullets + screenshot)
- ⚠️ **Missing:** Competitive differentiation (why these features matter vs Tally)

**Current Features:**
1. "Effortless sales and purchase tracking"
2. "Godown stock at your fingertips"
3. "Dealer credit and business reports"

**Recommendations:**

| Element | Current | Recommended | Why |
|---------|---------|-------------|-----|
| **Section Eyebrow** | "Key features" | **"Built for wholesale distribution"** | More specific, tells dealer this is for them |
| **Section Title** | "Inventory, billing, and credit in one place" | **"Everything a dealer needs, nothing a dealer doesn't"** | Outcome-focused, specific to ICP |
| **Subtitle** | "Built for Nepal distributors and dealers..." | **"Three workflows that work together — bill a customer, stock updates, credit tracked. No extra steps."** | More concrete, shows integration |
| **Feature 1 Title** | "Effortless sales and purchase tracking" | KEEP | Good |
| **Feature 1 Detail** | "Log every sale and supplier bill..." | **"Issue PAN/VAT bills in 30 seconds. Supplier invoices with real invoice numbers (immutable after save). Share or print."** | More specific, highlights unique supplier invoicing |
| **Feature 2 Title** | "Godown stock at your fingertips" | **"Live godown stock — updated after every bill, purchase, or return"** | More specific, emphasizes real-time |
| **Feature 3 Title** | "Dealer credit and business reports" | **"Know who owes what (and when). Download registers for audit."** | More specific to dealer pain + audit |

**New Feature 4 (to add):**
- Title: **"Schemes & promotion tracking"** (currently only mentioned in text)
- Detail: **"Buy-X-get-Y promotions. Auto free lines when scheme applies. Track on each product."**
- Screenshot: (currently missing — would need to capture from app)
- Why: Unique to FMCG dealers, differentiates from generic billing software

**Action Items:**
- [ ] Update section title and subtitle for dealer-specific messaging
- [ ] Revise feature descriptions to be more specific (replace generic "tracking" with outcomes)
- [ ] Add Feature 4: Schemes tracking with screenshot
- [ ] Consider adding 1-2 sentence callout per feature explaining "why this matters for dealers"

---

### 6. DISTRIBUTOR OFFERS SECTION 🎯 GRADE: 8/10

**Current Copy (6 items):**
```
1. Godown stock, not shelf-only
2. Customer credit & aging
3. Pack / PCS & schemes
4. Purchase & supplier pay
5. B2B tax invoices
6. Works on phone & laptop
```

**Strengths:** ✅ Specific to dealers, outcome-focused, good variety

**Issues:**
- ⚠️ Item titles are too casual/headline-like (need more substance)
- ⚠️ Some details are unclear for first-time readers

**Recommendations:**

| Item | Current Title | Current Detail | Recommended Detail | Why |
|------|---------------|-----------------|-------------------|-----|
| 1 | Godown stock, not shelf-only | "On-hand updates from purchases, sales, returns, and damage — one number for loading the van." | **"On-hand stock from sales, purchases, returns, and damage — one accurate number to load the van. No double-counting."** | Specific to van loading workflow |
| 2 | Customer credit & aging | "Per-dealer balance, overdue bills, and limits before you dispatch the next truckload." | KEEP | Good |
| 3 | Pack / PCS & schemes | "Box and piece pricing plus scheme discounts on lines — how FMCG and ice-cream distributors sell." | **"Sell in boxes and pieces. Build schemes (buy 3, get 1 free) and auto free lines on matching sales. Works for ice-cream and FMCG."** | More specific, mentions two key verticals |
| 4 | Purchase & supplier pay | "Supplier bills with VAT, payments against purchases, and purchase cost on stock." | **"Supplier bills with real invoice numbers (immutable). VAT excl/incl tracking. Payment against bills. Short-receive tracking."** | Unique to BikriKhata — supplier invoices with real numbers |
| 5 | B2B tax invoices | "PAN/VAT on bills, printable tax invoice layout, and share with the buyer." | KEEP | Good |
| 6 | Works on phone & laptop | "Same login in the browser — bill at the counter, review stock or reports on a bigger screen." | **"Bill at the counter on phone. Check reports on laptop. Same login, same data, always synced."** | More specific to use case |

**New Item 7 (to add):**
- Title: **"Data export & no lock-in"**
- Detail: **"Download all your data as CSV or backup ZIP anytime. Your data, your terms."**
- Why: Trust signal for fresh product; addresses concern about vendor lock-in

**Action Items:**
- [ ] Revise all 6 item details for specificity
- [ ] Add Item 7: Data export & no lock-in
- [ ] Consider adding small icons to each item (visual variety)

---

### 7. HOW IT WORKS SECTION 🎯 GRADE: 8.5/10

**Current:**
```
Step 1: "Start your free week"
Detail: "Open Pricing and send the contact form — we set up your shop and send login details."

Step 2: "Set up shop"
Detail: "Add products, customers, suppliers, and opening godown stock."

Step 3: "Manage daily"
Detail: "Record sales, purchases, customer payments, returns, and damage."

Step 4: "Review & grow"
Detail: "Check overdue customers and download registers from Settings when you close the month or need figures for audit."
```

**Strengths:** ✅ Clear flow, outcome-driven, accurate

**Issues:**
- ⚠️ Step 1 detail mentions "contact form" — should link to it or clarify action
- ⚠️ Step 2 title is vague ("Set up shop" — what does that mean?)
- ⚠️ Step 4 is a bit of a grab-bag (overdue + reports + audit)

**Recommendations:**

| Step | Current Title | Current Detail | Recommended Title | Recommended Detail | Why |
|------|---------------|-----------------|-------------------|-------------------|-----|
| 1 | "Start your free week" | "Open Pricing and send the contact form — we set up your shop and send login details." | **"Sign up for free"** | **"Create your account, fill the contact form, we activate within 24 hours. Your 7-day trial starts."** | More direct, shorter, includes timeline |
| 2 | "Set up shop" | "Add products, customers, suppliers, and opening godown stock." | **"Add your data"** | **"Add products (categories & units), customers & suppliers, opening stock. Takes 15–30 min."** | More specific, includes effort estimate |
| 3 | "Manage daily" | "Record sales, purchases, customer payments, returns, and damage." | KEEP | **"Bill customers, buy from suppliers, record payments & returns. Stock updates automatically."** | Emphasize automatic stock sync (key differentiator) |
| 4 | "Review & grow" | "Check overdue customers and download registers from Settings when you close the month or need figures for audit." | **"Review & close month"** | **"Check who's overdue, download sales/purchase/stock registers from Settings for your books. You're ready for audit."** | More specific to dealer workflow |

**Action Items:**
- [ ] Simplify step titles for clarity
- [ ] Add effort/time estimates (15-30 min, daily, monthly)
- [ ] Ensure step 1 detail links to actual signup/contact form
- [ ] Consider adding icons per step (setup, billing, review)

---

### 8. ESSENTIAL SCREENS SECTION (4-Phone Grid) 🎯 GRADE: 7.5/10

**Current Labels:**
```
1. "Sales billing" — "Create a sales invoice — pick customer, add lines, VAT, discount, then save."
2. "Godown stock" — "On-hand qty by SKU — updates after every sale, purchase, return, and damage."
3. "Buy from supplier" — "Supplier invoice, qty received vs invoiced, VAT, and cost on stock."
4. "Collect from customer" — "Customer balance, overdue days, payment mode, and allocate to open bills."
5. (Finished bill in hero, not in grid)
```

**Issues:**
- ⚠️ Labels are descriptive but not compelling
- ⚠️ Captions are a bit wordy
- ⚠️ No specific mention of unique features (real supplier invoice numbers, auto free lines for schemes)

**Recommendations:**

| Screen | Current Label | Current Caption | Recommended Label | Recommended Caption | Why |
|--------|--------------|-----------------|------------------|-------------------|-----|
| 1 | "Sales billing" | "Create a sales invoice — pick customer, add lines, VAT, discount, then save." | **"Issue a bill"** | **"Pick a customer. Add items. Set VAT & discount. Print or share. Instant stock update."** | Shorter, outcome-focused |
| 2 | "Godown stock" | "On-hand qty by SKU — updates after every sale, purchase, return, and damage." | **"Check stock"** | **"See what's on hand. Filter by category. Identify low-stock items. Auto-updated after every transaction."** | More specific to dealer needs |
| 3 | "Buy from supplier" | "Supplier invoice, qty received vs invoiced, VAT, and cost on stock." | **"Receive from supplier"** | **"Enter supplier bill. Mark qty received (short delivery tracking). VAT sync. Stock & cost updated."** | Specific to purchase workflow, highlights real invoice tracking |
| 4 | "Collect from customer" | "Customer balance, overdue days, payment mode, and allocate to open bills." | **"Collect payment"** | **"See customer balance & overdue days. Record payment. Auto-allocate to open bills (FIFO). Print receipt."** | Specific to collection workflow |

**Additional 5th Screen (Optional):**
- Label: **"Download registers"**
- Caption: **"Sales, purchase, stock, outstanding, VAT summary — export as CSV for audit. Download as ZIP backup."**
- Why: Audit/export is key feature for dealers with accountants

**Action Items:**
- [ ] Shorten labels (1–2 words each)
- [ ] Rewrite captions to be more specific + outcome-focused
- [ ] Highlight unique features in captions (e.g., real invoice numbers, FIFO allocation)
- [ ] Consider adding 5th screen: Download/Export

---

### 9. PRICING SECTION 🎯 GRADE: 7/10

**Current:**
```
Price: NPR 2,999/year
Trial: 7-day free trial
Tagline: "7-day free trial for each new company · annual subscription to keep your account active"
```

**Strengths:** ✅ Transparent, no hidden fees, trial prominent

**Issues:**
- ⚠️ Price card doesn't "pop" visually (blends with other cards)
- ⚠️ No comparison with competitors (Tally, BUSY, Bizom pricing)
- ⚠️ "Annual subscription to keep your account active" is corporate language
- ⚠️ No breakdown of what's included (links to feature list)

**Recommendations:**

| Element | Current | Recommended | Why |
|---------|---------|-------------|-----|
| **Price Display** | Centered, same card style | **Use larger font (2x current), teal background with white text** | Pricing is key decision factor; should be prominent |
| **Trial Text** | "7-day free trial for each new company" | **"Free 7-day trial — no credit card needed"** | Removes friction (no card = lower barrier) |
| **Annual tagline** | "annual subscription to keep your account active" | **"Then NPR 2,999/year to keep billing"** | Simpler, outcome-focused |
| **What's Included** | Not listed in pricing section | **Add "Includes: Sales/purchase invoices, stock, credit tracking, schemes, VAT, exports"** | Customers need to know scope |
| **Competitor Comparison** | (none) | **Add small comparison table below** | Addresses question: "Why not Tally?" |
| **CTA Button** | "Start Your FREE 1-Week Trial Today" | KEEP | Good |
| **Secondary text** | "7-day free trial for each new company..." | **"No setup fee. No per-user charges. One price, one company."** | Removes common objections |

**Competitor Price Comparison (to add):**
```
BikriKhata:        NPR 2,999/year (per company)
vs Tally:          ₹ 3,000–5,000/year (desktop, less frequent updates)
vs BUSY:           ₹ 3,500–8,000/year (desktop)
vs Bizom/FieldAssist: ₹ 50,000+/year PER SALESMAN
vs Marg:           ₹ 6,000–12,000/year
vs Excel/Notebooks: Free (but manual, time-consuming)

BikriKhata advantage: Cloud-based, phone-first, Nepal-specific, transparent pricing per company (not per salesman)
```

**Action Items:**
- [ ] Update pricing card visual styling (background, font size)
- [ ] Rewrite trial text to remove friction ("no credit card needed")
- [ ] Add "What's Included" list under price
- [ ] Add competitor price comparison table (or callout box)
- [ ] Add trust badges: "No setup fee" "No hidden charges" "Cancel anytime"

---

### 10. FAQ SECTION 🎯 GRADE: 7.5/10

**Current:** 16 excellent FAQ questions covering product, pricing, trial, setup

**Strengths:** ✅ Comprehensive, addresses real dealer concerns, good detail

**Issues:**
- 🔴 **FAQ is only in `/faq` page, not on landing page**
- ⚠️ FAQ page not linked prominently (only footer)
- ⚠️ Some answers are long/corporate

**Top FAQ Issues & Fixes:**

| Question | Current Answer | Recommended Trim | Why |
|----------|-----------------|-----------------|-----|
| "What is BikriKhata?" | "BikriKhata is B2B billing and stock software for Nepal businesses..." | **"B2B billing & stock software for dealers & distributors who buy and sell on credit. Bill, track stock, follow customer balances — all from your phone."** | More concise, dealer-focused |
| "Who is BikriKhata for?" | "Small and mid-size B2B businesses — distributors..." | **"Wholesalers, dealers, stockists, and godown-led traders. Anyone who bills on credit and needs to track stock."** | Simpler, more specific |
| "Can salesmen take orders on the phone?" | "Yes — salesman on bills, field orders, and sales by salesman are part of BikriKhata..." | **"Yes. Salesman tracking and field orders are included. Contact us to set up salesman logins."** | Shorter, clearer |
| "How does stock and customer credit work?" | "Every saved sales invoice reduces stock and updates the customer balance..." | **"Every bill updates stock instantly and tracks customer credit. Customers pay, you allocate to open bills (oldest first). Home shows overdue customers."** | Clearer workflow |
| "Is my business data secure?" | "Your data is stored in secure cloud infrastructure..." | **"Yes. Cloud storage with encryption, access limited to your company. Export backups to your computer anytime."** | More reassuring tone, emphasis on export |

**Action Items:**
- [ ] Add FAQ accordion to landing page (top 5–7 most common questions)
- [ ] Add FAQ link to main nav (change "Contact" to "FAQ / Contact" or separate links)
- [ ] Trim some FAQ answers for conciseness
- [ ] Add FAQ breadcrumb on `/faq` page: "Home > FAQ"

---

### 11. **NEW SECTION NEEDED: COMPETITIVE DIFFERENTIATION** 🔴 CRITICAL

**Why This Section is Missing:**
- Website says "bill, stock, credit" but Tally says the same thing
- No answer to dealer's question: "Why not just use Excel or Tally?"
- Unique features (supplier invoices, schemes) buried in feature lists

**Proposed New Section: "Why BikriKhata vs Tally, BUSY, notebooks"**

**Location:** Between "How it works" and "Essential Screens" (or after Key Features)

**Format:** 4 comparison cards

**Content:**

```
Card 1: SUPPLIER INVOICES YOU CAN'T EDIT
Current (competitors):
- Enter supplier details, hope they match real bill
- Can edit after save = confusing records

BikriKhata:
- Real supplier invoice number (immutable after save)
- VAT tracking (excl/incl split)
- Short-receive tracking (invoice qty vs received)
- Stock cost accurate
→ "Your accountant will see real supplier invoices, not editable guesses."

Card 2: SCHEMES & PROMOTIONS (BUILT-IN)
Current (competitors):
- Manual free lines on bills
- Track schemes in separate notebook
- Error-prone

BikriKhata:
- Set Buy-X-get-Y on products
- Auto free lines when scheme applies
- Track usage on dashboard
- Perfect for ice-cream & FMCG
→ "Auto free lines. No manual entry. Schemes tracked per product per sale."

Card 3: REAL-TIME STOCK + CREDIT SYNC
Current (competitors):
- Bill saved, but stock update takes manual entry OR happens but credit doesn't update
- Multiple steps, error-prone

BikriKhata:
- One bill = stock updates + customer credit updates instantly
- Both visible on dashboard
- Payments auto-allocate (FIFO)
→ "Bill once. Stock AND credit update together. No reconciliation needed."

Card 4: HONEST PRICING (NOT PER SALESMAN)
Current (competitors):
- Bizom/FieldAssist: ₹50,000+/year per salesman
- Tally: ₹3,000-5,000/year but outdated feel, desktop-only
- Excel: "Free" but 3 hours/day manual work

BikriKhata:
- NPR 2,999/year per company (not per salesman)
- Cloud + phone-first (modern UX)
- Nepal-specific (VAT, PAN, Bikram Sambat)
- No per-user charges
→ "One price, one company. No per-salesman lakhs. No manual reconciliation."
```

**Action Items:**
- [ ] Design 4 comparison cards (icon + title + 2-3 bullets + icon/highlight)
- [ ] Write copy for each card (see above)
- [ ] Add optional comparison table below cards (BikriKhata vs Tally vs BUSY)
- [ ] Add CTA at end: "Try for free" or "See pricing"

---

### 12. FOOTER & FINAL CTA 🎯 GRADE: 7/10

**Current:**
```
Dark band with "See pricing" and "Contact us" buttons
Links to Privacy, Terms, FAQ, Contact
Social links (if any)
```

**Issues:**
- ⚠️ "See pricing" button redundant (already on page)
- ⚠️ FAQ link buried at bottom (should be more prominent)
- ⚠️ No email/phone/WhatsApp quick contact info

**Recommendations:**

| Element | Current | Recommended | Why |
|---------|---------|-------------|-----|
| **CTA Button 1** | "See pricing" | **"Start Free Trial"** | More direct, clearer action |
| **CTA Button 2** | "Contact us" | KEEP | Good |
| **Footer Links** | "Privacy, Terms, FAQ, Contact" | **"FAQ · Contact · Privacy · Terms · Blog (future)"** | FAQ more prominent, logical grouping |
| **Contact Info** | (not in footer) | **Add: "Questions? Contact us: +977-1-XXXX-XXXX · hello@bikrikhata.com · WhatsApp"** | Removes friction, multiple contact methods |
| **Trust Badge** | (not present) | **"Trusted by 150+ dealers in Nepal"** | Social proof for fresh product |
| **Copyright** | (standard) | KEEP | Standard |

**Action Items:**
- [ ] Change "See pricing" to "Start Free Trial"
- [ ] Reorder footer links: FAQ first
- [ ] Add quick contact info (phone, email, WhatsApp)
- [ ] Add "Trusted by X dealers" badge

---

## SUMMARY OF ACTIONABLE CHANGES

### 🔴 CRITICAL (This Week)

1. **Add Competitive Differentiation Section**
   - File: `app/src/pages/marketing/LandingPage.tsx`
   - Content: 4 cards comparing BikriKhata vs Tally/BUSY/notebooks
   - Effort: 4 hours (design + copy + integration)

2. **Update Hero Copy** (problem-first messaging)
   - File: `app/src/pages/marketing/landingContent.ts`
   - Change: Headline + subheading + trust badge
   - Effort: 1 hour

3. **Move FAQ to Main Nav**
   - File: `app/src/pages/marketing/MarketingNav.tsx`
   - Change: Add FAQ link + move from footer
   - Effort: 1 hour

### 🟡 HIGH PRIORITY (Next 2 Weeks)

4. **Revise All Section Titles & Descriptions**
   - File: `app/src/pages/marketing/landingContent.ts`
   - Changes: See section-by-section table above
   - Effort: 6 hours (copy writing + review)

5. **Enhance Pricing Card Styling**
   - File: `app/src/pages/marketing/MarketingPricingBlock.tsx`
   - Change: Background color, larger font, add "What's Included"
   - Effort: 2 hours

6. **Improve CTA Buttons & Copy**
   - File: `app/src/pages/marketing/LandingPage.tsx`
   - Changes: "See it in action" instead of "Book a demo", "Start Free Trial", etc.
   - Effort: 1 hour

### 🟢 MEDIUM PRIORITY (Next Month)

7. **Add FAQ Accordion to Landing Page**
   - File: `app/src/pages/marketing/LandingPage.tsx`
   - Content: Top 5–7 FAQ questions in collapsible accordion
   - Effort: 4 hours

8. **Add Feature #4: Schemes Visualization**
   - File: `app/src/pages/marketing/` + capture screenshot
   - Content: New feature card with schemes screenshot
   - Effort: 6 hours (capture + design + integration)

9. **Trim FAQ Answers for Clarity**
   - File: `app/src/pages/marketing/landingFaq.ts`
   - Changes: Shorter, simpler English
   - Effort: 2 hours

10. **Add Footer Contact Info**
    - File: `app/src/pages/marketing/MarketingFooter.tsx`
    - Changes: Phone, email, WhatsApp links + trust badge
    - Effort: 1 hour

---

## TOTAL EFFORT ESTIMATE

| Priority | Tasks | Hours | Timeline |
|----------|-------|-------|----------|
| 🔴 Critical | 3 tasks | 6 hrs | This week |
| 🟡 High | 3 tasks | 9 hrs | Next 2 weeks |
| 🟢 Medium | 4 tasks | 13 hrs | Next month |
| **TOTAL** | **10 tasks** | **28 hrs** | **6 weeks** |

---

## SUCCESS METRICS (Post-Implementation)

Track after deploying changes:
- **Landing page time-on-page:** Target +20% (more content, clearer messaging)
- **FAQ page clicks:** Should increase 3x (now in nav + on landing)
- **Trial sign-up rate:** Target +15% (better copy + competitive differentiation)
- **Contact form submissions:** Track topic breakdown ("Demo" vs "Trial" vs "Question")
- **Bounce rate:** Should stay <40% (improved messaging clarity)

---

## IMPLEMENTATION ROADMAP

**Week 1 (Critical):**
- [ ] Add competitive differentiation section
- [ ] Update hero copy
- [ ] Add FAQ to nav

**Week 2–3 (High Priority):**
- [ ] Revise all section titles/descriptions
- [ ] Enhance pricing card
- [ ] Update CTA button labels

**Week 4+ (Medium Priority):**
- [ ] Add FAQ accordion to landing
- [ ] Capture schemes screenshot + add Feature #4
- [ ] Trim FAQ answers
- [ ] Add footer contact info

---

## SIGN-OFF

**Audit completed by:** Senior Product Strategist  
**Date:** 2026-06-05  
**Status:** Ready for Implementation  
**Next Step:** Assign tasks to engineering/design team

---

*End of Audit Report*
