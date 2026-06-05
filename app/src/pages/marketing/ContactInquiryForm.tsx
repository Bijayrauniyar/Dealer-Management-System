import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/app/FormField";
import { submitPlatformInquiry } from "@/lib/submitPlatformInquiry";
import { LAUNCH_TRIAL_CTA_HEADLINE } from "@/config/launchPricing";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  INQUIRY_PURPOSES,
  type InquiryPurpose,
} from "@/pages/marketing/landingContent";
import { marketingCard } from "@/pages/marketing/marketingUi";

const BUSINESS_TYPES = [
  "Distributor",
  "Wholesaler / stockist",
  "Dealer",
  "FMCG",
  "Other",
] as const;

const inputClass =
  "flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20";

function defaultPurpose(search: URLSearchParams): InquiryPurpose {
  const intent = search.get("intent")?.toLowerCase();
  if (intent === "trial" || intent === "signup") return LAUNCH_TRIAL_CTA_HEADLINE;
  if (intent === "renew") return "Subscription renewal";
  if (intent === "demo") return "Book a demo";
  return "General message";
}

export function ContactInquiryForm() {
  const [searchParams] = useSearchParams();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState<string>(BUSINESS_TYPES[0]);
  const [inquiryPurpose, setInquiryPurpose] = useState<InquiryPurpose>(() =>
    defaultPurpose(searchParams),
  );
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    setInquiryPurpose(defaultPurpose(searchParams));
  }, [searchParams]);

  const isDemo = inquiryPurpose === "Book a demo";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      toast.error("Unable to send right now. Please call or WhatsApp us instead.");
      return;
    }
    if (!fullName.trim() || !email.trim() || !phone.trim() || !businessName.trim()) {
      toast.error("Please complete all required fields.");
      return;
    }

    setLoading(true);
    try {
      await submitPlatformInquiry({
        fullName,
        email,
        phone,
        businessName,
        businessType,
        message,
        inquiryPurpose,
        source:
          inquiryPurpose === LAUNCH_TRIAL_CTA_HEADLINE || inquiryPurpose === "Request access"
            ? "signup"
            : isDemo
              ? "demo"
              : "landing",
      });
      setSent(true);
      toast.success("Thank you. We will be in touch soon.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to send. Please try again or call us.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className={`${marketingCard} flex h-full min-h-[280px] flex-col items-center justify-center p-8 text-center sm:p-10`}>
        <p className="text-xl font-semibold text-slate-900">Thank you</p>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-600">
          We received your request. Our team will call or email you, then set up your company
          account and send login details.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className={`${marketingCard} flex h-full min-w-0 flex-col space-y-4 p-5 sm:p-8`}
      id="contact-form"
    >
      <div>
        <p className="text-sm font-semibold text-slate-900 sm:text-base">
          {isDemo ? "Book a demo" : "Send a message"}
        </p>
        <p className="mt-1 text-sm text-slate-600">
          {isDemo
            ? "Tell us your business type and preferred time — we will call you back."
            : "We usually reply within one business day."}
        </p>
      </div>
      <FormField label="Purpose" required>
        <select
          value={inquiryPurpose}
          onChange={(e) => setInquiryPurpose(e.target.value as InquiryPurpose)}
          className={inputClass}
        >
          {INQUIRY_PURPOSES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Your name" required>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" className={inputClass} />
        </FormField>
        <FormField label="Phone" required>
          <Input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            placeholder="+977 …"
            className={inputClass}
          />
        </FormField>
      </div>
      <FormField label="Email" required>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          className={inputClass}
        />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Business name" required>
          <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} className={inputClass} />
        </FormField>
        <FormField label="Business type" required>
          <select
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            className={inputClass}
          >
            {BUSINESS_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </FormField>
      </div>
      <FormField label="Message">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className={`${inputClass} min-h-[88px] resize-y py-2.5`}
          placeholder={
            isDemo
              ? "e.g. 20 dealers on credit, want demo this week"
              : "Brief note about your business or questions"
          }
        />
      </FormField>
      <Button type="submit" size="full" loading={loading} className="!min-h-11 !rounded-xl">
        {isDemo ? "Request demo" : "Send message"}
      </Button>
    </form>
  );
}
