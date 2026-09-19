import type { User } from "./types";

const ACCESS_TOKEN_KEY = "token";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_KEY = "user";

export const AUTH_SESSION_EXPIRED_EVENT = "auth:session-expired";

type SessionPayload = {
  token?: string | null;
  refreshToken?: string | null;
  user?: User | null;
};

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);

export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

export const getStoredUser = (): User | null => {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
};

export const saveSession = (payload: SessionPayload) => {
  if (payload.token !== undefined) {
    if (payload.token) localStorage.setItem(ACCESS_TOKEN_KEY, payload.token);
    else localStorage.removeItem(ACCESS_TOKEN_KEY);
  }

  if (payload.refreshToken !== undefined) {
    if (payload.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, payload.refreshToken);
    else localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  if (payload.user !== undefined) {
    if (payload.user) localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
    else localStorage.removeItem(USER_KEY);
  }
};

export const clearSession = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const emitSessionExpired = (message = "Session expired. Please login again.") => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(AUTH_SESSION_EXPIRED_EVENT, { detail: { message } }));
};
