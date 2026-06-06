import { PageShell } from "@/components/app/PageShell";
import { AppSupportInquiryForm } from "@/components/app/AppSupportInquiryForm";
import { PlatformSupportChannels } from "@/components/app/PlatformSupportChannels";
import { FormPageHeader } from "@/components/app/patterns";
import { PLATFORM_SUPPORT } from "@/config/supportContacts";

export const SupportPage = () => {
  return (
    <PageShell>
      <FormPageHeader
        title="Help & support"
        subtitle={`Contact ${PLATFORM_SUPPORT.productName} — same team and inbox as bikrikhata.com.`}
      />

      <PlatformSupportChannels className="mb-4" />

      <AppSupportInquiryForm />

      <p className="mt-4 text-xs text-muted">
        After you submit, you can open WhatsApp with your message pre-filled for a faster reply.
      </p>
      <div className="h-6" />
    </PageShell>
  );
};
