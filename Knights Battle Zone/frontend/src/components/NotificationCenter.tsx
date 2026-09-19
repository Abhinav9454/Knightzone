import { Bell, BellOff, CheckCheck, Trophy, UserRoundCheck, Swords, CalendarCheck2, Flag, ShieldAlert, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useMemo, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { useNotifications } from "@/contexts/NotificationContext";
import type { NotificationType } from "@/lib/types";

const typeLabels: Record<NotificationType, string> = {
  achievement_unlocked: "Achievement unlocked",
  friend_logged_in: "Friend logged in",
  match_found: "Multiplayer match found",
  daily_challenge: "Daily challenge reminder",
  tournament_starting: "Tournament starting soon",
  challenge_received: "Someone challenged you",
};

const typeIcons: Record<NotificationType, typeof Trophy> = {
  achievement_unlocked: Trophy,
  friend_logged_in: UserRoundCheck,
  match_found: Swords,
  daily_challenge: CalendarCheck2,
  tournament_starting: Flag,
  challenge_received: ShieldAlert,
};

const typeOrder: NotificationType[] = [
  "achievement_unlocked",
  "friend_logged_in",
  "match_found",
  "daily_challenge",
  "tournament_starting",
  "challenge_received",
];

export function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    preferences,
    markAsRead,
    markAllAsRead,
    clearHistory,
    setTypePreference,
  } = useNotifications();
  const [open, setOpen] = useState(false);

  const unreadText = useMemo(() => {
    if (unreadCount === 0) return "No unread notifications";
    if (unreadCount === 1) return "1 unread notification";
    return `${unreadCount} unread notifications`;
  }, [unreadCount]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notifications. ${unreadText}`}
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[11px] font-semibold text-destructive-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[370px] max-w-[92vw] p-0" align="end">
        <div className="border-b border-border p-3 flex items-center justify-between">
          <p className="font-semibold">Notification Center</p>
          <Badge variant="outline">{unreadText}</Badge>
        </div>

        <Tabs defaultValue="history">
          <div className="border-b border-border px-3 pt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="history" className="m-0">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={markAllAsRead}>
                <CheckCheck size={14} />
                Mark all read
              </Button>
              <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs text-muted-foreground" onClick={clearHistory}>
                <Trash2 size={14} />
                Clear
              </Button>
            </div>
            <ScrollArea className="h-[320px]">
              <div className="space-y-2 p-3">
                {notifications.map((notification) => {
                  const Icon = typeIcons[notification.type];
                  return (
                    <button
                      key={notification.id}
                      onClick={() => markAsRead(notification.id)}
                      className={`w-full rounded-lg border p-3 text-left transition ${
                        notification.read
                          ? "border-border bg-card/50"
                          : "border-primary/35 bg-primary/10"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="inline-flex items-center gap-2 text-sm font-semibold">
                          <Icon size={15} className="text-primary" />
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="mt-1 inline-block h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{notification.message}</p>
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </button>
                  );
                })}

                {notifications.length === 0 && (
                  <div className="rounded-lg border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
                    <BellOff size={16} className="mx-auto mb-2" />
                    No notifications yet.
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="preferences" className="m-0">
            <ScrollArea className="h-[352px]">
              <div className="space-y-2 p-3">
                {typeOrder.map((type) => (
                  <article key={type} className="rounded-lg border border-border bg-card/60 p-3">
                    <p className="text-sm font-semibold">{typeLabels[type]}</p>
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      <label className="flex items-center justify-between rounded-md border border-border px-2 py-1.5 text-xs">
                        <span>Enable</span>
                        <Switch
                          checked={preferences[type].enabled}
                          onCheckedChange={(value) => setTypePreference(type, { enabled: value })}
                          aria-label={`Enable ${typeLabels[type]} notifications`}
                        />
                      </label>
                      <label className="flex items-center justify-between rounded-md border border-border px-2 py-1.5 text-xs">
                        <span>Mute</span>
                        <Switch
                          checked={preferences[type].muted}
                          onCheckedChange={(value) => setTypePreference(type, { muted: value })}
                          aria-label={`Mute ${typeLabels[type]} notifications`}
                        />
                      </label>
                    </div>
                  </article>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
