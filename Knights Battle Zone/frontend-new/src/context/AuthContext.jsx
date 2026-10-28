import { createContext, useContext, useState } from "react";
import { authApi } from "../services/api";

const AuthContext = createContext(null);

const parseJwt = (token) => {
  try {
    if (!token) return null;
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

const normalizeRole = (role) => {
  if (!role) return "USER";
  const upper = String(role).toUpperCase();
  return upper === "ADMIN" ? "ADMIN" : "USER";
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => authApi.getToken());
  const [user, setUser] = useState(() => {
    const saved = authApi.getCurrentUser();
    const tokenVal = authApi.getToken();
    const claims = parseJwt(tokenVal);
    if (saved) {
      return {
        ...saved,
        role: normalizeRole(claims?.role || saved.role),
      };
    }
    return null;
  });
  const [loading, setLoading] = useState(false);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const data = await authApi.login(credentials);
      setToken(data.token);
      const claims = parseJwt(data.token);
      const userObj = {
        ...(data.user || { email: credentials.email }),
        role: normalizeRole(claims?.role || data.user?.role),
      };
      setUser(userObj);
      localStorage.setItem("kbz_user", JSON.stringify(userObj));
      return data;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const data = await authApi.register(userData);
      setToken(data.token);
      const claims = parseJwt(data.token);
      const userObj = {
        ...(data.user || { email: userData.email, name: userData.name }),
        role: normalizeRole(claims?.role || data.user?.role),
      };
      setUser(userObj);
      localStorage.setItem("kbz_user", JSON.stringify(userObj));
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
    setToken(null);
  };

  const updateUserData = (updatedFields) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedFields };
      localStorage.setItem("kbz_user", JSON.stringify(merged));
      return merged;
    });
  };

  const designatedAdminEmail = (
    import.meta.env.VITE_ADMIN_EMAIL || "admin@knightzone.dev"
  ).toLowerCase().trim();

  const isAuthenticated = !!token;
  const currentRole = normalizeRole(user?.role);
  const isDesignatedAdminEmail =
    !!user?.email && user.email.toLowerCase().trim() === designatedAdminEmail;
  const isAdmin = currentRole === "ADMIN" || isDesignatedAdminEmail;
  const isUser = !isAdmin;

  // Admin Mode state (defaults to true for admins, allows toggling preview)
  const [adminMode, setAdminModeState] = useState(() => {
    const saved = localStorage.getItem("kbz_admin_mode");
    return saved !== null ? saved === "true" : true;
  });

  const toggleAdminMode = () => {
    setAdminModeState((prev) => {
      const next = !prev;
      localStorage.setItem("kbz_admin_mode", String(next));
      return next;
    });
  };

  const setAdminMode = (val) => {
    setAdminModeState(val);
    localStorage.setItem("kbz_admin_mode", String(val));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: currentRole,
        isAdmin,
        isUser,
        adminMode: isAdmin && adminMode,
        toggleAdminMode,
        setAdminMode,
        isAuthenticated,
        loading,
        login,
        register,
        logout,
        updateUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
