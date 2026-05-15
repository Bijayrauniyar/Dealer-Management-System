import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { Navigate, useLocation } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { debugLog } from "@/lib/debugLog";
import { signOutApp } from "@/lib/signOutApp";

type TenantStatus = "pending" | "active" | "suspended" | "rejected" | null;

export type TenantProfile = {
  tenantId: string | null;
  status: TenantStatus;
};

type AuthState = {
  user: User | null;
  session: Session | null;
  tenantId: string | null;
  tenantStatus: TenantStatus;
  role: string | null;
  loading: boolean;
  refreshProfile: () => Promise<TenantProfile>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenantStatus, setTenantStatus] = useState<TenantStatus>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async (): Promise<TenantProfile> => {
    const empty: TenantProfile = { tenantId: null, status: null };
    const {
      data: { user: latestUser },
    } = await supabase.auth.getUser();
    if (!latestUser) {
      setTenantId(null);
      setTenantStatus(null);
      setRole(null);
      return empty;
    }
    const { data: tu, error: tuErr } = await supabase
      .from("tenant_users")
      .select("tenant_id, role")
      .eq("user_id", latestUser.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (tuErr) {
      console.error("tenant_users load failed:", tuErr.message);
    }
    // #region agent log
    debugLog("H1", "auth.tsx:refreshProfile:tenant_users", "tenant_users query", {
      hasUser: true,
      userIdPrefix: latestUser.id.slice(0, 8),
      tenantId: tu?.tenant_id ?? null,
      role: tu?.role ?? null,
      tuError: tuErr?.message ?? null,
      tuCode: tuErr?.code ?? null,
    });
    // #endregion

    const tid = tu?.tenant_id ?? null;
    setTenantId(tid);
    setRole(tu?.role ?? null);

    if (!tid) {
      setTenantStatus(null);
      return empty;
    }

    const { data: tenant, error: tenantErr } = await supabase
      .from("tenants")
      .select("status")
      .eq("id", tid)
      .maybeSingle();

    if (tenantErr) {
      console.error("tenants load failed:", tenantErr.message);
    }

    const status = (tenant?.status as TenantStatus) ?? "pending";
    // #region agent log
    debugLog("H2", "auth.tsx:refreshProfile:tenants", "tenants query", {
      tenantIdPrefix: tid.slice(0, 8),
      status,
      tenantError: tenantErr?.message ?? null,
      tenantCode: tenantErr?.code ?? null,
    });
    // #endregion
    setTenantStatus(status);
    return { tenantId: tid, status };
  }, []);

  useEffect(() => {
    // #region agent log
    debugLog("H3", "auth.tsx:AuthProvider:mount", "supabase mode", {
      isSupabaseConfigured,
    });
    // #endregion
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

  const value = useMemo<AuthState>(
    () => ({
      user,
      session,
      tenantId,
      tenantStatus,
      role,
      loading,
      refreshProfile,
      signOut: async () => {
        await signOutApp();
        setSession(null);
        setUser(null);
        setTenantId(null);
        setTenantStatus(null);
        setRole(null);
      },
    }),
    [loading, refreshProfile, role, session, tenantId, tenantStatus, user],
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
  const { user, loading, tenantId, tenantStatus, role } = useAuth();
  const location = useLocation();
  if (loading) return <div className="page">Loading...</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (adminOnly && role !== "super_admin") return <Navigate to="/app/home" replace />;
  if (!adminOnly && user && !tenantId) {
    // #region agent log
    debugLog("H1", "auth.tsx:ProtectedRoute", "redirect no-tenant", { path: location.pathname });
    // #endregion
    return <Navigate to="/no-tenant" replace />;
  }
  if (!adminOnly && tenantStatus && tenantStatus !== "active") {
    // #region agent log
    debugLog("H2", "auth.tsx:ProtectedRoute", "redirect pending", {
      tenantIdPrefix: tenantId?.slice(0, 8) ?? null,
      tenantStatus,
      path: location.pathname,
    });
    // #endregion
    return <Navigate to="/pending-approval" replace />;
  }
  // #region agent log
  debugLog("H5", "auth.tsx:ProtectedRoute", "allow app", {
    tenantIdPrefix: tenantId?.slice(0, 8) ?? null,
    tenantStatus,
    path: location.pathname,
  });
  // #endregion
  return <>{children}</>;
};
