import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BottomSheet } from "@/components/app/BottomSheet";
import { PlatformSupportGateActions } from "@/components/app/PlatformSupportGateActions";
import { useAuth } from "@/lib/auth";
import {
  formatLicenseEndDate,
  formatTenantPlanLabel,
  licenseRenewalWhatsappPrefill,
  shouldWarnLicenseRenewal,
  tenantLicenseDaysRemaining,
  tenantLicenseEndAt,
} from "@/lib/tenantLicense";
import { licenseReminderShownToday, markLicenseReminderShown } from "@/lib/licenseReminderStorage";

/** Once per calendar day when ≤30 days remain on trial or paid plan. */
export function LicenseRenewalDailyReminder() {
  const { tenantId, tenantPlan, trialEndsAt, subscriptionEndsAt, licenseValid, tenantStatus } =
    useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!tenantId || tenantStatus !== "active" || !licenseValid) return;

    const profile = { plan: tenantPlan, trialEndsAt, subscriptionEndsAt };
    const days = tenantLicenseDaysRemaining(profile);
    if (!shouldWarnLicenseRenewal(days)) return;
    if (licenseReminderShownToday(tenantId)) return;

    markLicenseReminderShown(tenantId);
    setOpen(true);
  }, [tenantId, tenantStatus, licenseValid, tenantPlan, trialEndsAt, subscriptionEndsAt]);

  if (!open) return null;

  const profile = { plan: tenantPlan, trialEndsAt, subscriptionEndsAt };
  const days = tenantLicenseDaysRemaining(profile);
  const endLabel = formatLicenseEndDate(tenantLicenseEndAt(profile));
  const planLabel = formatTenantPlanLabel(tenantPlan);

  return (
    <BottomSheet open={open} title="Renewal reminder" onClose={() => setOpen(false)}>
      <p className="text-sm text-muted leading-relaxed">
        Your <strong className="text-foreground">{planLabel}</strong> has{" "}
        <strong className="text-foreground">{days}</strong> day{days === 1 ? "" : "s"} left
        {endLabel ? <> (ends {endLabel})</> : null}. Contact BikriKhata to renew.
      </p>
      <PlatformSupportGateActions
        whatsappPrefill={licenseRenewalWhatsappPrefill(tenantPlan)}
        contactHref="/?#contact"
        contactLabel="Contact to renew"
      />
      <Link
        to="/app/settings"
        onClick={() => setOpen(false)}
        className="mt-3 block text-center text-sm font-medium text-teal-700 hover:underline"
      >
        View subscription in Settings
      </Link>
    </BottomSheet>
  );
}
