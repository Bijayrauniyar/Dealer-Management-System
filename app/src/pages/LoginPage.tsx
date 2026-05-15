import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/app/FormField";

const LoginDemo = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username || !password) {
      setError("Enter your username/email and password.");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    navigate("/app/home");
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="rounded-2xl bg-white border border-border-subtle shadow-card p-6 space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Sign in</h2>
        <p className="mt-1 text-sm text-muted">Demo mode — any email/password works.</p>
      </div>

      <FormField label="Username or email" required>
        <Input
          type="text"
          placeholder="username or you@company.com"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
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
        Sign in
      </Button>
    </form>
  );
};

const LoginLive = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && user) navigate("/app/home", { replace: true });
  }, [authLoading, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Enter email and password.");
      return;
    }
    setLoading(true);
    const { error: signErr } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (signErr) {
      setError(signErr.message);
      return;
    }
    navigate("/app/home", { replace: true });
  };

  if (authLoading) {
    return (
      <div className="rounded-2xl bg-white border border-border-subtle shadow-card p-8 text-center text-sm text-muted">
        Loading…
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="rounded-2xl bg-white border border-border-subtle shadow-card p-6 space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Sign in</h2>
        <p className="mt-1 text-sm text-muted">Use your Supabase account email and password.</p>
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
        Sign in
      </Button>

      <p className="text-center text-sm text-muted">
        New dealer?{" "}
        <Link to="/register" className="text-teal-600 font-medium hover:underline">
          Create workspace
        </Link>
      </p>
    </form>
  );
};

export const LoginPage = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-page px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-2xl font-bold text-teal-600">DealerOS</span>
          <p className="mt-1 text-sm text-muted">Havmor Distributor Panel</p>
        </div>

        {isSupabaseConfigured ? <LoginLive /> : <LoginDemo />}

        <p className="mt-6 text-center text-xs text-muted">
          Google sign-in available later.
        </p>
      </div>
    </div>
  );
};
