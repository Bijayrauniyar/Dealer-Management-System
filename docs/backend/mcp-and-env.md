# Supabase: MCP (Cursor) vs app environment variables

**Navigate:** [Docs hub](../README.md) · [Project README](../../README.md) · [Testing live](./testing-live-supabase.md) · [Migrations](../../app/supabase/README.txt) · [Backend checklist](./BACKEND-TODO.md)

This doc explains **why** we have two different ways to talk to the same Supabase project, and what each file is for.

---

## 1. `app/.env.local` — **Vite / browser app** (`@supabase/supabase-js`)

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Tells the React app which Supabase project to call over HTTPS. |
| `VITE_SUPABASE_ANON_KEY` | **Public** client key. RLS runs as the logged-in user; this key is safe to ship in the browser **only** because policies restrict data — never put the **service_role** key here. |

**Why separate from MCP?** The running web app has no access to Cursor’s MCP session. It only reads build-time env vars from Vite (`import.meta.env`).

**Security:** Keep `.env.local` gitignored; rotate the key if it was ever pasted into chat or committed.

---

## 2. `.cursor/mcp.json` — **Cursor agent / IDE tools**

| Piece | Purpose |
|-------|---------|
| `"url": "https://mcp.supabase.com/mcp?project_ref=…"` | Points the **Supabase MCP server** at **one** project so agent tools (SQL, logs, schema hints) don’t hit the wrong database. |

**Why not the anon key in `mcp.json`?** Hosted Supabase MCP uses **your Cursor + Supabase login** (OAuth / account link), not the anon key in the JSON file.

**Why the agent in chat may still say it can’t use Supabase MCP:** The MCP server must be **enabled and authenticated in Cursor** for that session. If only Figma/Browser appear under MCP, open **Cursor Settings → MCP**, ensure **Supabase** is on, complete any browser login prompt, then start a new agent turn.

---

## 3. Direct Postgres URL (`postgresql://postgres@db.…`)

**Not used** by `createClient` in the browser. Use only for local tools (psql, GUI, ORM migrations) with the **database password** from project creation — never commit that string.

---

## Quick checklist

1. `.env.local` filled → `npm run dev` can call Supabase from the app.  
2. Migrations run in SQL Editor (or CLI) → schema exists.  
3. Supabase MCP enabled in Cursor → agents can use Supabase tools when the server is listed as connected.

---

**Next:** [Deployment guide](../deployment.md) · [Testing against live Supabase](./testing-live-supabase.md) · [Migrations runbook](../../app/supabase/README.txt) · [Docs hub](../README.md)
