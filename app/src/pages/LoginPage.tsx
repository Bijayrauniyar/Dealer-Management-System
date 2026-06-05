import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PUBLIC_SIGNUP_ENABLED } from "@/config/publicSignup";
import { TrialContactLink } from "@/pages/marketing/TrialContactLink";
import { routeForTenantProfile } from "@/lib/tenantRouting";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/app/FormField";
import { AuthBrandHeader } from "@/components/app/AuthBrandHeader";
import { MARKETING_HOME_PATH } from "@/lib/marketingRoutes";

export const LoginPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, refreshProfile, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Enter email and password.");
      return;
    }
    setLoading(true);
    try {
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signErr) {
        setError(signErr.message);
        return;
      }
      const profile = await refreshProfile();
      const to = routeForTenantProfile(profile) ?? "/app/home";
      navigate(to, { replace: true });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface-page px-4">
        <div className="w-full max-w-sm">
          <div className="rounded-2xl bg-white border border-border-subtle shadow-card p-8 text-center text-sm text-muted">
            Loading…
          </div>
        </div>
      </div>
    );
  }

  if (user) {
    const continueTo = () => {
      void refreshProfile().then((profile) => {
        const to = routeForTenantProfile(profile) ?? "/app/home";
        navigate(to, { replace: true });
      });
    };

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface-page px-4">
        <div className="w-full max-w-sm">
          <AuthBrandHeader />
          <div className="rounded-2xl border border-border-subtle bg-white p-6 shadow-card space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Already logged in</h2>
              <p className="mt-1 text-sm text-muted">
                You are logged in as <span className="font-medium text-foreground">{user.email}</span>.
                Log out to use a different account.
              </p>
            </div>
            <Button type="button" size="full" variant="primary" onClick={continueTo}>
              Continue to workspace
            </Button>
            <Button
              type="button"
              size="full"
              variant="outline"
              onClick={() => void signOut().then(() => navigate("/login", { replace: true }))}
            >
              Log out
            </Button>
          </div>
          <p className="mt-6 text-center text-xs text-muted">
            <Link to={MARKETING_HOME_PATH} className="hover:text-teal-600 hover:underline">
              Website
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-page px-4">
      <div className="w-full max-w-sm">
        <AuthBrandHeader />

        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="rounded-2xl bg-white border border-border-subtle shadow-card p-6 space-y-4"
        >
          <div>
            <h2 className="text-xl font-semibold text-foreground">Log in</h2>
            <p className="mt-1 text-sm text-muted">Log in with your email and password.</p>
          </div>

          <FormField label="Email" required>
            <Input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </FormField>

          <FormField label="Password" required>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </FormField>

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button type="submit" size="full" loading={loading}>
            Log in
          </Button>

          <p className="text-center text-sm text-muted">
            Don&apos;t have an account?{" "}
            {PUBLIC_SIGNUP_ENABLED ? (
              <Link to="/register" className="text-teal-600 font-medium hover:underline">
                Create account
              </Link>
            ) : (
              <TrialContactLink className="text-teal-600 font-medium hover:underline">
                Request access
              </TrialContactLink>
            )}
          </p>
        </form>

        <p className="mt-6 text-center text-xs text-muted">
          <Link to={MARKETING_HOME_PATH} className="hover:text-teal-600 hover:underline">
            Website
          </Link>
        </p>
      </div>
    </div>
  );
};
