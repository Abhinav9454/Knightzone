import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import { liveChatApi } from "@/lib/api";
import type { LiveChatConversation, LiveChatSupportMessage } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const formatDate = (value?: string | null) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString();
};

const statusTone = (status: LiveChatConversation["status"]) => {
  if (status === "WAITING") return "text-amber-300 border-amber-400/40";
  if (status === "ACTIVE") return "text-emerald-300 border-emerald-400/40";
  return "text-muted-foreground border-muted/40";
};

export function LiveChatAdminPanel() {
  const { isAdmin } = useAuth();
  const [queue, setQueue] = useState<LiveChatConversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<LiveChatSupportMessage[]>([]);
  const [reply, setReply] = useState("");
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [assigningConversationId, setAssigningConversationId] = useState<number | null>(null);
  const [closingConversationId, setClosingConversationId] = useState<number | null>(null);

  const selectedConversation = useMemo(
    () => queue.find((conversation) => conversation.id === selectedConversationId) ?? null,
    [queue, selectedConversationId],
  );

  const loadQueue = useCallback(async () => {
    const data = await liveChatApi.getQueue();
    setQueue(data);
    setSelectedConversationId((prev) => {
      if (prev && data.some((conversation) => conversation.id === prev)) return prev;
      return data[0]?.id ?? null;
    });
  }, []);

  const loadMessages = useCallback(async (conversationId: number) => {
    const data = await liveChatApi.getMessages(conversationId);
    setMessages(data);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    let cancelled = false;
    const run = async () => {
      try {
        await loadQueue();
      } catch {
        if (!cancelled) toast.error("Failed to load live chat queue.");
      } finally {
        if (!cancelled) setLoadingQueue(false);
      }
    };
    void run();

    const timer = window.setInterval(() => {
      void loadQueue().catch(() => {
        // background poll best effort
      });
    }, 6000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [isAdmin, loadQueue]);

  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      return;
    }
    setLoadingMessages(true);

    let cancelled = false;
    const run = async () => {
      try {
        await loadMessages(selectedConversationId);
      } catch {
        if (!cancelled) toast.error("Failed to load conversation messages.");
      } finally {
        if (!cancelled) setLoadingMessages(false);
      }
    };
    void run();

    const timer = window.setInterval(() => {
      void loadMessages(selectedConversationId).catch(() => {
        // background poll best effort
      });
    }, 3500);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [selectedConversationId, loadMessages]);

  const assignConversation = async (conversationId: number) => {
    setAssigningConversationId(conversationId);
    try {
      await liveChatApi.assignConversation(conversationId);
      await loadQueue();
      await loadMessages(conversationId);
      toast.success("Conversation assigned.");
    } catch {
      toast.error("Failed to assign conversation.");
    } finally {
      setAssigningConversationId(null);
    }
  };

  const closeConversation = async (conversationId: number) => {
    setClosingConversationId(conversationId);
    try {
      await liveChatApi.closeConversation(conversationId);
      await loadQueue();
      await loadMessages(conversationId);
      toast.success("Conversation closed.");
    } catch {
      toast.error("Failed to close conversation.");
    } finally {
      setClosingConversationId(null);
    }
  };

  const sendReply = async () => {
    if (!selectedConversationId || !reply.trim()) return;
    setSending(true);
    try {
      await liveChatApi.sendMessage(selectedConversationId, { message: reply.trim() });
      setReply("");
      await loadMessages(selectedConversationId);
      await loadQueue();
    } catch {
      toast.error("Failed to send support reply.");
    } finally {
      setSending(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[320px_1fr]">
      <div className="glass-card border-primary/20 bg-gradient-to-br from-card to-primary/10 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Live Chat Queue</h3>
          <Badge variant="outline">{queue.length}</Badge>
        </div>

        {queue.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active live chats right now.</p>
        ) : (
          <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
            {queue.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                onClick={() => setSelectedConversationId(conversation.id)}
                className={`w-full rounded-lg border p-3 text-left transition ${
                  selectedConversationId === conversation.id
                    ? "border-primary/60 bg-primary/10"
                    : "border-border/60 bg-background/70 hover:border-primary/40"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">#{conversation.id}</p>
                  <Badge variant="outline" className={statusTone(conversation.status)}>
                    {conversation.status}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {conversation.requesterName} • {conversation.category || "General"}
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {conversation.summary || "No summary provided."}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Updated: {formatDate(conversation.lastMessageAt)}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="glass-card border-primary/20 bg-gradient-to-br from-card to-primary/10 p-4">
        {!selectedConversation ? (
          <p className="text-sm text-muted-foreground">Select a conversation from queue to manage live support.</p>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/70 bg-background/60 p-3">
              <div>
                <p className="text-sm font-semibold">
                  Ticket #{selectedConversation.id} • {selectedConversation.requesterName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedConversation.category || "General"} • Created {formatDate(selectedConversation.createdAt)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Agent: {selectedConversation.assignedAgentName || "Not assigned"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={assigningConversationId === selectedConversation.id || selectedConversation.status === "CLOSED"}
                  onClick={() => void assignConversation(selectedConversation.id)}
                >
                  {assigningConversationId === selectedConversation.id ? "Assigning..." : "Assign to Me"}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={closingConversationId === selectedConversation.id || selectedConversation.status === "CLOSED"}
                  onClick={() => void closeConversation(selectedConversation.id)}
                >
                  {closingConversationId === selectedConversation.id ? "Closing..." : "Close"}
                </Button>
              </div>
            </div>

            <div className="max-h-[360px] space-y-2 overflow-y-auto rounded-lg border border-border/70 bg-background/40 p-3">
              {messages.length === 0 ? (
                <p className="text-sm text-muted-foreground">No messages yet.</p>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderType === "USER" ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                        message.senderType === "USER"
                          ? "rounded-bl-md border border-border bg-card text-foreground"
                          : "rounded-br-md bg-primary text-primary-foreground"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{message.messageText}</p>
                      <p className={`mt-1 text-[10px] ${message.senderType === "USER" ? "text-muted-foreground" : "text-primary-foreground/80"}`}>
                        {message.senderName || message.senderType} • {formatDate(message.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <Input
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                placeholder={selectedConversation.status === "CLOSED" ? "Conversation closed" : "Type support reply..."}
                disabled={selectedConversation.status === "CLOSED"}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void sendReply();
                  }
                }}
              />
              <Button
                onClick={() => void sendReply()}
                disabled={sending || selectedConversation.status === "CLOSED" || !reply.trim()}
              >
                {sending ? "Sending..." : "Reply"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

