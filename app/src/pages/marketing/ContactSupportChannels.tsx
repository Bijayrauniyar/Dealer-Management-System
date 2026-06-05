import { Mail, MessageCircle, Phone } from "lucide-react";
import {
  mailtoUrl,
  platformSupportContacts,
  PLATFORM_SUPPORT,
  telUrl,
  whatsappUrl,
} from "@/config/supportContacts";
import { marketingCard } from "@/pages/marketing/marketingUi";

export function ContactSupportChannels() {
  const support = platformSupportContacts();
  const tel = telUrl(support.phone);
  const mail = mailtoUrl(support.email);
  const wa = whatsappUrl(
    support.whatsappDigits,
    `Hi, I would like to know more about ${PLATFORM_SUPPORT.productName}.`,
  );

  const items = [
    tel
      ? {
          key: "phone",
          href: tel,
          icon: Phone,
          label: "Phone",
          value: support.phone,
          external: false,
        }
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
      ? {
          key: "email",
          href: mail,
          icon: Mail,
          label: "Email",
          value: support.email,
          external: false,
        }
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
    <div className={`${marketingCard} flex h-full flex-col border-teal-100/80 bg-gradient-to-b from-teal-50/50 to-white p-6 sm:p-8`}>
      <p className="text-sm font-semibold text-slate-900 sm:text-base">Reach us directly</p>
      <p className="mt-1 text-sm leading-relaxed text-slate-600">
        Call, WhatsApp, or email — we respond during business hours.
      </p>
      <ul className="mt-6 flex flex-1 flex-col gap-3 sm:mt-8">
        {items.map(({ key, href, icon: Icon, label, value, external }) => (
          <li key={key} className="flex-1 sm:flex-initial">
            <a
              href={href}
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="flex h-full min-h-[4.5rem] items-center gap-4 rounded-xl border border-slate-100 bg-white px-4 py-3.5 shadow-sm transition-all hover:border-teal-200 hover:shadow-md sm:min-h-0"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
                <Icon size={20} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {label}
                </span>
                <span className="mt-0.5 block break-all text-sm font-semibold text-slate-900 sm:text-[15px]">
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
