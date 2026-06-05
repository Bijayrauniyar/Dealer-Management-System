import { Link } from "react-router-dom";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { platformSupportContacts, telUrl, whatsappUrl, mailtoUrl } from "@/config/supportContacts";
import { Button } from "@/components/ui/button";

const actionClass =
  "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold";

type Props = {
  whatsappPrefill: string;
  /** In-app route (works when signed in). Prefer over contactHref. */
  contactTo?: string;
  /** External or marketing URL; ignored when contactTo is set. */
  contactHref?: string;
  contactLabel?: string;
  onCheckAgain?: () => void;
  checkAgainLabel?: string;
  showSignOut?: () => void;
};

/** Call / WhatsApp / email / contact form — pending approval & license expired gates. */
export function PlatformSupportGateActions({
  whatsappPrefill,
  contactTo,
  contactHref = "/?#contact",
  contactLabel = "Message us",
  onCheckAgain,
  checkAgainLabel = "Check again",
  showSignOut,
}: Props) {
  const support = platformSupportContacts();
  const tel = telUrl(support.phone);
  const wa = whatsappUrl(support.whatsappDigits, whatsappPrefill);
  const mail = mailtoUrl(support.email);

  return (
    <div className="flex w-full flex-col gap-2 pt-2">
      {tel ? (
        <a href={tel} className={`${actionClass} bg-teal-600 text-white`}>
          <Phone size={18} aria-hidden />
          Call {support.phone}
        </a>
      ) : null}
      {wa ? (
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          className={`${actionClass} border border-teal-200 bg-teal-50 text-teal-900`}
        >
          <MessageCircle size={18} aria-hidden />
          WhatsApp {support.whatsapp}
        </a>
      ) : null}
      {mail ? (
        <a href={mail} className={`${actionClass} border border-slate-200 bg-white text-slate-800`}>
          <Mail size={18} aria-hidden />
          Email {support.email}
        </a>
      ) : null}
      {contactTo ? (
        <Link
          to={contactTo}
          className={`${actionClass} border border-slate-200 bg-white text-slate-800 hover:bg-slate-50`}
        >
          {contactLabel}
        </Link>
      ) : (
        <a href={contactHref} className={`${actionClass} border border-slate-200 bg-white text-slate-800`}>
          {contactLabel}
        </a>
      )}
      {onCheckAgain ? (
        <Button variant="primary" size="full" onClick={onCheckAgain}>
          {checkAgainLabel}
        </Button>
      ) : null}
      {showSignOut ? (
        <Button variant="secondary" size="full" onClick={showSignOut}>
          Log out
        </Button>
      ) : null}
    </div>
  );
}
