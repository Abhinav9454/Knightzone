import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { connectClubRealtime } from "@/lib/clubRealtime";
import type { ClubMessage, ClubUpdateEvent } from "@/lib/types";

interface ClubChatPanelProps {
  clubId: number;
  messages: ClubMessage[];
  onSend: (message: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  currentUserId?: number;
  canModerate?: boolean;
  onDeleteMessage?: (messageId: number) => Promise<void>;
  onMuteMember?: (memberUserId: number, minutes: number) => Promise<void>;
}

export function ClubChatPanel({
  clubId,
  messages,
  onSend,
  onRefresh,
  currentUserId,
  canModerate = false,
  onDeleteMessage,
  onMuteMember,
}: ClubChatPanelProps) {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [liveMessages, setLiveMessages] = useState<ClubMessage[]>([]);
  const [updates, setUpdates] = useState<ClubUpdateEvent[]>([]);

  useEffect(() => {
    setLiveMessages(messages);
  }, [messages]);

  useEffect(() => {
    const conn = connectClubRealtime(clubId, {
      onChat: (message) => {
        setLiveMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
      },
      onUpdate: (event) => {
        setUpdates((prev) => [event, ...prev].slice(0, 5));
        void onRefresh();
      },
    });

    return () => conn.close();
  }, [clubId, onRefresh]);

  const sortedMessages = useMemo(
    () => [...liveMessages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [liveMessages],
  );

  const send = async () => {
    const text = draft.trim();
    if (!text) return;
    setSending(true);
    try {
      await onSend(text);
      setDraft("");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="grid gap-3 lg:grid-cols-[1fr_280px]">
      <div className="rounded-xl border border-border/70 bg-card/70 p-4">
        <h2 className="text-lg font-semibold">Club Chat</h2>
        <div className="mt-3 max-h-[340px] space-y-2 overflow-y-auto rounded-lg border p-3">
          {sortedMessages.map((m) => (
            <article key={m.id} className="rounded-md bg-background/60 p-2 text-sm">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium">{m.senderName}</p>
                <div className="flex gap-1">
                  {(canModerate || currentUserId === m.senderId) && onDeleteMessage && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => void onDeleteMessage(m.id)}
                    >
                      Delete
                    </Button>
                  )}
                  {canModerate && currentUserId !== m.senderId && onMuteMember && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => void onMuteMember(m.senderId, 30)}
                    >
                      Mute 30m
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-muted-foreground">{m.message}</p>
              <p className="text-[11px] text-muted-foreground">{new Date(m.createdAt).toLocaleString()}</p>
            </article>
          ))}
          {sortedMessages.length === 0 && (
            <p className="text-sm text-muted-foreground">No messages yet. Start the conversation.</p>
          )}
        </div>

        <div className="mt-3 flex gap-2">
          <input
            aria-label="Chat message"
            className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void send();
              }
            }}
            placeholder="Type a club message"
          />
          <Button size="sm" disabled={sending} onClick={() => void send()}>
            {sending ? "Sending..." : "Send"}
          </Button>
        </div>
      </div>

      <aside className="rounded-xl border border-border/70 bg-card/70 p-4">
        <h3 className="font-semibold">Live Updates</h3>
        <div className="mt-3 space-y-2 text-sm">
          {updates.map((event, index) => (
            <div key={`${event.type}-${event.at}-${index}`} className="rounded-md border p-2">
              <p className="font-medium">{event.type}</p>
              <p className="text-muted-foreground">{event.message}</p>
            </div>
          ))}
          {updates.length === 0 && <p className="text-muted-foreground">Waiting for club activity...</p>}
        </div>
      </aside>
    </section>
  );
}
