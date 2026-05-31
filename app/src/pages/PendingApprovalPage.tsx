import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

/** Shown while `tenants.status` is pending / suspended (not active). */
export const PendingApprovalPage = () => {
  const navigate = useNavigate();
  const { signOut, tenantStatus, user, loading, refreshProfile } = useAuth();

  const handleSignOut = () => {
    void signOut().then(() => navigate("/login", { replace: true }));
  };

  const handleCheckAgain = () => {
    void refreshProfile().then((profile) => {
      if (profile.status === "active") {
        navigate("/app/home", { replace: true });
        return;
      }
      toast.message(
        profile.status
          ? "Your workspace is not active yet. Contact support when approved."
          : "No workspace linked to this account yet.",
      );
    });
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-page px-4">
      <div className="w-full max-w-md rounded-2xl border border-border-subtle bg-white p-8 shadow-card text-center space-y-4">
        <h1 className="text-lg font-bold text-foreground">Account pending</h1>
        <p className="text-sm text-muted">
          Your dealer workspace is <strong>{tenantStatus ?? "unknown"}</strong>. An administrator must approve it
          before you can use the app.
        </p>
        <p className="text-xs text-muted">After approval, tap below to continue.</p>
        <div className="flex flex-col gap-2 pt-2">
          <Button variant="primary" size="full" onClick={handleCheckAgain}>
            I&apos;ve been approved — continue
          </Button>
          <Button variant="secondary" size="full" onClick={handleSignOut}>
            Sign out
          </Button>
          <Link to="/login" className="text-sm text-teal-600 hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
};
