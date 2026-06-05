import { CalendarClock, MessageCircle, Phone } from "lucide-react";
import { platformSupportContacts, telUrl, whatsappUrl } from "@/config/supportContacts";
import { useAuth } from "@/lib/auth";
import {
  formatLicenseEndDate,
  formatTenantPlanLabel,
  formatTrialEndsLabel,
  formatPaidSubscriptionDaysLabel,
  licenseRenewalWhatsappPrefill,
  shouldWarnLicenseRenewal,
  tenantLicenseDaysRemaining,
  tenantLicenseEndAt,
} from "@/lib/tenantLicense";

/** Read-only plan and days remaining (Settings → Account). */
export function SubscriptionSection() {
  const { tenantPlan, trialEndsAt, subscriptionEndsAt, licenseValid, tenantStatus } = useAuth();
  if (tenantStatus !== "active" || !licenseValid) return null;

  const profile = { plan: tenantPlan, trialEndsAt, subscriptionEndsAt };
  const days = tenantLicenseDaysRemaining(profile);
  const endIso = tenantLicenseEndAt(profile);
  const endLabel = formatLicenseEndDate(endIso);
  const planLabel = formatTenantPlanLabel(tenantPlan);
  const daysLabel =
    tenantPlan === "trial"
      ? formatTrialEndsLabel(trialEndsAt)
      : formatPaidSubscriptionDaysLabel(tenantPlan, days);
  const warn = shouldWarnLicenseRenewal(days);
  const support = platformSupportContacts();
  const tel = telUrl(support.phone);
  const wa = whatsappUrl(support.whatsappDigits, licenseRenewalWhatsappPrefill(tenantPlan));

  return (
    <section className="mb-6 rounded-xl border border-border-subtle bg-slate-50/80 p-4">
      <div className="mb-3 flex items-center gap-2">
        <CalendarClock size={16} className="text-teal-600" aria-hidden />
        <h2 className="text-xs font-bold uppercase tracking-wider text-teal-600">Subscription</h2>
      </div>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Plan</dt>
          <dd className="font-semibold text-foreground text-right">{planLabel}</dd>
        </div>
        {endLabel ? (
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Valid until</dt>
            <dd className="font-medium text-foreground text-right">{endLabel}</dd>
          </div>
        ) : null}
        {daysLabel ? (
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Time remaining</dt>
            <dd
              className={`font-semibold text-right ${warn ? "text-amber-800" : "text-teal-800"}`}
            >
              {daysLabel}
            </dd>
          </div>
        ) : null}
      </dl>
      {warn ? (
        <p className="mt-3 text-xs leading-snug text-amber-950">
          Contact BikriKhata to renew before your access ends.
        </p>
      ) : null}
      {warn && (tel || wa) ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {tel ? (
            <a
              href={tel}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-teal-200 bg-white px-3 py-2 text-xs font-semibold text-teal-800"
            >
              <Phone size={14} aria-hidden />
              Call
            </a>
          ) : null}
          {wa ? (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-teal-200 bg-white px-3 py-2 text-xs font-semibold text-teal-800"
            >
              <MessageCircle size={14} aria-hidden />
              WhatsApp
            </a>
          ) : null}
          <a
            href="/?#contact"
            className="inline-flex min-h-9 items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800"
          >
            Message us
          </a>
        </div>
      ) : null}
    </section>
  );
}
