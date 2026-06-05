#!/usr/bin/env bash
# Deploy contact-form email Edge Function (Resend).
# Prerequisites: supabase login, supabase link, secrets set (see docs/CONTACT_FORM_EMAIL_SETUP.md)
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> Deploying notify-platform-inquiry (no JWT — database webhook only)"
npx supabase functions deploy notify-platform-inquiry --no-verify-jwt

echo ""
echo ""
echo "==> Prefer full setup (secrets + config URL):"
echo "    RESEND_API_KEY=re_... npm run setup:contact-email"
echo ""
echo "==> Also run migration 0033 in SQL Editor (or supabase db push):"
echo "    app/supabase/migrations/0033_platform_inquiry_email_notify.sql"
echo ""
echo "Test: npm run test:contact-email && npm run test:contact-form"
