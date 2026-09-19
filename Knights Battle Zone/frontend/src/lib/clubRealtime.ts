import type { ClubMessage, ClubUpdateEvent } from "./types";
import { createStompRealtimeConnection } from "./stompRealtimeClient";

type ClubRealtimeHandlers = {
  onChat?: (message: ClubMessage) => void;
  onUpdate?: (event: ClubUpdateEvent) => void;
  onError?: (message: string) => void;
};

type ClubRealtimeConnection = {
  close: () => void;
};

export const connectClubRealtime = (
  clubId: number,
  handlers: ClubRealtimeHandlers,
): ClubRealtimeConnection => {
  return createStompRealtimeConnection({
    onConnected: ({ subscribe }) => {
      subscribe(`/topic/clubs/${clubId}/chat`, `club-${clubId}-chat`);
      subscribe(`/topic/clubs/${clubId}/updates`, `club-${clubId}-updates`);
    },
    onMessage: (frame) => {
      const destination = frame.headers.destination || "";
      try {
        const parsed = JSON.parse(frame.body || "{}");
        if (destination.endsWith("/chat")) {
          handlers.onChat?.(parsed as ClubMessage);
        } else if (destination.endsWith("/updates")) {
          handlers.onUpdate?.(parsed as ClubUpdateEvent);
        }
      } catch {
        handlers.onError?.("Failed to parse realtime payload");
      }
    },
    onError: handlers.onError,
  });
};
