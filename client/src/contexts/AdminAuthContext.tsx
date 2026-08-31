import { createContext, useContext, ReactNode } from "react";

/**
 * Legacy admin authentication is intentionally disabled.
 *
 * A browser-bundled password is not an authentication boundary. The admin
 * surface must be reintroduced only behind server-side identity and database
 * authorization. Keeping this context temporarily avoids breaking any dormant
 * admin page imports while ensuring no credential is shipped to the client.
 */
interface AdminAuthContextType {
  isAuthenticated: boolean;
  login: (_password: string) => boolean;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType>({
  isAuthenticated: false,
  login: () => false,
  logout: () => {},
});

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  return (
    <AdminAuthContext.Provider
      value={{
        isAuthenticated: false,
        login: () => false,
        logout: () => {},
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export const useAdminAuth = () => useContext(AdminAuthContext);
