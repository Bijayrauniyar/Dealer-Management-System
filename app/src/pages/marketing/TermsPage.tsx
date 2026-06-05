import { TERMS_SECTIONS } from "@/pages/marketing/legalContent";
import { LegalDocumentPage } from "@/pages/marketing/LegalDocumentPage";

export function TermsPage() {
  return (
    <LegalDocumentPage
      title="Terms of use"
      updated="May 2026"
      sections={TERMS_SECTIONS}
    />
  );
}
