import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  X,
  CheckCheck,
  Swords,
  Trophy,
  Flame,
  TrendingUp,
  ShieldCheck,
  Clock,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { notificationsApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const INITIAL_NOTIFICATIONS = [
  {
    id: "notif-1",
    type: "DUEL_INVITE",
    title: "1v1 Arena Duel Challenge",
    message: "Sneha Sharma (BITS Pilani) challenged you to a 10-minute dynamic programming duel!",
    timestamp: "3 minutes ago",
    read: false,
    actionUrl: "/arena",
    actionLabel: "Enter Arena Duel",
    badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  },
  {
    id: "notif-2",
    type: "CONTEST_ALERT",
    title: "All-India Knight Championship - Round 2",
    message: "Contest starts in 45 minutes. Proctoring checks and sandbox environments are now online.",
    timestamp: "20 minutes ago",
    read: false,
    actionUrl: "/contests/101",
    actionLabel: "View Contest Lobby",
    badgeColor: "text-[#c5ff55] bg-[#c5ff55]/10 border-[#c5ff55]/30",
  },
  {
    id: "notif-3",
    type: "STREAK_WARNING",
    title: "Daily Streak Warning 🔥",
    message: "Your 14-day solving streak will expire at midnight. Solve 1 problem or activate a Streak Freeze Shield to protect your rank.",
    timestamp: "2 hours ago",
    read: false,
    actionUrl: "/problems",
    actionLabel: "Solve Daily Problem",
    badgeColor: "text-rose-400 bg-rose-500/10 border-rose-500/30",
  },
  {
    id: "notif-4",
    type: "RATING_UPDATE",
    title: "Knight Rating Increased (+32 ELO)",
    message: "Congratulations! You defeated Arjun Mehta in the Fast Two-Pointers duel. New rating: 1642.",
    timestamp: "5 hours ago",
    read: true,
    actionUrl: "/profile",
    actionLabel: "View Rating Graph",
    badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  },
  {
    id: "notif-5",
    type: "PROCTORING_AUDIT",
    title: "Integrity Audit Cleared",
    message: "Your submission for Contest #101 was verified by AST Tokenizer Similarity engine. 0 integrity flags.",
    timestamp: "1 day ago",
    read: true,
    actionUrl: "/contests",
    actionLabel: "Contest Results",
    badgeColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
  },
];

export default function NotificationDrawer({ isOpen, onClose }) {
  const { user } = useAuth();
  const { isNight } = useTheme();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    if (user?.id) {
      notificationsApi
        .getNotifications(user.id)
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            const mapped = data.map((n) => ({
              id: "backend-" + n.id,
              type: "SYSTEM_ALERT",
              title: n.title || "Knightzone System Alert",
              message: n.message || n.content || "Notification update",
              timestamp: n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Recent",
              read: !!n.read,
              actionUrl: "/dashboard",
              actionLabel: "View Details",
              badgeColor: "text-[#c5ff55] bg-[#c5ff55]/10 border-[#c5ff55]/30",
            }));
            setNotifications((prev) => [...mapped, ...prev]);
          }
        })
        .catch(() => null);
    }
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const filtered = notifications.filter((n) => {
    if (filter === "ALL") return true;
    if (filter === "UNREAD") return !n.read;
    if (filter === "DUELS") return n.type === "DUEL_INVITE";
    if (filter === "CONTESTS") return n.type === "CONTEST_ALERT";
    return true;
  });

  const getIcon = (type) => {
    switch (type) {
      case "DUEL_INVITE":
        return <Swords size={16} className="text-amber-400" />;
      case "CONTEST_ALERT":
        return <Trophy size={16} className="text-[#c5ff55]" />;
      case "STREAK_WARNING":
        return <Flame size={16} className="text-rose-400" />;
      case "RATING_UPDATE":
        return <TrendingUp size={16} className="text-emerald-400" />;
      case "PROCTORING_AUDIT":
        return <ShieldCheck size={16} className="text-cyan-400" />;
      default:
        return <Bell size={16} className="text-white" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <aside
          aria-label="Notification center"
          className={`w-screen max-w-md shadow-2xl transition-all border-l ${
            isNight
              ? "bg-[#121610] border-white/10 text-[#e0e4dc]"
              : "bg-white border-slate-200 text-slate-800"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-[#c5ff55]/10 text-[#c5ff55]">
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Notifications Center</h3>
                <p className="text-[11px] text-[#788071]">
                  {unreadCount > 0 ? `${unreadCount} unread battle alerts` : "All caught up"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-[11px] font-bold text-[#c5ff55] hover:underline"
                  title="Mark all as read"
                >
                  <CheckCheck size={14} />
                  Mark Read
                </button>
              )}
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-[#788071] hover:bg-white/10 hover:text-white transition"
                aria-label="Close notifications drawer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex gap-1.5 border-b border-white/10 px-4 py-2.5 overflow-x-auto bg-black/20">
            {["ALL", "UNREAD", "DUELS", "CONTESTS"].map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-black tracking-wider transition shrink-0 ${
                  filter === t
                    ? "bg-[#c5ff55] text-[#14170f]"
                    : "text-[#788071] hover:text-white hover:bg-white/5"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Notification List */}
          <div className="h-[calc(100vh-130px)] overflow-y-auto p-4 space-y-3">
            {filtered.length === 0 ? (
              <div className="py-20 text-center">
                <Bell className="mx-auto text-[#788071]" size={36} />
                <p className="mt-3 font-bold text-white text-sm">No notifications found</p>
                <p className="mt-1 text-xs text-[#788071]">
                  You have cleared all alerts in this category.
                </p>
              </div>
            ) : (
              filtered.map((item) => (
                <div
                  key={item.id}
                  onClick={() => markAsRead(item.id)}
                  className={`relative rounded-2xl border p-4 transition cursor-pointer ${
                    item.read
                      ? "border-white/5 bg-black/20 opacity-75 hover:opacity-100"
                      : "border-[#c5ff55]/30 bg-[#c5ff55]/[0.04] shadow-sm hover:border-[#c5ff55]/50"
                  }`}
                >
                  {!item.read && (
                    <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-[#c5ff55] animate-pulse" />
                  )}

                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                      {getIcon(item.type)}
                    </div>

                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-md border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${item.badgeColor}`}>
                          {item.type.replace("_", " ")}
                        </span>
                        <span className="text-[10px] text-[#788071] flex items-center gap-1">
                          <Clock size={10} /> {item.timestamp}
                        </span>
                      </div>

                      <h4 className="mt-1.5 text-xs font-bold text-white leading-tight">
                        {item.title}
                      </h4>

                      <p className="mt-1 text-xs leading-relaxed text-[#aab1a1]">
                        {item.message}
                      </p>

                      {item.actionUrl && (
                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onClose();
                              navigate(item.actionUrl);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-[#c5ff55] hover:text-[#14170f] transition"
                          >
                            <span>{item.actionLabel}</span>
                            <ExternalLink size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
