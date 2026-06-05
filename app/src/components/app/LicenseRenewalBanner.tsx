import { platformSupportContacts, telUrl, whatsappUrl } from "@/config/supportContacts";
import { useAuth } from "@/lib/auth";
import {
  formatPaidSubscriptionDaysLabel,
  formatTrialEndsLabel,
  licenseRenewalUrgent,
  licenseRenewalWhatsappPrefill,
  shouldWarnLicenseRenewal,
  tenantLicenseDaysRemaining,
} from "@/lib/tenantLicense";

/** Trial: always show days left. Paid: banner when ≤30 days remain. */
export function LicenseRenewalBanner() {
  const { tenantPlan, trialEndsAt, subscriptionEndsAt, licenseValid } = useAuth();
  if (!licenseValid) return null;

  const profile = { plan: tenantPlan, trialEndsAt, subscriptionEndsAt };
  const days = tenantLicenseDaysRemaining(profile);

  let label: string | null = null;
  if (tenantPlan === "trial") {
    label = formatTrialEndsLabel(trialEndsAt);
  } else if (shouldWarnLicenseRenewal(days)) {
    label = formatPaidSubscriptionDaysLabel(tenantPlan, days);
  }
  if (!label) return null;

  const urgent = licenseRenewalUrgent(days);
  const support = platformSupportContacts();
  const tel = telUrl(support.phone);
  const wa = whatsappUrl(support.whatsappDigits, licenseRenewalWhatsappPrefill(tenantPlan));

  const suffix =
    tenantPlan === "trial"
      ? "— contact BikriKhata before it ends to keep your shop active."
      : "— renew your subscription to keep using the app.";

  return (
    <div
      className={`border-b px-4 py-2 text-center text-xs sm:text-sm ${
        urgent
          ? "border-amber-300 bg-amber-100 font-medium text-amber-950"
          : "border-amber-200/80 bg-amber-50 text-amber-950"
      }`}
    >
      <p>
        {label} {suffix}
      </p>
      {urgent && (tel || wa) ? (
        <p className="mt-1.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          {tel ? (
            <a href={tel} className="font-semibold text-teal-800 underline underline-offset-2">
              Call {support.phone}
            </a>
          ) : null}
          {wa ? (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-teal-800 underline underline-offset-2"
            >
              WhatsApp
            </a>
          ) : null}
          <a href="/?#contact" className="font-semibold text-teal-800 underline underline-offset-2">
            Contact to renew
          </a>
        </p>
      ) : null}
    </div>
  );
}
