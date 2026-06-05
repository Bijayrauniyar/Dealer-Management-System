import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { isTenantLicenseValid, licenseExpiredCopy } from "@/lib/tenantLicense";
import { launchAnnualPlanHint } from "@/config/launchPricing";
import { MARKETING_HOME_PATH } from "@/lib/marketingRoutes";
import { MarketingSessionControl } from "@/pages/marketing/MarketingSessionControl";
import {
  BRAND_LOGO_LOCKUP_SRC,
  PRODUCT_DISPLAY_NAME,
} from "@/config/productBrand";
import {
  platformSupportContacts,
  telUrl,
  whatsappUrl,
  mailtoUrl,
} from "@/config/supportContacts";

const btnOutline =
  "inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-border-subtle bg-white px-3 text-sm font-semibold text-foreground hover:bg-slate-50";

/** Workspace inactive — renew via BikriKhata support (same shell as sign-in). */
export function LicenseExpiredPage() {
  const navigate = useNavigate();
  const {
    signOut,
    user,
    loading,
    refreshProfile,
    tenantStatus,
    tenantPlan,
    trialEndsAt,
    subscriptionEndsAt,
    licenseValid,
  } = useAuth();

  const { statusLabel, detail } = licenseExpiredCopy(tenantPlan, trialEndsAt, subscriptionEndsAt);
  const support = platformSupportContacts();
  const tel = telUrl(support.phone);
  const wa = whatsappUrl(
    support.whatsappDigits,
    `Hello, I would like to renew my ${PRODUCT_DISPLAY_NAME} ${tenantPlan === "trial" ? "trial" : "subscription"}.`,
  );
  const mail = mailtoUrl(support.email);

  const handleCheckAgain = () => {
    void refreshProfile().then((profile) => {
      if (isTenantLicenseValid(profile)) {
        toast.success("Access restored.");
        navigate("/app/home", { replace: true });
        return;
      }
      toast.message("Access is not active yet. Contact us after payment, then try again.");
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-surface-page px-4 text-sm text-muted">
        Loading…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (tenantStatus && tenantStatus !== "active") {
    return <Navigate to="/pending-approval" replace />;
  }
  if (licenseValid) {
    return <Navigate to="/app/home" replace />;
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-surface-page px-4 py-5">
      <div className="flex w-full max-w-sm flex-col">
        <div className="mb-4 flex justify-center">
          <img
            src={BRAND_LOGO_LOCKUP_SRC}
            alt={PRODUCT_DISPLAY_NAME}
            width={200}
            height={80}
            decoding="async"
            className="h-16 w-auto object-contain sm:h-[4.5rem]"
          />
        </div>

        <div className="rounded-2xl border border-border-subtle bg-white p-5 shadow-card sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800/90">
            {statusLabel}
          </p>
          <h1 className="mt-1.5 text-xl font-semibold text-foreground">Renew your plan</h1>
          <p className="mt-2 text-sm leading-snug text-muted">
            {detail} Contact BikriKhata to pay and reactivate this workspace.
          </p>
          <p className="mt-1.5 text-xs text-muted">{launchAnnualPlanHint()}</p>

          <div className="mt-4 space-y-2.5">
            {wa ? (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white hover:bg-teal-700"
              >
                <MessageCircle size={18} aria-hidden />
                WhatsApp {support.whatsapp}
              </a>
            ) : null}

            <div className="flex gap-2">
              {tel ? (
                <a href={tel} className={btnOutline}>
                  <Phone size={16} aria-hidden />
                  Call
                </a>
              ) : null}
              {mail ? (
                <a href={mail} className={btnOutline}>
                  <Mail size={16} aria-hidden />
                  Email
                </a>
              ) : null}
              <Link to="/contact?intent=renew" className={btnOutline}>
                Message us
              </Link>
            </div>

            <Button variant="primary" size="full" onClick={handleCheckAgain}>
              Continue after payment
            </Button>

            <button
              type="button"
              onClick={() => void signOut().then(() => navigate("/login", { replace: true }))}
              className="w-full py-1 text-center text-sm font-medium text-muted hover:text-foreground"
            >
              Log out
            </button>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-muted">
          <Link to={MARKETING_HOME_PATH} className="font-medium text-teal-600 hover:underline">
            Website
          </Link>
          <span className="mx-1.5" aria-hidden>
            ·
          </span>
          <MarketingSessionControl variant="inline" />
        </p>
      </div>
    </div>
  );
}
