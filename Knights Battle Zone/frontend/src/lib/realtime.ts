import { useEffect, useRef } from "react";
import type { NotificationType } from "./types";

export const APP_DATA_REFRESH_EVENT = "app:data-refresh";
export const APP_SMART_NOTIFICATION_EVENT = "app:smart-notification";

type RefreshDetail = {
  scope?: string;
  at: number;
};

type RealtimeOptions = {
  enabled?: boolean;
  intervalMs?: number;
  maxIntervalMs?: number;
  backoffMultiplier?: number;
  jitterRatio?: number;
  scope?: string;
  refreshOnFocus?: boolean;
  immediate?: boolean;
};

export type SmartNotificationDetail = {
  type: NotificationType;
  title?: string;
  message?: string;
  at: number;
};

export function emitAppDataRefresh(scope = "all") {
  if (typeof window === "undefined") return;
  const detail: RefreshDetail = {
    scope,
    at: Date.now(),
  };
  window.dispatchEvent(new CustomEvent<RefreshDetail>(APP_DATA_REFRESH_EVENT, { detail }));
}

export function emitSmartNotification(
  type: NotificationType,
  payload?: { title?: string; message?: string },
) {
  if (typeof window === "undefined") return;
  const detail: SmartNotificationDetail = {
    type,
    title: payload?.title,
    message: payload?.message,
    at: Date.now(),
  };
  window.dispatchEvent(
    new CustomEvent<SmartNotificationDetail>(APP_SMART_NOTIFICATION_EVENT, { detail }),
  );
}

export function useRealtimeRefresh(
  refresh: () => Promise<void | boolean> | void | boolean,
  {
    enabled = true,
    intervalMs = 0,
    maxIntervalMs,
    backoffMultiplier = 1.8,
    jitterRatio = 0.15,
    scope,
    refreshOnFocus = true,
    immediate = true,
  }: RealtimeOptions = {},
) {
  const refreshRef = useRef(refresh);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    if (!enabled) return;

    const baseIntervalMs = Math.max(0, intervalMs);
    const maxBackoffIntervalMs = Math.max(
      baseIntervalMs,
      maxIntervalMs ?? Math.max(baseIntervalMs, Math.round(baseIntervalMs * 6)),
    );
    let currentIntervalMs = baseIntervalMs;
    let timer: number | null = null;
    let cancelled = false;
    let inFlight = false;

    const withJitter = (delayMs: number) => {
      if (delayMs <= 0 || jitterRatio <= 0) return delayMs;
      const jitter = delayMs * Math.min(0.5, Math.max(0, jitterRatio));
      const delta = (Math.random() * jitter * 2) - jitter;
      return Math.max(0, Math.round(delayMs + delta));
    };

    const schedule = () => {
      if (cancelled || currentIntervalMs <= 0) {
        return;
      }
      timer = window.setTimeout(() => {
        void runRefresh(true);
      }, withJitter(currentIntervalMs));
    };

    const runRefresh = async (fromTimer = false) => {
      if (cancelled || inFlight) {
        return;
      }
      inFlight = true;
      let refreshSucceeded = true;
      try {
        const result = await refreshRef.current();
        refreshSucceeded = result !== false;
      } catch {
        refreshSucceeded = false;
      } finally {
        inFlight = false;
      }

      if (baseIntervalMs > 0) {
        if (refreshSucceeded) {
          currentIntervalMs = baseIntervalMs;
        } else {
          const nextInterval = Math.max(
            baseIntervalMs,
            Math.round((currentIntervalMs || baseIntervalMs) * Math.max(1.2, backoffMultiplier)),
          );
          currentIntervalMs = Math.min(maxBackoffIntervalMs, nextInterval);
        }
      }

      if (fromTimer && !cancelled) {
        schedule();
      }
    };

    const onCustomRefresh = (event: Event) => {
      const payload = (event as CustomEvent<RefreshDetail>).detail;
      if (!scope || !payload?.scope || payload.scope === "all" || payload.scope === scope) {
        void runRefresh();
      }
    };

    const onFocus = () => {
      void runRefresh();
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void runRefresh();
      }
    };

    if (immediate) {
      void runRefresh();
    }

    if (baseIntervalMs > 0) {
      schedule();
    }
    window.addEventListener(APP_DATA_REFRESH_EVENT, onCustomRefresh as EventListener);
    if (refreshOnFocus) {
      window.addEventListener("focus", onFocus);
      document.addEventListener("visibilitychange", onVisibility);
    }

    return () => {
      cancelled = true;
      if (timer != null) {
        window.clearTimeout(timer);
      }
      window.removeEventListener(APP_DATA_REFRESH_EVENT, onCustomRefresh as EventListener);
      if (refreshOnFocus) {
        window.removeEventListener("focus", onFocus);
        document.removeEventListener("visibilitychange", onVisibility);
      }
    };
  }, [
    backoffMultiplier,
    enabled,
    immediate,
    intervalMs,
    jitterRatio,
    maxIntervalMs,
    refreshOnFocus,
    scope,
  ]);
}
