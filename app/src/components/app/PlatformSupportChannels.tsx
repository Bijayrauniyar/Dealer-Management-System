import { Mail, MessageCircle, Phone } from "lucide-react";
import {
  mailtoUrl,
  platformSupportContacts,
  PLATFORM_SUPPORT,
  telUrl,
  whatsappUrl,
} from "@/config/supportContacts";
import { cn } from "@/lib/utils";

export type SupportIntentId = "bill" | "account" | "general";

export type SupportIntent = {
  id: SupportIntentId;
  label: string;
  detail: string;
  message: string;
};

export const APP_SUPPORT_INTENTS: SupportIntent[] = [
  {
    id: "bill",
    label: "Bill or stock",
    detail: "Wrong total, print, or quantity after a sale or purchase",
    message: `Hi, I need help with a bill or stock issue on ${PLATFORM_SUPPORT.productName}.`,
  },
  {
    id: "account",
    label: "Login or license",
    detail: "Cannot sign in, trial ended, or workspace access",
    message: `Hi, I need help with my ${PLATFORM_SUPPORT.productName} account or license.`,
  },
  {
    id: "general",
    label: "General help",
    detail: "How to use a feature or anything else",
    message: `Hi, I need help with ${PLATFORM_SUPPORT.productName}.`,
  },
];

type Props = {
  className?: string;
  /** Override default WhatsApp prefill for the main WhatsApp row */
  whatsappMessage?: string;
};

/** Same contacts as marketing landing — phone, WhatsApp, email. */
export function PlatformSupportChannels({ className, whatsappMessage }: Props) {
  const support = platformSupportContacts();
  const tel = telUrl(support.phone);
  const mail = mailtoUrl(support.email);
  const wa = whatsappUrl(
    support.whatsappDigits,
    whatsappMessage ?? APP_SUPPORT_INTENTS[2].message,
  );

  const items = [
    tel
      ? { key: "phone", href: tel, icon: Phone, label: "Phone", value: support.phone, external: false }
      : null,
    wa
      ? {
          key: "whatsapp",
          href: wa,
          icon: MessageCircle,
          label: "WhatsApp",
          value: support.whatsapp,
          external: true,
        }
      : null,
    mail
      ? { key: "email", href: mail, icon: Mail, label: "Email", value: support.email, external: false }
      : null,
  ].filter(Boolean) as {
    key: string;
    href: string;
    icon: typeof Phone;
    label: string;
    value: string;
    external: boolean;
  }[];

  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        "rounded-xl border border-teal-100 bg-gradient-to-b from-teal-50/60 to-white p-4 shadow-card",
        className,
      )}
    >
      <p className="text-sm font-semibold text-foreground">Reach us directly</p>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        Call, WhatsApp, or email — we respond during business hours (same as bikrikhata.com).
      </p>
      <ul className="mt-4 space-y-2">
        {items.map(({ key, href, icon: Icon, label, value, external }) => (
          <li key={key}>
            <a
              href={href}
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="flex items-center gap-3 rounded-xl border border-border-subtle bg-white px-3 py-3 transition-colors hover:border-teal-200 hover:bg-teal-50/40"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
                <Icon size={18} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-bold uppercase tracking-wide text-muted">
                  {label}
                </span>
                <span className="mt-0.5 block break-all text-sm font-semibold text-foreground">
                  {value}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Quick WhatsApp shortcuts by support type (landing-style intents). */
export function SupportIntentChips({ className }: { className?: string }) {
  const support = platformSupportContacts();
  if (!support.whatsappDigits) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Message type</p>
      <div className="flex flex-wrap gap-2">
        {APP_SUPPORT_INTENTS.map((intent) => {
          const wa = whatsappUrl(support.whatsappDigits, intent.message);
          if (!wa) return null;
          return (
            <a
              key={intent.id}
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-border-subtle bg-white px-3 py-2 text-left shadow-sm transition-colors hover:border-teal-300 hover:bg-teal-50/50"
            >
              <span className="block text-xs font-semibold text-foreground">{intent.label}</span>
              <span className="mt-0.5 block text-[10px] text-muted leading-snug">{intent.detail}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
