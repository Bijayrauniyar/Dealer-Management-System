#!/usr/bin/env bash
# Deploy contact-form email Edge Function (Resend).
# Prerequisites: supabase login, supabase link, secrets set (see docs/CONTACT_FORM_EMAIL_SETUP.md)
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> Deploying notify-platform-inquiry (no JWT — database webhook only)"
npx supabase functions deploy notify-platform-inquiry --no-verify-jwt

echo ""
echo "==> Done. Required manual steps:"
echo "  1. supabase secrets set RESEND_API_KEY=re_..."
echo "  2. supabase secrets set INQUIRY_NOTIFY_TO=support.bikrikhata@gmail.com"
echo "  3. supabase secrets set RESEND_FROM='BikriKhata <onboarding@resend.dev>'"
echo "  4. Dashboard → Database → Webhooks → INSERT on platform_inquiries → notify-platform-inquiry"
echo ""
echo "Test form: npm run test:contact-form"
