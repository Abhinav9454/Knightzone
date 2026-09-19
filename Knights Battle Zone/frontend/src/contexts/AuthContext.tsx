import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { User } from "@/lib/types";
import { authApi, userApi } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/error";
import {
  AUTH_SESSION_EXPIRED_EVENT,
  clearSession,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  saveSession,
} from "@/lib/session";
import { normalizeRole } from "@/lib/auth-role";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isStudent: boolean;
  isCompany: boolean;
  isTPO: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  patchUser: (updates: Partial<User>) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearAuthState = () => {
    clearSession();
    setToken(null);
    setRefreshToken(null);
    setUser(null);
  };

  useEffect(() => {
    const onSessionExpired = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: string }>).detail;
      clearAuthState();
      toast.error(detail?.message || "Session expired. Please login again.");
    };

    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, onSessionExpired as EventListener);
    return () => {
      window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, onSessionExpired as EventListener);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const applySession = (accessToken: string, nextRefreshToken: string | null, userData: User) => {
      if (!mounted) return;
      saveSession({ token: accessToken, refreshToken: nextRefreshToken, user: userData });
      setToken(accessToken);
      setRefreshToken(nextRefreshToken);
      setUser(userData);
    };

    const bootstrap = async () => {
      const savedToken = getAccessToken();
      const savedRefreshToken = getRefreshToken();
      const savedUser = getStoredUser();

      // Normalize partially-corrupted session payloads.
      if ((savedToken && !savedUser) || (!savedToken && savedUser)) {
        clearAuthState();
      }

      if (savedToken && savedUser) {
        setToken(savedToken);
        setRefreshToken(savedRefreshToken);
        setUser(savedUser);

        try {
          const latest = await userApi.getProfile();
          if (mounted) {
            setUser(latest);
            saveSession({ user: latest });
          }
        } catch {
          if (savedRefreshToken) {
            try {
              const refreshed = await authApi.refresh(savedRefreshToken);
              applySession(
                refreshed.token,
                refreshed.refreshToken ?? savedRefreshToken,
                refreshed.user,
              );
            } catch {
              clearAuthState();
            }
          } else {
            clearAuthState();
          }
        }

        if (mounted) setIsLoading(false);
        return;
      }

      if (savedRefreshToken) {
        try {
          const refreshed = await authApi.refresh(savedRefreshToken);
          applySession(
            refreshed.token,
            refreshed.refreshToken ?? savedRefreshToken,
            refreshed.user,
          );
        } catch {
          clearAuthState();
        }
      }

      if (mounted) setIsLoading(false);
    };

    void bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const res = await authApi.login({ email: normalizedEmail, password });
      const { token: jwt, refreshToken: nextRefreshToken, user: userData } = res.data;
      saveSession({
        token: jwt,
        refreshToken: nextRefreshToken ?? null,
        user: userData,
      });
      setToken(jwt);
      setRefreshToken(nextRefreshToken ?? null);
      setUser(userData);
      toast.success("Welcome back!");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Login failed. Check credentials."));
      throw new Error("Login failed");
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const res = await authApi.register({ name: name.trim(), email: normalizedEmail, password });
      const { token: jwt, refreshToken: nextRefreshToken, user: userData } = res.data;
      saveSession({
        token: jwt,
        refreshToken: nextRefreshToken ?? null,
        user: userData,
      });
      setToken(jwt);
      setRefreshToken(nextRefreshToken ?? null);
      setUser(userData);
      toast.success("Account created!");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Registration failed. Check your input."));
      throw new Error("Registration failed");
    }
  };

  const googleLogin = async (idToken: string) => {
    try {
      const res = await authApi.googleLogin({ idToken });
      const { token: jwt, refreshToken: nextRefreshToken, user: userData } = res.data;
      saveSession({
        token: jwt,
        refreshToken: nextRefreshToken ?? null,
        user: userData,
      });
      setToken(jwt);
      setRefreshToken(nextRefreshToken ?? null);
      setUser(userData);
      toast.success("Signed in with Google!");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Google sign-in failed. Try again."));
      throw new Error("Google sign-in failed");
    }
  };

  const patchUser = (updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...updates };
      saveSession({ user: next });
      return next;
    });
  };

  const logout = async () => {
    try {
      await authApi.logout(refreshToken ?? getRefreshToken() ?? undefined);
    } catch {
      // Best-effort revoke; local cleanup should always happen.
    }

    clearAuthState();
    toast.info("Logged out");
  };

  const role = normalizeRole(user?.role) || "USER";
  const isStudent = role === "STUDENT" || role === "USER";
  const isCompany = role === "COMPANY";
  const isTPO = role === "TPO" || role === "ADMIN" || role === "SUPER_ADMIN";
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        isStudent,
        isCompany,
        isTPO,
        isAdmin,
        login,
        googleLogin,
        register,
        patchUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
