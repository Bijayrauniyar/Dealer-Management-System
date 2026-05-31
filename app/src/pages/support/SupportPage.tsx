import { ExternalLink, Mail, MessageCircle, Phone } from "lucide-react";
import { PageShell } from "@/components/app/PageShell";
import { FormPageHeader, LinkActionRow } from "@/components/app/patterns";
import {
  mailtoUrl,
  platformSupportContacts,
  PLATFORM_SUPPORT,
  telUrl,
  whatsappUrl,
} from "@/config/supportContacts";

export const SupportPage = () => {
  const support = platformSupportContacts();
  const tel = telUrl(support.phone);
  const mail = mailtoUrl(support.email);
  const wa = whatsappUrl(
    support.whatsappDigits,
    `Hi, I need help with ${PLATFORM_SUPPORT.productName}.`,
  );

  return (
    <PageShell>
      <FormPageHeader
        title="Help & support"
        subtitle={`Contact ${PLATFORM_SUPPORT.productName} for app help.`}
      />

      <div className="space-y-2 rounded-xl border border-border-subtle bg-white p-4 shadow-card">
        {tel ? (
          <LinkActionRow href={tel} icon={Phone} label={`Phone · ${support.phone}`} />
        ) : null}
        {mail ? (
          <LinkActionRow href={mail} icon={Mail} label={support.email} />
        ) : null}
        {wa ? (
          <LinkActionRow
            href={wa}
            icon={MessageCircle}
            highlight
            external
            label={
              <>
                WhatsApp
                <ExternalLink size={14} className="ml-auto text-teal-600" aria-hidden />
              </>
            }
          />
        ) : null}
      </div>

      <p className="mt-4 text-xs text-muted">Have your bill number ready if you ask about a sale or stock issue.</p>
      <div className="h-6" />
    </PageShell>
  );
};
