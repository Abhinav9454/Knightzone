import { createStompRealtimeConnection } from "./stompRealtimeClient";

type MatchRealtimePayload = Record<string, unknown>;

type MatchRealtimeHandlers = {
  onUpdate?: (payload: MatchRealtimePayload) => void;
  onError?: (message: string) => void;
};

type MatchRealtimeConnection = {
  close: () => void;
};

export const connectUserMatchRealtime = (
  userId: number,
  handlers: MatchRealtimeHandlers,
): MatchRealtimeConnection => {
  return createStompRealtimeConnection({
    onConnected: ({ subscribe }) => {
      subscribe(`/topic/user/${userId}/match`, `user-match-${userId}`);
    },
    onMessage: (frame) => {
      try {
        const parsed = JSON.parse(frame.body || "{}");
        handlers.onUpdate?.(parsed as MatchRealtimePayload);
      } catch {
        handlers.onError?.("Failed to parse match realtime payload");
      }
    },
    onError: handlers.onError,
  });
};
