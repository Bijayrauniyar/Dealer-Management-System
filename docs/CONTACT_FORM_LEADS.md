# Contact form — leads in Supabase

## Where submissions go

| Destination | Automatic? |
|-------------|------------|
| **Supabase → `platform_inquiries`** | Yes (after `RUN_ONCE_contact_form.sql`) |
| **Email → support.bikrikhata@gmail.com** | No — **deferred**; setup when ready |

**Read leads:** Dashboard → **Table Editor** → `platform_inquiries`.

**Email alerts (do later):** [CONTACT_FORM_EMAIL_SETUP.md](CONTACT_FORM_EMAIL_SETUP.md) — section **“What you need to do”**, or copy-paste checklist in [BACKLOG § L8](BACKLOG.md#l8--contact-form-email-alerts-deferred).

## One-time SQL

Run `app/supabase/migrations/RUN_ONCE_contact_form.sql` in SQL Editor.  
Verify: `cd app && npm run test:contact-form`

## Columns stored

`full_name`, `email`, `phone`, `business_name`, `business_type`, `inquiry_purpose`, `message`, `source`, `created_at`
