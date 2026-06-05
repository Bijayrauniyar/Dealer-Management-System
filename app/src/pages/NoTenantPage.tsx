import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { signupTenantForCurrentUser } from "@/lib/signupTenant";
import { routeForTenantProfile } from "@/lib/tenantRouting";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/app/FormField";

const ALREADY_LINKED = /already belongs to a tenant/i;

/** Logged-in user with no `tenant_users` row visible to the app. */
export const NoTenantPage = () => {
  const navigate = useNavigate();
  const { signOut, user, loading, refreshProfile } = useAuth();
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  const goForProfile = (profile: Awaited<ReturnType<typeof refreshProfile>>) => {
    const to = routeForTenantProfile(profile);
    if (to) navigate(to, { replace: true });
  };

  useEffect(() => {
    if (loading || !user) return;
    void refreshProfile().then((profile) => {
      if (profile.tenantId) goForProfile(profile);
    });
  }, [loading, user, refreshProfile, navigate]);

  const handleSignOut = () => {
    void signOut().then(() => navigate("/login", { replace: true }));
  };

  const handleContinue = () => {
    setChecking(true);
    void refreshProfile()
      .then((profile) => {
        if (!profile.tenantId) {
          toast.message("No workspace linked yet. Create one below or contact support.");
          return;
        }
        toast.success("Workspace found.");
        goForProfile(profile);
      })
      .finally(() => setChecking(false));
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!businessName.trim() || !ownerName.trim()) {
      setError("Business name and owner name are required.");
      return;
    }
    setSubmitting(true);
    try {
      const { error: rpcErr } = await signupTenantForCurrentUser({
        businessName,
        ownerName,
        phone,
        city,
      });
      if (rpcErr) {
        if (ALREADY_LINKED.test(rpcErr)) {
          const profile = await refreshProfile();
          if (profile.tenantId) {
            toast.success("You already have a workspace — continuing.");
            goForProfile(profile);
            return;
          }
          setError(
            "Database says you already have a tenant, but the app cannot read it. Click “Continue to app” or run the SQL check below.",
          );
        } else {
          setError(rpcErr);
          toast.error(rpcErr);
        }
        return;
      }
      const profile = await refreshProfile();
      toast.success("Workspace linked.");
      goForProfile(profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create workspace");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted">
        Loading…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-page px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-border-subtle bg-white p-8 shadow-card space-y-4">
        <div className="text-center space-y-2">
          <h1 className="text-lg font-bold text-foreground">Link your workspace</h1>
          <p className="text-sm text-muted">
            Logged in as <strong>{user.email}</strong>. If you see &quot;User already belongs to a tenant&quot;, your
            workspace already exists — use <strong>Continue to app</strong> below.
          </p>
        </div>

        <Button variant="primary" size="full" loading={checking} onClick={handleContinue}>
          Continue to app
        </Button>

        <form onSubmit={(e) => void handleCreateWorkspace(e)} className="space-y-4 border-t border-border-subtle pt-4">
          <p className="text-xs text-muted">Only if you have no tenant yet:</p>
          <FormField label="Business name" required>
            <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Trading name" />
          </FormField>
          <FormField label="Owner name" required>
            <Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Full name" />
          </FormField>
          <FormField label="Phone">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </FormField>
          <FormField label="City / area">
            <Input value={city} onChange={(e) => setCity(e.target.value)} />
          </FormField>

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button type="submit" size="full" loading={submitting} variant="secondary">
            Create workspace
          </Button>
        </form>

        <Button variant="secondary" size="full" onClick={handleSignOut}>
          Log out
        </Button>
      </div>
    </div>
  );
};
