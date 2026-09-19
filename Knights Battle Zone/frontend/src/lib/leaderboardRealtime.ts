import { createStompRealtimeConnection } from "./stompRealtimeClient";

type LeaderboardRealtimeHandlers = {
  onUpdate?: (payload: Record<string, unknown>) => void;
  onError?: (message: string) => void;
};

type LeaderboardRealtimeConnection = {
  close: () => void;
};

export const connectLeaderboardRealtime = (
  handlers: LeaderboardRealtimeHandlers,
): LeaderboardRealtimeConnection => {
  return createStompRealtimeConnection({
    onConnected: ({ subscribe }) => {
      subscribe("/topic/leaderboard/updates", "leaderboard-updates");
    },
    onMessage: (frame) => {
      try {
        const parsed = JSON.parse(frame.body || "{}");
        handlers.onUpdate?.(parsed as Record<string, unknown>);
      } catch {
        handlers.onError?.("Failed to parse leaderboard realtime payload");
      }
    },
    onError: handlers.onError,
  });
};
