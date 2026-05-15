import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { signupTenantForCurrentUser } from "@/lib/signupTenant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/app/FormField";

function RegisterPageInner() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password || !businessName || !ownerName) {
      setError("Email, password, business name, and owner name are required.");
      return;
    }
    setLoading(true);
    try {
      const {
        data: { session: existingSession },
      } = await supabase.auth.getSession();

      if (!existingSession) {
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (signUpErr) {
          if (signUpErr.message.toLowerCase().includes("already registered")) {
            setError("This email already has an account. Sign in, then complete workspace setup on the next screen.");
          } else {
            setError(signUpErr.message);
          }
          setLoading(false);
          return;
        }
        if (!signUpData.session) {
          setError(
            "No session after sign-up. In Supabase Dashboard → Authentication → Providers → Email, disable “Confirm email” for development, or confirm your email and sign in.",
          );
          setLoading(false);
          return;
        }
      }

      const { error: rpcErr } = await signupTenantForCurrentUser({
        businessName,
        ownerName,
        phone,
        city,
      });

      if (rpcErr) {
        setError(rpcErr);
        toast.error(rpcErr);
        setLoading(false);
        return;
      }

      toast.success("Workspace created. Awaiting approval if your project requires it.");
      navigate("/app/home", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-page px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-2xl font-bold text-teal-600">DealerOS</span>
          <p className="mt-1 text-sm text-muted">Create dealer workspace</p>
        </div>

        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="rounded-2xl bg-white border border-border-subtle shadow-card p-6 space-y-4"
        >
          <FormField label="Email" required>
            <Input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </FormField>
          <FormField label="Password" required>
            <Input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FormField>
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

          <Button type="submit" size="full" loading={loading}>
            Create account
          </Button>

          <p className="text-center text-sm text-muted">
            Already have an account?{" "}
            <Link to="/login" className="text-teal-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export const RegisterPage = () =>
  isSupabaseConfigured ? <RegisterPageInner /> : <Navigate to="/login" replace />;
