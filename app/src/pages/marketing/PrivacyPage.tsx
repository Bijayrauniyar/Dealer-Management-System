import { PRIVACY_SECTIONS } from "@/pages/marketing/legalContent";
import { LegalDocumentPage } from "@/pages/marketing/LegalDocumentPage";

export function PrivacyPage() {
  return (
    <LegalDocumentPage
      title="Privacy policy"
      updated="May 2026"
      sections={PRIVACY_SECTIONS}
    />
  );
}
