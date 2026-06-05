import { PRODUCT_DISPLAY_NAME } from "@/config/productBrand";

/**
 * Software-owner support — for the shop using BikriKhata (tenant owner), not their retail customers.
 * Set real phone/WhatsApp here before GTM. Shop→customer contact is Settings → Business (phone, email on bills).
 */
export const PLATFORM_SUPPORT = {
  productName: PRODUCT_DISPLAY_NAME,
  phone: "+977 9845982192",
  email: "support.bikrikhata@gmail.com",
  whatsapp: "+977 9845982192",
} as const;

export type PlatformSupport = {
  phone: string;
  email: string;
  whatsapp: string;
  whatsappDigits: string;
};

function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

/** Contact details for BikriKhata (platform) support only. */
export function platformSupportContacts(): PlatformSupport {
  const phone = PLATFORM_SUPPORT.phone.trim();
  const email = PLATFORM_SUPPORT.email.trim();
  const whatsapp = PLATFORM_SUPPORT.whatsapp.trim() || phone;
  return {
    phone,
    email,
    whatsapp,
    whatsappDigits: digitsOnly(whatsapp),
  };
}

export function whatsappUrl(digits: string, text?: string): string | null {
  if (!digits) return null;
  const base = `https://wa.me/${digits}`;
  if (!text?.trim()) return base;
  return `${base}?text=${encodeURIComponent(text)}`;
}

export function telUrl(phone: string): string | null {
  const d = digitsOnly(phone);
  return d ? `tel:+${d}` : null;
}

export function mailtoUrl(email: string): string | null {
  const e = email.trim();
  return e ? `mailto:${e}` : null;
}

/** Pre-filled WhatsApp text after contact form submit (user still opens WhatsApp and taps Send). */
export function inquiryWhatsappPrefill(input: {
  fullName: string;
  phone: string;
  email: string;
  businessName: string;
  businessType: string;
  inquiryPurpose?: string;
  message?: string;
}): string {
  const lines = [
    `Hi ${PLATFORM_SUPPORT.productName},`,
    "",
    `Purpose: ${input.inquiryPurpose?.trim() || "General message"}`,
    `Name: ${input.fullName.trim()}`,
    `Phone: ${input.phone.trim()}`,
    `Email: ${input.email.trim()}`,
    `Business: ${input.businessName.trim()} (${input.businessType.trim()})`,
  ];
  const note = input.message?.trim();
  if (note) lines.push(`Message: ${note}`);
  return lines.join("\n");
}
