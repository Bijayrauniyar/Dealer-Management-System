/**
 * Sends email when a row is inserted into platform_inquiries.
 * Trigger: Supabase Dashboard → Database → Webhooks → INSERT on platform_inquiries.
 *
 * Secrets (supabase secrets set …):
 *   RESEND_API_KEY      — from resend.com
 *   INQUIRY_NOTIFY_TO   — inbox (default support.bikrikhata@gmail.com)
 *   RESEND_FROM         — verified sender, e.g. BikriKhata <notifications@bikrikhata.com>
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

type InquiryRecord = {
  id?: string;
  created_at?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  business_name?: string;
  business_type?: string;
  inquiry_purpose?: string | null;
  message?: string | null;
  source?: string;
};

type WebhookPayload = {
  type?: string;
  table?: string;
  record?: InquiryRecord;
  old_record?: InquiryRecord | null;
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const NOTIFY_TO = Deno.env.get("INQUIRY_NOTIFY_TO") ?? "support.bikrikhata@gmail.com";
const RESEND_FROM = Deno.env.get("RESEND_FROM") ?? "BikriKhata <onboarding@resend.dev>";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildEmailHtml(r: InquiryRecord): string {
  const rows = [
    ["Name", r.full_name],
    ["Email", r.email],
    ["Phone", r.phone],
    ["Business", r.business_name],
    ["Type", r.business_type],
    ["Purpose", r.inquiry_purpose ?? "—"],
    ["Source", r.source ?? "landing"],
    ["Message", r.message?.trim() || "—"],
    ["Submitted", r.created_at ?? new Date().toISOString()],
  ];
  const body = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;">${escapeHtml(label)}</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:14px;">${escapeHtml(String(value ?? ""))}</td></tr>`,
    )
    .join("");
  return `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;color:#0f172a;"><p style="font-size:16px;font-weight:600;">New BikriKhata website inquiry</p><table style="border-collapse:collapse;width:100%;max-width:520px;">${body}</table><p style="font-size:12px;color:#64748b;margin-top:16px;">Also in Supabase → platform_inquiries</p></body></html>`;
}

function extractRecord(payload: WebhookPayload & InquiryRecord): InquiryRecord | null {
  if (payload.record?.email && payload.record.full_name) {
    return payload.record;
  }
  if (payload.email && payload.full_name) {
    return payload;
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  if (req.method === "GET") {
    return new Response(
      JSON.stringify({
        ok: true,
        service: "notify-platform-inquiry",
        resend_configured: Boolean(RESEND_API_KEY),
        notify_to: NOTIFY_TO,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not set");
    return new Response(JSON.stringify({ error: "Email not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const record = extractRecord(payload as WebhookPayload & InquiryRecord);
  if (!record?.email || !record.full_name) {
    return new Response(JSON.stringify({ error: "Missing record" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const purpose = record.inquiry_purpose?.trim() || "Contact";
  const subject = `BikriKhata: ${purpose} — ${record.business_name ?? record.full_name}`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [NOTIFY_TO],
      reply_to: record.email,
      subject,
      html: buildEmailHtml(record),
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Resend error:", res.status, errText);
    return new Response(JSON.stringify({ error: "Resend failed", detail: errText }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  const data = await res.json();
  return new Response(JSON.stringify({ ok: true, id: data.id }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
