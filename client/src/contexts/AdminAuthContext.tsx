/* ============================================================
   Admin Auth Context — simple password-based session
   Password stored in localStorage as a hashed token
   ============================================================ */
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

const ADMIN_PASSWORD = "OCGroup2024!";
const SESSION_KEY = "oc_admin_session";
const SESSION_TOKEN = btoa(ADMIN_PASSWORD + "_authenticated");

interface AdminAuthContextType {
  isAuthenticated: boolean;
  login: (password: string) => boolean;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType>({
  isAuthenticated: false,
  login: () => false,
  logout: () => {},
});

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored === SESSION_TOKEN) {
      setIsAuthenticated(true);
    }
  }, []);

  const login = (password: string): boolean => {
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem(SESSION_KEY, SESSION_TOKEN);
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
  };

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export const useAdminAuth = () => useContext(AdminAuthContext);
