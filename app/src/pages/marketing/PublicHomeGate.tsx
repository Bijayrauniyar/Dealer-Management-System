import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { LandingPage } from "@/pages/marketing/LandingPage";

/**
 * Public home: marketing for everyone. Auto-enter `/app/home` only when the workspace
 * is active and the license is valid. Expired / pending logins can still browse the site.
 * `?landing=1` keeps marketing even when the license is valid.
 */
export function PublicHomeGate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading, tenantId, tenantStatus, licenseValid } = useAuth();
  const forceLanding = searchParams.get("landing") === "1";

  const shouldEnterApp =
    Boolean(user) &&
    Boolean(tenantId) &&
    tenantStatus === "active" &&
    licenseValid &&
    !forceLanding;

  useEffect(() => {
    if (loading || !shouldEnterApp) return;
    navigate("/app/home", { replace: true });
  }, [loading, shouldEnterApp, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-page text-sm text-muted">
        Loading…
      </div>
    );
  }

  if (shouldEnterApp) return null;

  return <LandingPage />;
}
