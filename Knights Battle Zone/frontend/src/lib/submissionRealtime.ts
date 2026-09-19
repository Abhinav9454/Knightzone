import { createStompRealtimeConnection } from "./stompRealtimeClient";

export type SubmissionRealtimePayload = {
  type?: string;
  submissionId?: number;
  problemId?: number;
  userId?: number;
  status?: string;
  submittedAt?: string;
};

type SubmissionRealtimeHandlers = {
  onUpdate?: (payload: SubmissionRealtimePayload) => void;
  onError?: (message: string) => void;
};

type SubmissionRealtimeConnection = {
  close: () => void;
};

export const connectSubmissionRealtime = (
  userId: number,
  handlers: SubmissionRealtimeHandlers,
): SubmissionRealtimeConnection => {
  return createStompRealtimeConnection({
    onConnected: ({ subscribe }) => {
      subscribe(`/topic/submissions/user/${userId}`, `submission-updates-${userId}`);
    },
    onMessage: (frame) => {
      try {
        const parsed = JSON.parse(frame.body || "{}");
        handlers.onUpdate?.(parsed as SubmissionRealtimePayload);
      } catch {
        handlers.onError?.("Failed to parse submission realtime payload");
      }
    },
    onError: handlers.onError,
  });
};
