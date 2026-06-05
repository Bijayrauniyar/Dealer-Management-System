# Contact form email — Resend + Supabase Edge Function

> **Status: deferred (do later).** Form already saves leads to Supabase. When you are ready, follow **“What you need to do”** below (~20 min). Also indexed as **L8** in [FIRST_LAUNCH.md](FIRST_LAUNCH.md) and [BACKLOG.md § L8](BACKLOG.md#l8--contact-form-email-alerts-deferred).

Submissions save to **`platform_inquiries`** automatically.  
This guide turns on **email to your inbox** when a row is inserted.

**Inbox:** `support.bikrikhata@gmail.com` (change via `INQUIRY_NOTIFY_TO` secret).

---

## What you need to do (~20 minutes)

Code is already in the repo. **You** must wire secrets, deploy, and the webhook (cannot be done from git alone).

| Step | You do | Command / place |
|------|--------|-----------------|
| 1 | Create **Resend** account + API key | [resend.com](https://resend.com) → API Keys → `re_…` |
| 2 | Link this repo to **your** Supabase project | `supabase login` then `cd app && supabase link --project-ref YOUR_REF` |
| 3 | Set Edge Function secrets | See [§4 Secrets](#4-secrets-production--not-in-git) below |
| 4 | Deploy the function | `cd app && npm run deploy:contact-email` |
| 5 | Create **Database webhook** | Dashboard → Database → Webhooks → INSERT `platform_inquiries` → `notify-platform-inquiry` |

**Project ref:** subdomain in `VITE_SUPABASE_URL` (e.g. `https://luvjcpawlteawovjmeuw.supabase.co` → `luvjcpawlteawovjmeuw`).

**Testing sender (no domain yet):**

```bash
supabase secrets set RESEND_API_KEY=re_your_key_here
supabase secrets set INQUIRY_NOTIFY_TO=support.bikrikhata@gmail.com
supabase secrets set RESEND_FROM="BikriKhata <onboarding@resend.dev>"
```

Until `bikrikhata.com` is verified on Resend, test emails may only reach the **email you used to sign up at Resend**. Leads still always save in **Table Editor → `platform_inquiries`**.

**Verify:** submit the contact form → new row in table → email in Gmail + Resend **Logs** + Edge Function **Logs**.

---

## Does Supabase send this email?

| Supabase feature | What it sends | Contact form? |
|------------------|---------------|---------------|
| **Auth emails** (built-in) | Sign-up confirm, password reset, magic link | No |
| **Edge Functions** (you + Resend) | Any email you build | **Yes — this guide** |

Supabase does **not** include a general “send email when table X gets a row” product. You use an **Edge Function** + **Resend** (or SendGrid). Auth mail is separate in **Authentication → Email Templates**.

---

## What is already in the repo

| File | Role |
|------|------|
| `app/supabase/functions/notify-platform-inquiry/index.ts` | Sends HTML email via Resend API |
| `app/supabase/config.toml` | `verify_jwt = false` for webhook calls |
| `app/scripts/deploy-contact-email.sh` | Deploy helper |
| `RUN_ONCE_contact_form.sql` | Table + RPC (run once in SQL Editor) |

You still must: Resend account, `supabase secrets set`, deploy, **Database Webhook** in Dashboard.

---

## Setup checklist (do in order)

### 1. Table exists (you did this)

```bash
cd app && npm run test:contact-form
```

Expect: `OK via RPC`.

### 2. Resend

1. [resend.com](https://resend.com) → sign up.
2. **API Keys** → Create → copy `re_…`.

**Testing without domain:**

```text
RESEND_FROM = BikriKhata <onboarding@resend.dev>
```

Resend may only deliver to the **email you used to sign up** until `bikrikhata.com` is verified.

**Production:**

1. Resend → **Domains** → Add `bikrikhata.com` → DNS records at your registrar.
2. Then:

```text
RESEND_FROM = BikriKhata <notifications@bikrikhata.com>
```

### 3. Supabase CLI

```bash
npm install -g supabase
supabase login
cd app
supabase link --project-ref YOUR_PROJECT_REF
```

`YOUR_PROJECT_REF` = subdomain in `VITE_SUPABASE_URL`  
(e.g. `https://luvjcpawlteawovjmeuw.supabase.co` → `luvjcpawlteawovjmeuw`).

### 4. Secrets (production — not in git)

```bash
supabase secrets set RESEND_API_KEY=re_your_key_here
supabase secrets set INQUIRY_NOTIFY_TO=support.bikrikhata@gmail.com
supabase secrets set RESEND_FROM="BikriKhata <onboarding@resend.dev>"
```

List secrets (names only):

```bash
supabase secrets list
```

### 5. Deploy Edge Function

```bash
cd app
npm run deploy:contact-email
```

Or:

```bash
supabase functions deploy notify-platform-inquiry --no-verify-jwt
```

### 6. Database webhook (Dashboard — required)

1. [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. **Database** → **Webhooks** → **Create a new hook**.
3. Settings:

| Field | Value |
|-------|--------|
| Name | `platform_inquiry_email` |
| Table | `platform_inquiries` |
| Events | **Insert** only |
| Type | **Supabase Edge Functions** |
| Function | `notify-platform-inquiry` |
| Method | POST |

4. **Create webhook**.

Without this step, rows save but **no email** is sent.

### 7. Test

1. Website → Contact → submit (Book a demo).
2. **Table Editor** → `platform_inquiries` → new row.
3. **support.bikrikhata@gmail.com** + Resend → **Logs**.
4. Errors: **Edge Functions** → `notify-platform-inquiry` → **Logs**.

---

## Local function test (optional)

```bash
cd app
cp supabase/functions/.env.example supabase/functions/.env
# Edit .env with real RESEND_API_KEY

supabase functions serve notify-platform-inquiry --no-verify-jwt --env-file supabase/functions/.env
```

Another terminal:

```bash
curl -X POST http://localhost:54321/functions/v1/notify-platform-inquiry \
  -H "Content-Type: application/json" \
  -d '{"type":"INSERT","table":"platform_inquiries","record":{"full_name":"Test","email":"you@example.com","phone":"+9779800000000","business_name":"Test Co","business_type":"Distributor","inquiry_purpose":"Book a demo","message":"hello","source":"test"}}'
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Row in DB, no email | Webhook missing or function not deployed |
| `RESEND_API_KEY not set` | Run `supabase secrets set` |
| Resend domain error | Use `onboarding@resend.dev` for testing or verify domain |
| Webhook 401 | Deploy with `--no-verify-jwt`; `config.toml` has `verify_jwt = false` |
| Prod vs dev | Run SQL + deploy + webhook on **same** project as Netlify `VITE_SUPABASE_URL` |

---

## Cost

- **Resend:** free tier (3,000 emails/month at time of writing — check Resend pricing).
- **Supabase Edge Functions:** free tier includes invocations.

---

## Related

- [CONTACT_FORM_LEADS.md](CONTACT_FORM_LEADS.md) — database leads only  
- `app/supabase/README.txt` — step 31  
- Support display email: `app/src/config/supportContacts.ts`
