/* ============================================================
   Admin Auth Context — server-side session
   Authentication is performed by the server (POST /api/admin/login,
   HMAC-signed HttpOnly cookie). No credential, token, or password
   comparison exists in the client bundle. When admin access is not
   configured on the deployment, the server fails closed and every
   admin route stays locked.
   ============================================================ */
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface AdminLoginResult {
  ok: boolean;
  /** Visitor-safe explanation when login cannot succeed (e.g. admin
   *  access is not configured on this deployment). */
  error?: string;
}

interface AdminAuthContextType {
  isAuthenticated: boolean;
  /** True while the initial session check is in flight. */
  checking: boolean;
  login: (password: string) => Promise<AdminLoginResult>;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType>({
  isAuthenticated: false,
  checking: true,
  login: async () => ({ ok: false, error: "Admin access is unavailable." }),
  logout: async () => {},
});

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/session", { credentials: "same-origin" });
        const data = res.ok ? await res.json().catch(() => ({})) : {};
        if (!cancelled) setIsAuthenticated(data?.authenticated === true);
      } catch {
        if (!cancelled) setIsAuthenticated(false);
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (password: string): Promise<AdminLoginResult> => {
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setIsAuthenticated(true);
        return { ok: true };
      }
      const data = await res.json().catch(() => ({}));
      if (res.status === 503) {
        return { ok: false, error: "Admin access is not configured on this deployment." };
      }
      if (res.status === 429) {
        return { ok: false, error: "Too many attempts. Please try again later." };
      }
      return { ok: false, error: typeof data?.error === "string" ? data.error : "Incorrect password. Please try again." };
    } catch {
      return { ok: false, error: "Admin access is unavailable. Please try again later." };
    }
  };

  const logout = async () => {
    setIsAuthenticated(false);
    try {
      await fetch("/api/admin/logout", { method: "POST", credentials: "same-origin" });
    } catch {
      /* the cookie is server-owned; UI state is already cleared */
    }
  };

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, checking, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export const useAdminAuth = () => useContext(AdminAuthContext);
