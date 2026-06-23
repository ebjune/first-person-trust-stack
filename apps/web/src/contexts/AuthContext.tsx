import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { AuthSession } from "../lib/types";
import { saveSession, loadSession, clearSession } from "../lib/auth";
import { logout as apiLogout } from "../lib/api";

interface AuthContextValue {
  session: AuthSession | null;
  login: (session: AuthSession) => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => loadSession());

  const login = useCallback((newSession: AuthSession) => {
    saveSession(newSession);
    setSession(newSession);
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    clearSession();
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ session, login, logout, isAuthenticated: session !== null }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
