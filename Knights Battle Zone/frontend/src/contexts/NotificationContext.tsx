import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import type {
  AppNotification,
  NotificationPreferences,
  NotificationPreference,
  NotificationType,
} from "@/lib/types";
import { APP_SMART_NOTIFICATION_EVENT, type SmartNotificationDetail } from "@/lib/realtime";
import { contestApi, duelApi, userApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

type AddNotificationInput = {
  type: NotificationType;
  title?: string;
  message?: string;
};

type NotificationContextType = {
  notifications: AppNotification[];
  unreadCount: number;
  preferences: NotificationPreferences;
  addNotification: (input: AddNotificationInput) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearHistory: () => void;
  setTypePreference: (type: NotificationType, preference: Partial<NotificationPreference>) => void;
};

const NOTIFICATION_LIMIT = 120;
const DAILY_REMINDER_HOUR = 10;

const NOTIFICATION_COPY: Record<NotificationType, { title: string; message: string }> = {
  achievement_unlocked: {
    title: "Achievement unlocked",
    message: "You unlocked a new milestone. Keep pushing your limits.",
  },
  friend_logged_in: {
    title: "Friend logged in",
    message: "One of your coding friends is active right now.",
  },
  match_found: {
    title: "Multiplayer match found",
    message: "Your duel arena is ready. Join now.",
  },
  daily_challenge: {
    title: "Daily challenge reminder",
    message: "Your daily challenge is waiting. Solve now to maintain streak.",
  },
  tournament_starting: {
    title: "Tournament starting soon",
    message: "A contest starts soon. Join before registration closes.",
  },
  challenge_received: {
    title: "Someone challenged you",
    message: "You have a new duel challenge. Respond from Duels.",
  },
};

const NOTIFICATION_TYPES: NotificationType[] = [
  "achievement_unlocked",
  "friend_logged_in",
  "match_found",
  "daily_challenge",
  "tournament_starting",
  "challenge_received",
];

const defaultPreferences = (): NotificationPreferences =>
  NOTIFICATION_TYPES.reduce((acc, type) => {
    acc[type] = { enabled: true, muted: false };
    return acc;
  }, {} as NotificationPreferences);

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const userScopedKey = (suffix: string, userId?: number | null) =>
  `app-notification:${suffix}:${userId ?? "guest"}`;

const createNotificationId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const knownPendingDuelIdsRef = useRef<Set<number>>(new Set());
  const sessionMatchIdsRef = useRef<Set<number>>(new Set());
  const friendPulseAtRef = useRef<number>(0);

  useEffect(() => {
    const historyRaw = localStorage.getItem(userScopedKey("history", user?.id));
    const prefsRaw = localStorage.getItem(userScopedKey("prefs", user?.id));
    if (historyRaw) {
      try {
        const parsed = JSON.parse(historyRaw) as AppNotification[];
        setNotifications(parsed);
      } catch {
        setNotifications([]);
      }
    } else {
      setNotifications([]);
    }
    if (prefsRaw) {
      try {
        const parsed = JSON.parse(prefsRaw) as NotificationPreferences;
        setPreferences({ ...defaultPreferences(), ...parsed });
      } catch {
        setPreferences(defaultPreferences());
      }
    } else {
      setPreferences(defaultPreferences());
    }
    knownPendingDuelIdsRef.current = new Set();
    sessionMatchIdsRef.current = new Set();
  }, [user?.id]);

  useEffect(() => {
    localStorage.setItem(userScopedKey("history", user?.id), JSON.stringify(notifications));
  }, [notifications, user?.id]);

  useEffect(() => {
    localStorage.setItem(userScopedKey("prefs", user?.id), JSON.stringify(preferences));
  }, [preferences, user?.id]);

  const addNotification = useCallback(
    ({ type, title, message }: AddNotificationInput) => {
      const preference = preferences[type];
      if (!preference?.enabled) return;

      const fallback = NOTIFICATION_COPY[type];
      const nextNotification: AppNotification = {
        id: createNotificationId(),
        type,
        title: title || fallback.title,
        message: message || fallback.message,
        createdAt: new Date().toISOString(),
        read: false,
      };

      setNotifications((prev) => [nextNotification, ...prev].slice(0, NOTIFICATION_LIMIT));
      if (!preference.muted) {
        toast(nextNotification.title, { description: nextNotification.message });
      }
    },
    [preferences],
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  }, []);

  const clearHistory = useCallback(() => {
    setNotifications([]);
  }, []);

  const setTypePreference = useCallback(
    (type: NotificationType, preference: Partial<NotificationPreference>) => {
      setPreferences((prev) => ({
        ...prev,
        [type]: {
          ...prev[type],
          ...preference,
        },
      }));
    },
    [],
  );

  useEffect(() => {
    const onSmartEvent = (event: Event) => {
      const detail = (event as CustomEvent<SmartNotificationDetail>).detail;
      if (!detail?.type) return;
      addNotification({
        type: detail.type,
        title: detail.title,
        message: detail.message,
      });
    };

    window.addEventListener(APP_SMART_NOTIFICATION_EVENT, onSmartEvent as EventListener);
    return () => window.removeEventListener(APP_SMART_NOTIFICATION_EVENT, onSmartEvent as EventListener);
  }, [addNotification]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const friendPulse = async () => {
      const now = Date.now();
      if (now - friendPulseAtRef.current < 15 * 60 * 1000) return;
      friendPulseAtRef.current = now;
      try {
        const response = await userApi.getAll();
        const candidates = response.data.filter((candidate) => candidate.id !== user.id);
        if (!candidates.length) return;
        const candidate = candidates[Math.floor(Math.random() * candidates.length)];
        addNotification({
          type: "friend_logged_in",
          message: `${candidate.name || "A friend"} is online now.`,
        });
      } catch {
        // optional signal; ignore network failure
      }
    };

    void friendPulse();
    const friendTimer = window.setInterval(() => {
      void friendPulse();
    }, 5 * 60 * 1000);

    return () => window.clearInterval(friendTimer);
  }, [addNotification, isAuthenticated, user]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const checkDailyReminder = () => {
      const now = new Date();
      if (now.getHours() < DAILY_REMINDER_HOUR) return;
      const key = userScopedKey("daily-reminder", user.id);
      const today = now.toISOString().slice(0, 10);
      const sentForDay = localStorage.getItem(key);
      if (sentForDay === today) return;
      localStorage.setItem(key, today);
      addNotification({ type: "daily_challenge" });
    };

    checkDailyReminder();
    const timer = window.setInterval(checkDailyReminder, 5 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [addNotification, isAuthenticated, user]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const checkContestAndDuelSignals = async () => {
      try {
        const contests = await contestApi.getAll();
        const now = Date.now();
        const upcoming = contests.find((contest) => {
          if (contest.status !== "UPCOMING") return false;
          const startMs = new Date(contest.startTime).getTime();
          const diffMin = (startMs - now) / (1000 * 60);
          return diffMin > 0 && diffMin <= 30;
        });
        if (upcoming) {
          const storageKey = userScopedKey(`contest-${upcoming.id}`, user.id);
          if (!sessionStorage.getItem(storageKey)) {
            sessionStorage.setItem(storageKey, "1");
            addNotification({
              type: "tournament_starting",
              message: `${upcoming.title} starts in less than 30 minutes.`,
            });
          }
        }
      } catch {
        // optional signal
      }

      try {
        const duels = await duelApi.getAll();
        const incomingPending = duels.filter(
          (duel) => duel.status === "PENDING" && duel.opponentId === user.id,
        );
        const activeMatches = duels.filter(
          (duel) =>
            duel.status === "ACTIVE" &&
            (duel.challengerId === user.id || duel.opponentId === user.id),
        );

        incomingPending.forEach((duel) => {
          if (knownPendingDuelIdsRef.current.has(duel.id)) return;
          knownPendingDuelIdsRef.current.add(duel.id);
          addNotification({
            type: "challenge_received",
            message: `${duel.challengerName} challenged you for a ${duel.mode} duel.`,
          });
        });

        activeMatches.forEach((duel) => {
          if (sessionMatchIdsRef.current.has(duel.id)) return;
          sessionMatchIdsRef.current.add(duel.id);
          addNotification({
            type: "match_found",
            message: `Match ready: ${duel.challengerName} vs ${duel.opponentName}`,
          });
        });
      } catch {
        // optional signal
      }
    };

    void checkContestAndDuelSignals();
    const timer = window.setInterval(() => {
      void checkContestAndDuelSignals();
    }, 90 * 1000);

    return () => window.clearInterval(timer);
  }, [addNotification, isAuthenticated, user]);

  const unreadCount = useMemo(
    () => notifications.reduce((count, item) => (item.read ? count : count + 1), 0),
    [notifications],
  );

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      preferences,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearHistory,
      setTypePreference,
    }),
    [
      notifications,
      unreadCount,
      preferences,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearHistory,
      setTypePreference,
    ],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
