import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { Navigate, useLocation } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { debugLog } from "@/lib/debugLog";
import { signOutApp } from "@/lib/signOutApp";
import { isTenantLicenseValid, type TenantLicenseSnapshot, type TenantPlan } from "@/lib/tenantLicense";
import { pickTenantUserRow, type TenantUserRow } from "@/lib/tenantUser";

type TenantStatus = TenantLicenseSnapshot["status"];

export type TenantProfile = TenantLicenseSnapshot & {
  tenantId: string | null;
};

type AuthState = {
  user: User | null;
  session: Session | null;
  tenantId: string | null;
  tenantStatus: TenantStatus;
  tenantPlan: TenantPlan;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  licenseValid: boolean;
  role: string | null;
  loading: boolean;
  refreshProfile: () => Promise<TenantProfile>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

const emptyLicense: TenantLicenseSnapshot = {
  status: null,
  plan: null,
  trialEndsAt: null,
  subscriptionEndsAt: null,
};

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [license, setLicense] = useState<TenantLicenseSnapshot>(emptyLicense);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async (): Promise<TenantProfile> => {
    const empty: TenantProfile = { tenantId: null, ...emptyLicense };
    const {
      data: { user: latestUser },
    } = await supabase.auth.getUser();
    if (!latestUser) {
      setTenantId(null);
      setLicense(emptyLicense);
      setRole(null);
      return empty;
    }
    const { data: tuRows, error: tuErr } = await supabase
      .from("tenant_users")
      .select("tenant_id, role, created_at")
      .eq("user_id", latestUser.id);

    const tu = pickTenantUserRow(tuRows);

    if (tuErr) {
      console.error("tenant_users load failed:", tuErr.message);
    }
    debugLog("H1", "auth.tsx:refreshProfile:tenant_users", "tenant_users query", {
      hasUser: true,
      userIdPrefix: latestUser.id.slice(0, 8),
      tenantId: tu?.tenant_id ?? null,
      role: tu?.role ?? null,
      tuError: tuErr?.message ?? null,
      tuCode: tuErr?.code ?? null,
    });

    const tid = tu?.tenant_id ?? null;
    setTenantId(tid);
    setRole(tu?.role ?? null);

    if (!tid) {
      setLicense(emptyLicense);
      return empty;
    }

    const { data: tenant, error: tenantErr } = await supabase
      .from("tenants")
      .select("status, plan, trial_ends_at, subscription_ends_at")
      .eq("id", tid)
      .maybeSingle();

    if (tenantErr) {
      console.error("tenants load failed:", tenantErr.message);
    }

    const snapshot: TenantLicenseSnapshot = {
      status: (tenant?.status as TenantStatus) ?? "pending",
      plan: (tenant?.plan as TenantPlan) ?? null,
      trialEndsAt: tenant?.trial_ends_at ?? null,
      subscriptionEndsAt: tenant?.subscription_ends_at ?? null,
    };
    debugLog("H2", "auth.tsx:refreshProfile:tenants", "tenants query", {
      tenantIdPrefix: tid.slice(0, 8),
      status: snapshot.status,
      plan: snapshot.plan,
      tenantError: tenantErr?.message ?? null,
      tenantCode: tenantErr?.code ?? null,
    });
    setLicense(snapshot);
    return { tenantId: tid, ...snapshot };
  }, []);

  useEffect(() => {
    debugLog("H3", "auth.tsx:AuthProvider:mount", "supabase mode", {
      isSupabaseConfigured,
    });
    const init = async () => {
      const {
        data: { session: s },
      } = await supabase.auth.getSession();
      setSession(s);
      setUser(s?.user ?? null);
      await refreshProfile();
      setLoading(false);
    };
    void init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      void refreshProfile();
    });

    return () => subscription.unsubscribe();
  }, [refreshProfile]);

  const licenseValid = useMemo(() => isTenantLicenseValid(license), [license]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      session,
      tenantId,
      tenantStatus: license.status,
      tenantPlan: license.plan,
      trialEndsAt: license.trialEndsAt,
      subscriptionEndsAt: license.subscriptionEndsAt,
      licenseValid,
      role,
      loading,
      refreshProfile,
      signOut: async () => {
        await signOutApp();
        setSession(null);
        setUser(null);
        setTenantId(null);
        setLicense(emptyLicense);
        setRole(null);
      },
    }),
    [license, licenseValid, loading, refreshProfile, role, session, tenantId, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

type ProtectedRouteProps = PropsWithChildren<{ adminOnly?: boolean }>;

export const ProtectedRoute = ({ children, adminOnly = false }: ProtectedRouteProps) => {
  const { user, loading, tenantId, tenantStatus, licenseValid, role } = useAuth();
  const location = useLocation();
  if (loading) return <div className="page">Loading...</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (adminOnly && role !== "super_admin") return <Navigate to="/app/home" replace />;
  if (!adminOnly && user && !tenantId) {
    debugLog("H1", "auth.tsx:ProtectedRoute", "redirect no-tenant", { path: location.pathname });
    return <Navigate to="/no-tenant" replace />;
  }
  if (!adminOnly && tenantStatus && tenantStatus !== "active") {
    debugLog("H2", "auth.tsx:ProtectedRoute", "redirect pending", {
      tenantIdPrefix: tenantId?.slice(0, 8) ?? null,
      tenantStatus,
      path: location.pathname,
    });
    return <Navigate to="/pending-approval" replace />;
  }
  if (!adminOnly && tenantStatus === "active" && !licenseValid) {
    debugLog("H2", "auth.tsx:ProtectedRoute", "redirect license expired", {
      tenantIdPrefix: tenantId?.slice(0, 8) ?? null,
      path: location.pathname,
    });
    return <Navigate to="/license-expired" replace />;
  }
  debugLog("H5", "auth.tsx:ProtectedRoute", "allow app", {
    tenantIdPrefix: tenantId?.slice(0, 8) ?? null,
    tenantStatus,
    path: location.pathname,
  });
  return <>{children}</>;
};
