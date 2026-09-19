import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  RotateCcw,
  SendHorizontal,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import { chatApi, liveChatApi } from "@/lib/api";
import type { ChatMessage, LiveChatConversation, LiveChatSupportMessage } from "@/lib/types";

const STORAGE_SESSION_KEY = "chat_widget_session_id";
const STORAGE_MESSAGES_KEY = "chat_widget_messages";
const MAX_STORED_MESSAGES = 100;

const formatTime = (timestamp?: string) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const createSessionId = () => `session_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;

const persistSessionId = (sessionId: string) => {
  localStorage.setItem(STORAGE_SESSION_KEY, sessionId);
};

const getOrCreateSessionId = () => {
  const existing = localStorage.getItem(STORAGE_SESSION_KEY);
  if (existing && existing.trim()) return existing.trim();
  const created = createSessionId();
  persistSessionId(created);
  return created;
};

const parseStoredMessages = (): ChatMessage[] => {
  const raw = localStorage.getItem(STORAGE_MESSAGES_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as ChatMessage[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) =>
        item &&
        typeof item.text === "string" &&
        typeof item.timestamp === "string" &&
        (item.sender === "user" || item.sender === "bot"),
    );
  } catch {
    return [];
  }
};

const messageKey = (message: ChatMessage) => `${message.timestamp}-${message.text}`;

const localFallbackReply = (message: string) => {
  const text = message.toLowerCase();
  if (["hello", "hi", "hey", "namaste"].some((token) => text.includes(token))) {
    return "Hi! I am here to help. Ask me about contests, quizzes, profile, resume, teams, or placement.";
  }
  if (["contest", "coding"].some((token) => text.includes(token))) {
    return "Open Contests from the top menu, register for an event, then start solving problems.";
  }
  if (["quiz", "mcq"].some((token) => text.includes(token))) {
    return "Go to Quizzes, start an active quiz, and submit before the timer ends.";
  }
  if (["resume", "cv"].some((token) => text.includes(token))) {
    return "Use Resume Builder for templates and Resume Strength for score insights.";
  }
  if (["placement", "job", "career"].some((token) => text.includes(token))) {
    return "Placement Readiness shows topic mastery and company fit. Improve weak topics first.";
  }
  if (["profile", "avatar", "account"].some((token) => text.includes(token))) {
    return "You can update profile details, avatar, and settings from the Profile page.";
  }
  if (["team", "invite", "member"].some((token) => text.includes(token))) {
    return "Open Teams to create a team, invite members, and collaborate for contests.";
  }
  return "I am currently in offline assist mode. Please share exact page and issue text, and I will guide you step by step.";
};

const initialBotMessage = (text: string): ChatMessage => ({
  sender: "bot",
  text,
  timestamp: new Date().toISOString(),
});

const toChatUiMessage = (message: LiveChatSupportMessage): ChatMessage => ({
  sender: message.senderType === "USER" ? "user" : "bot",
  text: message.messageText,
  timestamp: message.createdAt,
});

const categories = ["General", "Login", "Contest", "Submission", "Billing", "Other"];

export function FloatingChatWidget() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"bot" | "live">("bot");

  const [botMessages, setBotMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [botTyping, setBotTyping] = useState(false);
  const [botStatus, setBotStatus] = useState<"live" | "fallback">("live");
  const [unreadCount, setUnreadCount] = useState(0);
  const [feedbackByMessage, setFeedbackByMessage] = useState<Record<string, 1 | -1>>({});
  const [sessionId, setSessionId] = useState(() => getOrCreateSessionId());

  const [liveConversations, setLiveConversations] = useState<LiveChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [liveMessages, setLiveMessages] = useState<LiveChatSupportMessage[]>([]);
  const [loadingLive, setLoadingLive] = useState(false);
  const [sendingLive, setSendingLive] = useState(false);
  const [creatingLive, setCreatingLive] = useState(false);
  const [liveCategory, setLiveCategory] = useState("General");
  const [liveSummary, setLiveSummary] = useState("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const quickPrompts = ["How to join contest?", "How to start quiz?", "How to edit profile?"];
  const liveChatAvailable = isAuthenticated;
  const activeConversation = useMemo(
    () => liveConversations.find((conversation) => conversation.id === activeConversationId) ?? null,
    [liveConversations, activeConversationId],
  );

  const uiMessages = useMemo(
    () => (mode === "bot" ? botMessages : liveMessages.map(toChatUiMessage)),
    [mode, botMessages, liveMessages],
  );
  const canShowQuickPrompts = mode === "bot" && botMessages.length <= 2 && !botTyping;

  const loadLiveConversations = useCallback(async () => {
    const list = await liveChatApi.getMyConversations();
    setLiveConversations(list);
    setActiveConversationId((prev) => {
      if (prev && list.some((conversation) => conversation.id === prev)) return prev;
      const preferred = list.find((conversation) => conversation.status !== "CLOSED") ?? list[0];
      return preferred?.id ?? null;
    });
  }, []);

  const loadLiveMessages = useCallback(async (conversationId: number) => {
    const messages = await liveChatApi.getMessages(conversationId);
    setLiveMessages(messages);
  }, []);

  useEffect(() => {
    const stored = parseStoredMessages();
    if (stored.length) {
      setBotMessages(stored);
      return;
    }
    setBotMessages([initialBotMessage("Hi! I am your support assistant. How can I help you today?")]);
  }, []);

  useEffect(() => {
    persistSessionId(sessionId);
  }, [sessionId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_MESSAGES_KEY, JSON.stringify(botMessages.slice(-MAX_STORED_MESSAGES)));
  }, [botMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [uiMessages, botTyping]);

  useEffect(() => {
    if (!isOpen || mode !== "bot") return;
    setUnreadCount(0);

    let cancelled = false;
    chatApi
      .getHistory(sessionId)
      .then((history) => {
        if (cancelled) return;
        setBotStatus("live");
        if (!history.length) return;
        setBotMessages(history.slice(-MAX_STORED_MESSAGES));
      })
      .catch(() => {
        if (!cancelled) setBotStatus("fallback");
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, mode, sessionId]);

  useEffect(() => {
    if (!isOpen || mode !== "live") return;
    if (!liveChatAvailable) {
      setLoadingLive(false);
      setLiveConversations([]);
      setActiveConversationId(null);
      setLiveMessages([]);
      return;
    }
    setUnreadCount(0);
    setLoadingLive(true);

    let cancelled = false;
    const run = async () => {
      try {
        await loadLiveConversations();
      } catch {
        if (!cancelled) toast.error("Unable to load live chat conversations.");
      } finally {
        if (!cancelled) setLoadingLive(false);
      }
    };
    void run();

    const timer = window.setInterval(() => {
      void loadLiveConversations().catch(() => {
        // background poll best effort
      });
    }, 6000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [isOpen, mode, liveChatAvailable, loadLiveConversations]);

  useEffect(() => {
    if (!isOpen || mode !== "live" || !activeConversationId || !liveChatAvailable) {
      if (mode === "live") {
        setLiveMessages([]);
      }
      return;
    }

    let cancelled = false;
    const run = async () => {
      try {
        await loadLiveMessages(activeConversationId);
      } catch {
        if (!cancelled) toast.error("Unable to load live chat messages.");
      }
    };
    void run();

    const timer = window.setInterval(() => {
      void loadLiveMessages(activeConversationId).catch(() => {
        // background poll best effort
      });
    }, 3500);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [isOpen, mode, activeConversationId, liveChatAvailable, loadLiveMessages]);

  const sendBotMessage = async (prefilled?: string) => {
    const trimmed = (prefilled ?? input).trim();
    if (!trimmed || botTyping) return;

    const userMessage: ChatMessage = {
      sender: "user",
      text: trimmed,
      timestamp: new Date().toISOString(),
    };
    setBotMessages((prev) => [...prev, userMessage]);
    setInput("");
    setBotTyping(true);

    const requestLiveReply = async () => {
      try {
        return await chatApi.sendMessage({ message: trimmed, sessionId });
      } catch {
        await new Promise((resolve) => window.setTimeout(resolve, 250));
        return chatApi.sendMessage({ message: trimmed, sessionId });
      }
    };

    try {
      const response = await requestLiveReply();
      const resolvedSessionId = response.sessionId?.trim() || sessionId;
      if (resolvedSessionId !== sessionId) {
        setSessionId(resolvedSessionId);
      }

      const responseTimestamp = response.timestamp || new Date().toISOString();
      setBotStatus("live");
      if (!isOpen) setUnreadCount((count) => count + 1);
      setBotMessages((prev) => [
        ...prev,
        { sender: "bot", text: response.reply, timestamp: responseTimestamp },
      ]);
    } catch {
      setBotStatus("fallback");
      if (!isOpen) setUnreadCount((count) => count + 1);
      setBotMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: localFallbackReply(trimmed),
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setBotTyping(false);
    }
  };

  const sendLiveMessage = async () => {
    if (!liveChatAvailable) {
      toast.info("Please sign in to use live support.");
      navigate("/login");
      return;
    }
    if (isConversationClosed) {
      toast.info("This conversation is closed. Start a new live ticket.");
      return;
    }

    const trimmed = input.trim();
    if (!activeConversationId || !trimmed || sendingLive) return;

    setSendingLive(true);
    try {
      await liveChatApi.sendMessage(activeConversationId, { message: trimmed });
      setInput("");
      await loadLiveMessages(activeConversationId);
      await loadLiveConversations();
    } catch {
      toast.error("Unable to send live chat message.");
    } finally {
      setSendingLive(false);
    }
  };

  const handleSend = async () => {
    if (mode === "bot") {
      await sendBotMessage();
      return;
    }
    await sendLiveMessage();
  };

  const handleFeedback = async (message: ChatMessage, rating: 1 | -1) => {
    const key = messageKey(message);
    if (feedbackByMessage[key]) return;
    setFeedbackByMessage((prev) => ({ ...prev, [key]: rating }));
    try {
      await chatApi.sendFeedback({ sessionId, rating });
    } catch {
      // ignore feedback failures
    }
  };

  const startNewBotChat = () => {
    const freshSessionId = createSessionId();
    const freshMessage = initialBotMessage("Fresh chat started. Tell me what you need help with.");
    setSessionId(freshSessionId);
    setBotMessages([freshMessage]);
    setBotStatus("live");
    setFeedbackByMessage({});
    setUnreadCount(0);
    localStorage.setItem(STORAGE_MESSAGES_KEY, JSON.stringify([freshMessage]));
    persistSessionId(freshSessionId);
    setInput("");
  };

  const startLiveConversation = async () => {
    if (!liveChatAvailable) {
      toast.info("Please sign in to start live support.");
      navigate("/login");
      return;
    }

    setCreatingLive(true);
    try {
      const created = await liveChatApi.createConversation({
        category: liveCategory,
        summary: liveSummary.trim() || undefined,
        sourcePage: window.location.pathname,
        priority: "NORMAL",
      });
      setLiveSummary("");
      await loadLiveConversations();
      setActiveConversationId(created.id);
      await loadLiveMessages(created.id);
      toast.success("Live support request created.");
    } catch {
      toast.error("Unable to start live support chat.");
    } finally {
      setCreatingLive(false);
    }
  };

  const closeActiveLiveConversation = async () => {
    if (!activeConversationId) return;
    try {
      await liveChatApi.closeConversation(activeConversationId);
      await loadLiveConversations();
      await loadLiveMessages(activeConversationId);
      toast.success("Conversation closed.");
    } catch {
      toast.error("Unable to close conversation.");
    }
  };

  const statusText = mode === "bot"
    ? (botStatus === "live" ? "Bot support online" : "Bot fallback mode")
    : (!liveChatAvailable
      ? "Sign in required for live support"
      : activeConversation?.status === "WAITING"
      ? "Live chat queued"
      : activeConversation?.status === "ACTIVE"
        ? `Connected${activeConversation.assignedAgentName ? `: ${activeConversation.assignedAgentName}` : ""}`
        : activeConversation?.status === "CLOSED"
          ? "Conversation closed"
          : "No active conversation");

  const isConversationClosed = activeConversation?.status === "CLOSED";
  const liveInputDisabled = !liveChatAvailable || !activeConversationId || isConversationClosed || sendingLive;
  const sendDisabled = mode === "bot" ? botTyping || !input.trim() : liveInputDisabled || !input.trim();

  return (
    <div className="fixed bottom-5 right-5 z-[1200]">
      {!isOpen ? (
        <div className="group relative">
          <div className="pointer-events-none absolute bottom-full right-0 mb-2 whitespace-nowrap rounded-full border border-border/80 bg-card/95 px-3 py-1 text-xs font-medium text-foreground opacity-0 shadow-sm backdrop-blur transition-all duration-200 group-hover:-translate-y-0.5 group-hover:opacity-100">
            <span className="mr-1" aria-hidden="true">💬</span>
            Live Chat
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-cyan-500 to-accent text-primary-foreground shadow-xl transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_35px_hsl(var(--primary)/0.45)] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
            aria-label="Open chat support"
          >
            <span className="pointer-events-none absolute inset-0 animate-ping rounded-2xl bg-primary/20 opacity-60" />
            <span className="relative text-xl leading-none" aria-hidden="true">🤖</span>
            <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/25" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-destructive px-1 text-center text-[10px] font-semibold text-destructive-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </div>
      ) : (
        <div className="mb-3 flex h-[min(82vh,680px)] max-h-[calc(100vh-2.5rem)] w-[min(92vw,420px)] animate-in slide-in-from-bottom-3 fade-in flex-col overflow-hidden rounded-3xl border border-border/70 bg-card/95 shadow-[0_20px_60px_hsl(222_47%_4%/0.65)] backdrop-blur-sm">
          <div className="relative overflow-hidden border-b border-white/10 bg-gradient-to-r from-primary/95 via-cyan-500/90 to-accent px-4 py-3 text-primary-foreground">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.3),transparent_40%)]" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-black/20">
                  <span className="text-base leading-none" aria-hidden="true">🤖</span>
                </div>
                <div>
                  <p className="font-semibold leading-tight">Knights Battle Zone Support</p>
                  <p className="text-[11px] text-primary-foreground/90">{statusText}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    if (mode === "bot") {
                      startNewBotChat();
                    } else {
                      setActiveConversationId(null);
                      setLiveMessages([]);
                    }
                  }}
                  className="rounded-lg p-1.5 transition hover:bg-black/15"
                  aria-label="Start a new chat"
                  title="Start new chat"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-1.5 transition hover:bg-black/15"
                  aria-label="Close chat"
                  title="Close chat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="border-b border-border/70 bg-muted/45 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                {mode === "bot"
                  ? "Ask bot about platform usage and quick guidance."
                  : "Create ticket, then chat with admin support team."}
              </p>
              <div className="inline-flex overflow-hidden rounded-lg border border-border/70 bg-background/70 p-0.5">
                <button
                  type="button"
                  className={`rounded-md px-2 py-1 text-xs font-medium transition ${mode === "bot" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                  onClick={() => setMode("bot")}
                >
                  Ask Bot
                </button>
                <button
                  type="button"
                  className={`rounded-md px-2 py-1 text-xs font-medium transition ${mode === "live" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                  onClick={() => setMode("live")}
                >
                  Live Chat
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-[radial-gradient(circle_at_top,_hsl(var(--primary)/0.1),_transparent_40%),hsl(var(--background))] p-3">
            {mode === "live" && !liveChatAvailable && (
              <div className="space-y-3 rounded-xl border border-border/70 bg-card/70 p-3 text-xs text-muted-foreground">
                <p>Live support requires login. Ask Bot works without login.</p>
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:brightness-110"
                >
                  Go to Login
                </button>
              </div>
            )}

            {mode === "live" && liveChatAvailable && (
              <div className="space-y-2 rounded-xl border border-border/70 bg-card/70 p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-muted-foreground">Live Support Ticket</p>
                  {activeConversation && activeConversation.status !== "CLOSED" && (
                    <button
                      type="button"
                      className="text-xs font-medium text-destructive hover:underline"
                      onClick={() => void closeActiveLiveConversation()}
                    >
                      Close
                    </button>
                  )}
                </div>

                {!activeConversationId ? (
                  <div className="space-y-2">
                    <select
                      className="h-9 w-full rounded-lg border border-border bg-background px-2 text-xs outline-none"
                      value={liveCategory}
                      onChange={(event) => setLiveCategory(event.target.value)}
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                    <textarea
                      rows={2}
                      value={liveSummary}
                      onChange={(event) => setLiveSummary(event.target.value)}
                      placeholder="Briefly describe your issue..."
                      className="w-full rounded-lg border border-border bg-background px-2 py-2 text-xs outline-none placeholder:text-muted-foreground"
                    />
                    <button
                      type="button"
                      className="w-full rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={creatingLive}
                      onClick={() => void startLiveConversation()}
                    >
                      {creatingLive ? "Creating..." : "Start Live Chat"}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Ticket #{activeConversationId} • {activeConversation?.status ?? "WAITING"}
                    </p>
                    <div className="max-h-20 overflow-y-auto rounded-lg border border-border/70 bg-background/70 p-1.5">
                      <div className="flex flex-wrap gap-1">
                        {liveConversations.slice(0, 8).map((conversation) => (
                          <button
                            key={conversation.id}
                            type="button"
                            onClick={() => setActiveConversationId(conversation.id)}
                            className={`rounded-full px-2 py-1 text-[11px] transition ${
                              conversation.id === activeConversationId
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/70"
                            }`}
                          >
                            #{conversation.id} {conversation.status.toLowerCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {mode === "live" && liveChatAvailable && !activeConversationId && (
              <p className="rounded-lg border border-dashed border-border/80 bg-card/60 p-3 text-center text-xs text-muted-foreground">
                Start a live ticket to begin chatting with support admin.
              </p>
            )}

            {uiMessages.map((msg, index) => (
              <div key={`${msg.timestamp}-${index}`} className={`flex gap-2 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                {msg.sender === "bot" && (
                  <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                    <span className="text-xs leading-none" aria-hidden="true">🤖</span>
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                    msg.sender === "user"
                      ? "rounded-br-md bg-gradient-to-br from-primary to-cyan-500 text-primary-foreground"
                      : "rounded-bl-md border border-border/80 bg-card text-foreground"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.text}</p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className={`text-[10px] ${msg.sender === "user" ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                      {formatTime(msg.timestamp)}
                    </p>
                    {mode === "bot" && msg.sender === "bot" && index === uiMessages.length - 1 && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          className={`rounded p-1 transition ${
                            feedbackByMessage[messageKey(msg)] === 1
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "text-muted-foreground hover:bg-muted"
                          }`}
                          onClick={() => void handleFeedback(msg, 1)}
                          aria-label="Helpful response"
                        >
                          <ThumbsUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          className={`rounded p-1 transition ${
                            feedbackByMessage[messageKey(msg)] === -1
                              ? "bg-destructive/15 text-destructive"
                              : "text-muted-foreground hover:bg-muted"
                          }`}
                          onClick={() => void handleFeedback(msg, -1)}
                          aria-label="Not helpful response"
                        >
                          <ThumbsDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {msg.sender === "user" && (
                  <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/30 text-accent-foreground">
                    U
                  </div>
                )}
              </div>
            ))}

            {canShowQuickPrompts && (
              <div className="flex flex-wrap gap-2 rounded-xl border border-border/70 bg-card/70 p-2.5">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary transition hover:-translate-y-0.5 hover:bg-primary/20"
                    onClick={() => void sendBotMessage(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {mode === "bot" && botTyping && (
              <div className="flex justify-start gap-2">
                <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                  <span className="text-xs leading-none" aria-hidden="true">🤖</span>
                </div>
                <div className="rounded-2xl rounded-bl-md border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.2s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.1s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
                    <span className="ml-1">Typing</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-border/70 bg-card/90 p-3">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background/65 px-2 py-1">
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    if (sendDisabled) return;
                    void handleSend();
                  }
                }}
                placeholder={mode === "bot"
                  ? "Type your message..."
                  : !liveChatAvailable
                    ? "Login required for live support..."
                    : isConversationClosed
                      ? "Conversation closed"
                    : activeConversationId
                    ? "Write message for support team..."
                    : "Create live ticket first..."}
                className="h-10 flex-1 bg-transparent px-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                disabled={mode === "live" && (!liveChatAvailable || !activeConversationId || isConversationClosed)}
              />
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={sendDisabled}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-cyan-500 text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
                aria-label="Send message"
              >
                <SendHorizontal className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1.5 px-1 text-[11px] text-muted-foreground">Press Enter to send</p>
          </div>
        </div>
      )}
    </div>
  );
}


