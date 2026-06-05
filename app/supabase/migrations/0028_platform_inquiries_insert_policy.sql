-- Allow landing contact form via PostgREST insert (no RPC schema-cache dependency).
-- Run after 0027. Safe to re-run.

create policy if not exists platform_inquiries_public_insert
  on platform_inquiries
  for insert
  to anon, authenticated
  with check (true);

-- No SELECT policies: leads visible only in Supabase Dashboard (or service role).
