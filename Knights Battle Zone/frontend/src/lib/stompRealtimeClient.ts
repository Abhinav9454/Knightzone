type ReconnectOptions = {
  enabled?: boolean;
  initialDelayMs?: number;
  maxDelayMs?: number;
  multiplier?: number;
  maxAttempts?: number;
  jitterRatio?: number;
};

type HeartbeatOptions = {
  outgoingMs?: number;
  staleTimeoutMs?: number;
  staleCheckMs?: number;
};

export type StompFrame = {
  command: string;
  headers: Record<string, string>;
  body: string;
};

type StompSubscriptionApi = {
  subscribe: (destination: string, id?: string) => void;
};

type CreateStompRealtimeConnectionOptions = {
  wsPath?: string;
  connectHeaders?: Record<string, string>;
  reconnect?: ReconnectOptions;
  heartbeat?: HeartbeatOptions;
  onConnected: (api: StompSubscriptionApi) => void;
  onMessage: (frame: StompFrame) => void;
  onError?: (message: string) => void;
};

export type StompRealtimeConnection = {
  close: () => void;
};

const DEFAULT_RECONNECT: Required<ReconnectOptions> = {
  enabled: true,
  initialDelayMs: 1000,
  maxDelayMs: 15000,
  multiplier: 1.8,
  maxAttempts: Number.POSITIVE_INFINITY,
  jitterRatio: 0.2,
};

const DEFAULT_HEARTBEAT: Required<HeartbeatOptions> = {
  outgoingMs: 10000,
  staleTimeoutMs: 45000,
  staleCheckMs: 5000,
};

const buildWsUrl = (wsPath: string) => {
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  return `${protocol}://${window.location.host}${wsPath}`;
};

const parseStompFrame = (rawFrame: string): StompFrame | null => {
  const [head, ...bodyParts] = rawFrame.split("\n\n");
  const lines = head.split("\n").filter(Boolean);
  if (lines.length === 0) {
    return null;
  }

  const command = lines[0].trim();
  const headers: Record<string, string> = {};
  for (const line of lines.slice(1)) {
    const idx = line.indexOf(":");
    if (idx > 0) {
      headers[line.slice(0, idx)] = line.slice(idx + 1);
    }
  }

  return {
    command,
    headers,
    body: bodyParts.join("\n\n"),
  };
};

const applyJitter = (delayMs: number, jitterRatio: number) => {
  if (jitterRatio <= 0) {
    return delayMs;
  }
  const jitter = delayMs * jitterRatio;
  const delta = (Math.random() * jitter * 2) - jitter;
  return Math.max(0, Math.round(delayMs + delta));
};

export const createStompRealtimeConnection = ({
  wsPath = import.meta.env.VITE_WS_PATH || "/api/ws",
  connectHeaders,
  reconnect: reconnectOptions,
  heartbeat: heartbeatOptions,
  onConnected,
  onMessage,
  onError,
}: CreateStompRealtimeConnectionOptions): StompRealtimeConnection => {
  const reconnectConfig = { ...DEFAULT_RECONNECT, ...(reconnectOptions || {}) };
  const heartbeatConfig = { ...DEFAULT_HEARTBEAT, ...(heartbeatOptions || {}) };

  let socket: WebSocket | null = null;
  let manualClose = false;
  let connected = false;
  let reconnectAttempts = 0;
  let reconnectTimer: number | null = null;
  let heartbeatTimer: number | null = null;
  let staleTimer: number | null = null;
  let lastServerActivityAt = Date.now();
  let subscriptionCounter = 0;

  const clearTimers = () => {
    if (reconnectTimer != null) {
      window.clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (heartbeatTimer != null) {
      window.clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
    if (staleTimer != null) {
      window.clearInterval(staleTimer);
      staleTimer = null;
    }
  };

  const sendRaw = (frame: string) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(frame);
    }
  };

  const subscribe = (destination: string, id?: string) => {
    subscriptionCounter += 1;
    const subscriptionId = id || `sub-${subscriptionCounter}`;
    sendRaw(`SUBSCRIBE\nid:${subscriptionId}\ndestination:${destination}\n\n\0`);
  };

  const startHeartbeatWatchdog = () => {
    const heartbeatMs = Math.max(1000, heartbeatConfig.outgoingMs);
    const staleCheckMs = Math.max(1000, heartbeatConfig.staleCheckMs);
    heartbeatTimer = window.setInterval(() => {
      if (connected && socket?.readyState === WebSocket.OPEN) {
        // STOMP heartbeat frame
        socket.send("\n");
      }
    }, heartbeatMs);

    staleTimer = window.setInterval(() => {
      if (!connected || socket?.readyState !== WebSocket.OPEN) {
        return;
      }
      const idleMs = Date.now() - lastServerActivityAt;
      if (idleMs > heartbeatConfig.staleTimeoutMs) {
        onError?.("Realtime connection stale. Reconnecting...");
        try {
          socket.close();
        } catch {
          // ignore forced close errors
        }
      }
    }, staleCheckMs);
  };

  const scheduleReconnect = () => {
    if (manualClose || !reconnectConfig.enabled) {
      return;
    }
    if (reconnectAttempts >= reconnectConfig.maxAttempts) {
      onError?.("Realtime reconnect attempts exhausted");
      return;
    }

    const baseDelay = Math.min(
      reconnectConfig.maxDelayMs,
      reconnectConfig.initialDelayMs * Math.pow(reconnectConfig.multiplier, reconnectAttempts),
    );
    const nextDelay = applyJitter(baseDelay, reconnectConfig.jitterRatio);
    reconnectAttempts += 1;

    reconnectTimer = window.setTimeout(() => {
      connect();
    }, nextDelay);
  };

  const connect = () => {
    if (manualClose) {
      return;
    }

    clearTimers();
    connected = false;
    lastServerActivityAt = Date.now();

    try {
      socket = new WebSocket(buildWsUrl(wsPath));
    } catch {
      onError?.("Failed to initialize realtime socket");
      scheduleReconnect();
      return;
    }

    socket.onopen = () => {
      const headerLines = Object.entries(connectHeaders || {})
        .map(([key, value]) => `${key}:${value}`)
        .join("\n");
      const connectFrame =
        `CONNECT\naccept-version:1.2\nheart-beat:${heartbeatConfig.outgoingMs},${heartbeatConfig.outgoingMs}` +
        (headerLines ? `\n${headerLines}` : "") +
        "\n\n\0";
      sendRaw(connectFrame);
      startHeartbeatWatchdog();
    };

    socket.onmessage = (event) => {
      lastServerActivityAt = Date.now();
      const raw = String(event.data ?? "");

      // heartbeat frame can be newline-only
      if (raw.trim() === "") {
        return;
      }

      const chunks = raw.includes("\0") ? raw.split("\0").filter(Boolean) : [raw];
      for (const chunk of chunks) {
        const frame = parseStompFrame(chunk);
        if (!frame) {
          continue;
        }

        if (frame.command === "CONNECTED" && !connected) {
          connected = true;
          reconnectAttempts = 0;
          onConnected({ subscribe });
          continue;
        }

        if (frame.command === "ERROR") {
          onError?.("Realtime STOMP error frame received");
          continue;
        }

        if (frame.command === "MESSAGE") {
          onMessage(frame);
        }
      }
    };

    socket.onerror = () => {
      onError?.("Realtime connection error");
    };

    socket.onclose = () => {
      connected = false;
      clearTimers();
      scheduleReconnect();
    };
  };

  const onWindowOnline = () => {
    if (!manualClose && (!socket || socket.readyState >= WebSocket.CLOSING)) {
      connect();
    }
  };

  const onVisibilityChange = () => {
    if (document.visibilityState === "visible" && !manualClose && (!socket || socket.readyState >= WebSocket.CLOSING)) {
      connect();
    }
  };

  window.addEventListener("online", onWindowOnline);
  document.addEventListener("visibilitychange", onVisibilityChange);

  connect();

  return {
    close: () => {
      manualClose = true;
      clearTimers();
      window.removeEventListener("online", onWindowOnline);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      try {
        if (socket?.readyState === WebSocket.OPEN) {
          socket.send("DISCONNECT\n\n\0");
        }
      } catch {
        // ignore close path errors
      }
      socket?.close();
      socket = null;
    },
  };
};
