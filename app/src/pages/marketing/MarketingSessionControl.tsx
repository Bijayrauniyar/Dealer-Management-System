import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";

type Variant = "nav" | "navMobile" | "footer" | "inline";

type Props = {
  variant?: Variant;
};

const navClass =
  "rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-teal-700 lg:px-3 lg:text-[15px]";
const navMobileClass =
  "flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-200 text-base font-semibold text-slate-800";
const footerClass = "hover:text-teal-700 transition-colors";
const inlineClass = "font-medium text-teal-600 hover:underline";

/** Log in when logged out; log out when session exists (avoids /login → license redirect loop). */
export function MarketingSessionControl({ variant = "nav" }: Props) {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();

  if (loading) return null;

  if (user) {
    const signOutClass =
      variant === "nav"
        ? navClass
        : variant === "navMobile"
          ? navMobileClass
          : variant === "footer"
            ? footerClass
            : inlineClass;

    return (
      <button
        type="button"
        className={signOutClass}
        onClick={() => void signOut().then(() => navigate("/login", { replace: true }))}
      >
        Log out
      </button>
    );
  }

  const loginClass =
    variant === "nav"
      ? navClass
      : variant === "navMobile"
        ? navMobileClass
        : variant === "footer"
          ? footerClass
          : inlineClass;

  return (
    <Link to="/login" className={loginClass}>
      Log in
    </Link>
  );
}
