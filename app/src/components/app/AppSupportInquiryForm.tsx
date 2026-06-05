import { MessageCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/app/FormField";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { useBusinessSettings } from "@/store/domain";
import { submitPlatformInquiry } from "@/lib/submitPlatformInquiry";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  APP_SUPPORT_INTENTS,
  type SupportIntentId,
} from "@/components/app/PlatformSupportChannels";
import { inquiryWhatsappPrefill, platformSupportContacts, whatsappUrl } from "@/config/supportContacts";

export function AppSupportInquiryForm() {
  const auth = useAuth();
  const business = useBusinessSettings();
  const [purposeId, setPurposeId] = useState(APP_SUPPORT_INTENTS[0].id);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState(business.mobile || business.phone || "");
  const [email, setEmail] = useState(business.email || auth.user?.email || "");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentWhatsappPrefill, setSentWhatsappPrefill] = useState<string | null>(null);

  const purpose = APP_SUPPORT_INTENTS.find((p) => p.id === purposeId) ?? APP_SUPPORT_INTENTS[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      toast.error("Unable to send right now. Please call or WhatsApp us instead.");
      return;
    }
    if (!fullName.trim() || !phone.trim() || !message.trim()) {
      toast.error("Please enter your name, phone, and message.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        fullName: fullName.trim(),
        email: email.trim() || "noreply@bikrikhata.app",
        phone: phone.trim(),
        businessName: business.name || "App user",
        businessType: "App support",
        message: message.trim(),
        inquiryPurpose: purpose.label,
        source: "app-support",
      };
      await submitPlatformInquiry(payload);
      setSentWhatsappPrefill(
        inquiryWhatsappPrefill({
          ...payload,
          inquiryPurpose: purpose.label,
        }),
      );
      setSent(true);
      toast.success("Message saved. Our team will respond soon.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to send. Try WhatsApp or call.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    const support = platformSupportContacts();
    const prefill = sentWhatsappPrefill ?? purpose.message;
    const wa = support.whatsappDigits ? whatsappUrl(support.whatsappDigits, prefill) : null;

    return (
      <div className="rounded-xl border border-border-subtle bg-white p-5 shadow-card text-center">
        <p className="text-base font-semibold text-foreground">Thank you</p>
        <p className="mt-2 text-sm text-muted">
          Your message is saved. We usually reply within one business day.
        </p>
        {wa ? (
          <div className="mt-4">
            <p className="mb-2 text-xs text-muted">For a faster reply, send the same message on WhatsApp:</p>
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white hover:bg-teal-700"
            >
              <MessageCircle size={18} aria-hidden />
              Send on WhatsApp
            </a>
          </div>
        ) : null}
        <button
          type="button"
          className="mt-3 text-xs font-medium text-teal-600 hover:underline"
          onClick={() => {
            setSent(false);
            setMessage("");
          }}
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 rounded-xl border border-border-subtle bg-white p-4 shadow-card">
      <div>
        <p className="text-sm font-semibold text-foreground">Send a message</p>
        <p className="mt-1 text-xs text-muted">Saved to our support inbox — same as the website contact form.</p>
      </div>

      <FormField label="Message type" required>
        <Select
          value={purposeId}
          onChange={(e) => setPurposeId(e.target.value as SupportIntentId)}
        >
          {APP_SUPPORT_INTENTS.map((intent) => (
            <option key={intent.id} value={intent.id}>
              {intent.label}
            </option>
          ))}
        </Select>
        <p className="mt-1.5 text-[11px] text-muted">{purpose.detail}</p>
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Your name" required>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
        </FormField>
        <FormField label="Phone" required>
          <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
        </FormField>
      </div>

      <FormField label="Email">
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      </FormField>

      <FormField label="Message" required>
        <Textarea
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe the issue — include bill no. if relevant"
        />
      </FormField>

      <Button type="submit" size="full" loading={loading}>
        Submit message
      </Button>
    </form>
  );
}
