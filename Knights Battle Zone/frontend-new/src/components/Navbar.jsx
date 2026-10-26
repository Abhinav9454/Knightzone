import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  LogIn,
  UserPlus,
  LogOut,
  ShieldAlert,
  User as UserIcon,
  LayoutDashboard,
  Code2,
  Trophy,
  Users,
  Keyboard,
  Briefcase,
  HelpCircle,
  ExternalLink,
  Bell,
  Check,
  CheckCheck,
  Sword,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { notificationsApi } from "../services/api";
import { KnightLogo } from "./svg";
import ThemeToggle from "./ThemeToggle";

const DEFAULT_NOTIFICATIONS = [
  {
    id: 1,
    title: "Battle Arena Sparring Ready",
    message: "AI Sparring Bot is online and ready for speed duels.",
    type: "ARENA",
    isRead: false,
    path: "/arena",
    timeAgo: "10m ago",
  },
  {
    id: 2,
    title: "Weekly Knight Grand Prix",
    message: "Weekend rated algorithmic tournament starts in 2 hours.",
    type: "CONTEST",
    isRead: false,
    path: "/contests",
    timeAgo: "45m ago",
  },
  {
    id: 3,
    title: "Career Drive Application",
    message: "Your application for SDE 1 has been submitted to hiring partner.",
    type: "JOB",
    isRead: true,
    path: "/jobs",
    timeAgo: "3h ago",
  },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS);

  const { user, role, isAdmin, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const notifRef = useRef(null);

  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      notificationsApi
        .getForUser(user.id)
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setNotifications(
              data.map((n) => ({
                id: n.id,
                title: n.type || "Knight Notification",
                message: n.message,
                type: n.type || "GENERAL",
                isRead: n.isRead || false,
                path: n.type === "JOB" ? "/jobs" : n.type === "ARENA" ? "/arena" : "/dashboard",
                timeAgo: "Recently",
              }))
            );
          }
        })
        .catch(() => null);
    }
  }, [isAuthenticated, user?.id]);

  // Click outside to close notification dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleNotificationClick = (notif) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
    );
    setNotifOpen(false);
    if (notif.path) navigate(notif.path);
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case "ARENA":
        return <Sword size={14} className="text-emerald-700" />;
      case "CONTEST":
        return <Trophy size={14} className="text-amber-600" />;
      case "JOB":
        return <Briefcase size={14} className="text-blue-600" />;
      default:
        return <Sparkles size={14} className="text-[#183d34]" />;
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#121610]/95 backdrop-blur-md">
      <nav className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
        {/* MAIN HEADING / BRAND LOGO */}
        <Link
          to="/"
          onClick={closeMenu}
          className="group flex shrink-0 items-center gap-3.5"
        >
          <div className="relative flex items-center justify-center">
            <KnightLogo
              className="h-10 w-10 transition-transform duration-300 group-hover:scale-110"
              animated
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-white">
                KNIGHT<span className="text-[#c5ff55]">ZONE</span>
              </h1>
              <span className="hidden sm:inline-flex items-center rounded-md bg-[#c5ff55]/10 border border-[#c5ff55]/30 px-2 py-0.5 text-[10px] font-black text-[#c5ff55] tracking-wider uppercase">
                Arena
              </span>
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#788874]">
              Battle with code
            </p>
          </div>
        </Link>

        {/* RIGHT SIDE ACTIONS & PROFILE */}
        <div className="hidden items-center gap-3 sm:flex">
          {isAuthenticated ? (
            <>
              {/* Dashboard Shortcut */}
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-white/10 hover:border-white/25"
              >
                <LayoutDashboard size={14} className="text-[#c5ff55]" />
                Dashboard
              </Link>

              {/* NOTIFICATION BELL WITH DROPDOWN */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  aria-label="Notifications"
                  className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-[#aab1a1] hover:text-white hover:bg-white/10 transition"
                >
                  <Bell size={16} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white ring-2 ring-[#121610] animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown Panel */}
                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-white/10 bg-[#161a14] p-4 shadow-2xl z-50">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white">
                          Notifications
                        </span>
                        {unreadCount > 0 && (
                          <span className="rounded-full bg-[#c5ff55]/10 border border-[#c5ff55]/30 px-2 py-0.5 text-[10px] font-bold text-[#c5ff55]">
                            {unreadCount} new
                          </span>
                        )}
                      </div>

                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[10px] font-bold text-[#c5ff55] hover:underline inline-flex items-center gap-1"
                        >
                          <CheckCheck size={12} /> Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto space-y-2 py-1">
                      {notifications.length === 0 ? (
                        <div className="py-6 text-center text-xs text-[#788874]">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`flex items-start gap-3 p-2.5 rounded-xl transition cursor-pointer border ${
                              notif.isRead
                                ? "bg-white/[0.02] border-white/5 hover:border-white/15 text-[#aab1a1]"
                                : "bg-[#c5ff55]/[0.05] border-[#c5ff55]/30 hover:bg-[#c5ff55]/10 text-white"
                            }`}
                          >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black/40 border border-white/10 mt-0.5">
                              {getNotifIcon(notif.type)}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-white truncate">
                                  {notif.title}
                                </h4>
                                <span className="text-[10px] text-[#788874] shrink-0 ml-1 font-mono">
                                  {notif.timeAgo}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#8f9d8a] line-clamp-2 mt-0.5 leading-snug">
                                {notif.message}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Pill */}
              <Link
                to="/profile"
                className="inline-flex items-center gap-2.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-white/10 hover:border-white/25 shadow-sm"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#c5ff55]/15 border border-[#c5ff55]/30 text-xs font-black text-[#c5ff55]">
                  {(user?.name || user?.email || "K").charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold leading-tight text-white">
                    {user?.name || user?.email?.split("@")[0]}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider ${
                      isAdmin ? "text-purple-400" : "text-[#c5ff55]"
                    }`}
                  >
                    {isAdmin ? (
                      <>
                        <ShieldAlert size={9} />
                        ADMIN
                      </>
                    ) : (
                      <>
                        <UserIcon size={9} />
                        KNIGHT
                      </>
                    )}
                  </span>
                </div>
              </Link>

              {/* Logout Button */}
              <button
                onClick={logout}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3.5 py-2 text-xs font-bold text-rose-400 transition hover:border-rose-500/40 hover:bg-rose-500/20"
              >
                <LogOut size={14} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-[#aab1a1] transition hover:bg-white/10 hover:text-white"
              >
                <LogIn size={15} />
                Log in
              </Link>

              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-[#c5ff55] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#14170f] shadow-md shadow-[#c5ff55]/20 transition hover:bg-[#d5ff83]"
              >
                Get started
                <UserPlus size={15} />
              </Link>
            </>
          )}

          {/* Global Day / Night Theme Toggle */}
          <ThemeToggle />
        </div>

        {/* MOBILE MENU TOGGLE */}
        <div className="flex items-center gap-2 sm:hidden">
          <ThemeToggle className="h-9 w-9" />

          {isAuthenticated && (
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-2 rounded-xl text-[#aab1a1] hover:bg-white/10"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-3.5 w-3.5 rounded-full bg-rose-500 text-[8px] font-black text-white flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation menu"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white transition hover:bg-white/10"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* MOBILE EXPANDED DRAWER */}
      {menuOpen && (
        <div className="border-b border-white/10 bg-[#121610] px-5 py-4 sm:hidden">
          <div className="flex flex-col gap-2">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={closeMenu}
                  className="flex items-center gap-3 rounded-xl bg-white/5 px-3.5 py-2.5 text-xs font-bold text-white hover:bg-white/10"
                >
                  <LayoutDashboard size={16} className="text-[#c5ff55]" />
                  Dashboard
                </Link>

                <Link
                  to="/profile"
                  onClick={closeMenu}
                  className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#aab1a1] hover:text-white hover:bg-white/5"
                >
                  <UserIcon size={16} />
                  My Knight Profile
                </Link>

                <button
                  onClick={() => {
                    closeMenu();
                    logout();
                  }}
                  className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold text-rose-400 hover:bg-rose-500/10"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 py-2.5 text-xs font-bold text-white hover:bg-white/10"
                >
                  <LogIn size={15} />
                  Log in
                </Link>

                <Link
                  to="/register"
                  onClick={closeMenu}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#c5ff55] py-2.5 text-xs font-black uppercase tracking-wider text-[#14170f] shadow-md shadow-[#c5ff55]/20 hover:bg-[#d5ff83]"
                >
                  <UserPlus size={15} />
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}