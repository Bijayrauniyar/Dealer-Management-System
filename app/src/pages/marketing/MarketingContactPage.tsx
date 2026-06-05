import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { MARKETING_HOME_PATH } from "@/lib/marketingRoutes";
import { ContactInquiryForm } from "@/pages/marketing/ContactInquiryForm";
import { ContactSupportChannels } from "@/pages/marketing/ContactSupportChannels";
import { MarketingShell } from "@/pages/marketing/MarketingShell";
import { LandingSection } from "@/pages/marketing/LandingSection";
import { marketingContainer, marketingSectionYAnchor } from "@/pages/marketing/marketingUi";

/** Contact form for signed-in users (license / pending) — not redirected away from `/`. */
export function MarketingContactPage() {
  const { tenantStatus, licenseValid } = useAuth();
  const backTo =
    tenantStatus && tenantStatus !== "active"
      ? "/pending-approval"
      : !licenseValid
        ? "/license-expired"
        : MARKETING_HOME_PATH;

  return (
    <MarketingShell>
      <section className={`border-b border-slate-200/80 bg-slate-50/40 ${marketingSectionYAnchor}`}>
        <div className={marketingContainer}>
          <Link
            to={backTo}
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:underline sm:mb-6"
          >
            <ArrowLeft size={16} aria-hidden />
            Back
          </Link>
          <LandingSection
            id="contact"
            centered
            eyebrow="Contact"
            title="Get in touch"
            subtitle="Call, WhatsApp, email, or send a message below. We usually reply within one business day."
            className="!p-0"
          >
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-10 lg:items-stretch">
              <ContactSupportChannels />
              <ContactInquiryForm />
            </div>
          </LandingSection>
        </div>
      </section>
    </MarketingShell>
  );
}
