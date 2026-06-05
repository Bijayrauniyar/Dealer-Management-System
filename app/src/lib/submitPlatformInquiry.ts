import { supabase } from "@/lib/supabase";

export type PlatformInquiryInput = {
  fullName: string;
  email: string;
  phone: string;
  businessName: string;
  businessType: string;
  message?: string;
  inquiryPurpose?: string;
  source?: string;
};

function friendlySubmitError(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes("could not find the table") ||
    lower.includes("could not find the function") ||
    lower.includes("platform_inquiries") ||
    lower.includes("schema cache") ||
    lower.includes("pgrst") ||
    lower.includes("inquiry_purpose")
  ) {
    if (import.meta.env.DEV) {
      console.error("[contact form] Supabase:", message);
    }
    return "Unable to send right now. Please call or WhatsApp us — we are fixing this on our side.";
  }
  if (lower.includes("required") || lower.includes("valid email")) {
    return message;
  }
  return "Unable to send your message. Please try again or contact us by phone.";
}

export async function submitPlatformInquiry(
  input: PlatformInquiryInput,
): Promise<{ inquiryId: string }> {
  const payload = {
    full_name: input.fullName.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    business_name: input.businessName.trim(),
    business_type: input.businessType.trim(),
    message: input.message?.trim() || null,
    inquiry_purpose: input.inquiryPurpose?.trim() || null,
    source: input.source?.trim() || "landing",
  };

  const { data: rpcId, error: rpcError } = await supabase.rpc("submit_platform_inquiry", {
    p_payload: payload,
  });

  if (!rpcError && rpcId) {
    return { inquiryId: String(rpcId) };
  }

  const { data, error } = await supabase
    .from("platform_inquiries")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    throw new Error(friendlySubmitError(error.message));
  }

  if (!data?.id) {
    throw new Error("Unable to send your message. Please try again.");
  }

  return { inquiryId: data.id };
}
