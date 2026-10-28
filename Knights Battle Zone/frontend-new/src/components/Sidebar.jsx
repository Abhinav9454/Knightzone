import { useState } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Code2,
  Trophy,
  Gamepad2,
  Medal,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  HelpCircle,
  Users,
  Briefcase,
  ShieldAlert,
  LogIn,
  X,
  Video,
  FileText,
  FileCheck,
  GraduationCap,
  GitPullRequest,
  Bot,
  LifeBuoy,
  ArrowRightLeft,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { KnightLogo } from "./svg";
import ThemeToggle from "./ThemeToggle";

// Regular Candidate & Student Navigation
const candidateNavigation = [
  {
    label: "OVERVIEW",
    items: [
      { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "COMPETE",
    items: [
      { name: "Problems", path: "/problems", icon: Code2 },
      { name: "Contests", path: "/contests", icon: Trophy },
      { name: "Arena", path: "/arena", icon: Gamepad2 },
      { name: "Leaderboard", path: "/leaderboard", icon: Medal },
      { name: "Inter-College", path: "/inter-college", icon: GraduationCap },
    ],
  },
  {
    label: "COMMUNITY & PRACTICE",
    items: [
      { name: "AI & Live Chat", path: "/chat", icon: Bot },
      { name: "Quizzes", path: "/quizzes", icon: HelpCircle },
      { name: "Clubs & Guilds", path: "/clubs", icon: Users },
      { name: "Contributions", path: "/contributions", icon: GitPullRequest },
    ],
  },
  {
    label: "CAREER & PREPARATION",
    items: [
      { name: "Careers & Jobs", path: "/jobs", icon: Briefcase },
      { name: "Mock Interviews", path: "/mock-interviews", icon: Video },
      { name: "Resume Builder", path: "/resume-builder", icon: FileText },
      { name: "ATS Resume Audit", path: "/resume-strength", icon: FileCheck },
      { name: "Knight Profile", path: "/profile", icon: UserCheck },
    ],
  },
];

// Exclusive Admin Console Navigation (Candidate clutter hidden)
const adminNavigation = [
  {
    label: "COMMAND CENTER",
    items: [
      { name: "Executive Overview", path: "/admin/overview", icon: LayoutDashboard },
    ],
  },
  {
    label: "COMPETITIONS & REPO",
    items: [
      { name: "Contest Studio", path: "/admin/contests", icon: Trophy },
      { name: "Problem Engineering", path: "/admin/problems", icon: Code2 },
      { name: "Quiz Engine", path: "/admin/quizzes", icon: HelpCircle },
    ],
  },
  {
    label: "INTEGRITY & PROCTORING",
    items: [
      { name: "Anti-Cheat & 3-Strike", path: "/admin/anti-cheat", icon: ShieldAlert },
      { name: "Knights & Roles", path: "/admin/users", icon: Users },
    ],
  },
  {
    label: "OPERATIONS & CAREERS",
    items: [
      { name: "Job Openings", path: "/admin/jobs", icon: Briefcase },
      { name: "Live Support Desk", path: "/admin/support", icon: LifeBuoy },
    ],
  },
];

const Sidebar = ({ mobileOpen = false, onClose = () => {} }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { user, role, isAdmin, adminMode, toggleAdminMode, isAuthenticated, logout } = useAuth();
  const { isNight } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // If user is Admin and adminMode is active: ONLY show admin tools, hide candidate stuff!
  const isDedicatedAdminView = isAdmin && adminMode !== false;
  const navGroups = isDedicatedAdminView ? adminNavigation : candidateNavigation;

  // Custom active matcher for smooth sub-routes and /admin fallback
  const isItemActive = (itemPath) => {
    const cur = location.pathname;
    if (itemPath === "/admin/overview") {
      return cur === "/admin" || cur === "/admin/" || cur === "/admin/overview";
    }
    if (itemPath === "/admin/anti-cheat") {
      return cur === "/admin/anti-cheat" || cur === "/admin/integrity";
    }
    if (cur === itemPath) return true;
    if (itemPath !== "/admin" && itemPath !== "/dashboard" && cur.startsWith(itemPath)) {
      return true;
    }
    return false;
  };

  return (
    <>
      {/* ==================== MOBILE BACKDROP ==================== */}
      {mobileOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* ==================== MOBILE SLIDE-OUT DRAWER (< lg) ==================== */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col transition-transform duration-300 ease-in-out lg:hidden ${
          isNight
            ? "border-r border-white/10 bg-[#121610] text-[#e0e4dc] shadow-2xl"
            : "border-r border-slate-200 bg-white text-slate-800 shadow-2xl"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Mobile Brand Header */}
        <div
          className={`flex h-16 shrink-0 items-center justify-between border-b px-4 ${
            isNight ? "border-white/10 bg-[#0e120c]" : "border-slate-200 bg-slate-50"
          }`}
        >
          <Link
            to={isDedicatedAdminView ? "/admin" : "/"}
            onClick={onClose}
            className="flex items-center gap-2.5"
          >
            <KnightLogo className="h-8 w-8" animated />
            <div>
              <p className={`text-sm font-black tracking-[0.13em] ${isNight ? "text-white" : "text-slate-900"}`}>
                KNIGHT
                <span className={isDedicatedAdminView ? "text-purple-400" : isNight ? "text-[#c5ff55]" : "text-emerald-600"}>
                  {isDedicatedAdminView ? "ADMIN" : "ZONE"}
                </span>
              </p>
              <p className={`text-[9px] font-bold uppercase tracking-[0.19em] ${
                isDedicatedAdminView ? "text-purple-300/80" : isNight ? "text-[#95a390]" : "text-slate-500"
              }`}>
                {isDedicatedAdminView ? "Enterprise Console" : "Think. Solve. Compete."}
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className={`flex h-9 w-9 items-center justify-center rounded-xl border transition ${
              isNight
                ? "border-white/10 text-[#c2cbbe] hover:bg-white/10 hover:text-white"
                : "border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Mobile Navigation Links */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-3 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="space-y-4">
            {navGroups.map((group) => (
              <div key={group.label}>
                <p
                  className={`px-3 text-[10px] font-black font-mono uppercase tracking-[0.2em] whitespace-nowrap ${
                    isDedicatedAdminView
                      ? "text-purple-400/90"
                      : isNight
                      ? "text-[#95a390]"
                      : "text-slate-500"
                  }`}
                >
                  {group.label}
                </p>

                <div className="mt-1.5 space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isItemActive(item.path);

                    return (
                      <NavLink
                        key={item.name}
                        to={item.path}
                        onClick={onClose}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold transition-all duration-200 ${
                          active
                            ? isDedicatedAdminView
                              ? "bg-purple-900/40 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-900/20"
                              : isNight
                              ? "bg-[#c5ff55]/15 text-[#c5ff55] border border-[#c5ff55]/30 shadow-sm shadow-[#c5ff55]/10"
                              : "bg-emerald-600 text-white border border-emerald-600 shadow-md shadow-emerald-500/20"
                            : isNight
                            ? "text-[#c2cbbe] hover:bg-white/10 hover:text-white"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        }`}
                      >
                        <Icon
                          size={17}
                          className={`shrink-0 ${
                            active
                              ? isDedicatedAdminView
                                ? "text-purple-300"
                                : isNight
                                ? "text-[#c5ff55]"
                                : "text-white"
                              : isNight
                              ? "text-[#c2cbbe]"
                              : "text-slate-500"
                          }`}
                        />
                        <span className="flex-1">{item.name}</span>
                        <ChevronRight
                          size={14}
                          className={
                            active
                              ? "opacity-80"
                              : isNight
                              ? "opacity-35 text-[#95a390]"
                              : "opacity-40 text-slate-400"
                          }
                        />
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* Mobile Theme Toggle */}
        <div
          className={`border-t px-4 py-2.5 flex items-center justify-between ${
            isNight ? "border-white/10 bg-black/30" : "border-slate-200 bg-slate-50"
          }`}
        >
          <span className={`text-xs font-mono font-bold ${isNight ? "text-[#c2cbbe]" : "text-slate-600"}`}>
            Day / Night Mode
          </span>
          <ThemeToggle showLabel />
        </div>

        {/* Mobile User Profile / Sign In Footer */}
        <div
          className={`border-t p-3 ${
            isNight ? "border-white/10 bg-[#0e120c]" : "border-slate-200 bg-slate-50"
          }`}
        >
          {isAuthenticated ? (
            <div className="space-y-2">
              <div
                className={`flex items-center gap-3 rounded-2xl border p-2.5 transition ${
                  isNight
                    ? "border-white/10 bg-white/5"
                    : "border-slate-200 bg-white shadow-xs"
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
                    isDedicatedAdminView
                      ? "bg-purple-600 text-white"
                      : isNight
                      ? "bg-[#c5ff55] text-[#14170f]"
                      : "bg-emerald-600 text-white"
                  }`}
                >
                  {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-xs font-bold ${isNight ? "text-white" : "text-slate-900"}`}>
                    {user?.name || user?.email?.split("@")[0]}
                  </p>
                  <span
                    className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md mt-0.5 ${
                      isAdmin
                        ? isNight
                          ? "bg-purple-900/40 text-purple-300 border border-purple-500/30"
                          : "bg-purple-100 text-purple-700 border border-purple-200"
                        : isNight
                        ? "bg-[#c5ff55]/15 text-[#c5ff55] border border-[#c5ff55]/30"
                        : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                    }`}
                  >
                    {isAdmin ? <ShieldCheck size={10} /> : <UserCheck size={10} />}
                    {isAdmin ? "ADMINISTRATOR" : role}
                  </span>
                </div>
              </div>

              {/* Admin View Mode Switcher */}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    toggleAdminMode();
                    if (isDedicatedAdminView) {
                      navigate("/dashboard");
                    } else {
                      navigate("/admin");
                    }
                    onClose();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 py-2 text-xs font-bold text-purple-300 transition hover:bg-purple-500/20"
                >
                  <ArrowRightLeft size={13} />
                  {isDedicatedAdminView ? "Switch to Candidate View" : "Return to Admin Console"}
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 py-2 text-xs font-bold text-rose-400 transition hover:bg-rose-500/20"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              onClick={onClose}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wider shadow-md transition w-full ${
                isNight
                  ? "bg-[#c5ff55] text-[#14170f] hover:bg-[#d5ff83]"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              <LogIn size={15} />
              Sign In to Battle
            </Link>
          )}
        </div>
      </aside>

      {/* ==================== DESKTOP COLLAPSIBLE SIDEBAR (lg+) ==================== */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col transition-all duration-300 ease-in-out lg:flex overflow-hidden ${
          isNight
            ? `border-r border-white/10 bg-[#11140f] text-[#e0e4dc] ${
                isHovered ? "w-64 shadow-2xl bg-[#141812]" : "w-[72px] shadow-sm"
              }`
            : `border-r border-slate-200 bg-white text-slate-800 ${
                isHovered ? "w-64 shadow-xl bg-white" : "w-[72px] shadow-sm"
              }`
        }`}
      >
        {/* Brand Header */}
        <Link
          to={isDedicatedAdminView ? "/admin" : "/"}
          className={`flex h-[72px] shrink-0 items-center border-b transition-all duration-300 ${
            isNight ? "border-white/10" : "border-slate-200"
          } ${isHovered ? "gap-3 px-5" : "justify-center px-2"}`}
        >
          <div className="shrink-0">
            <KnightLogo
              className="h-9 w-9 transition-transform duration-300 hover:scale-105"
              animated
            />
          </div>

          {isHovered && (
            <div className="overflow-hidden whitespace-nowrap transition-opacity duration-300">
              <p className={`text-[15px] font-black tracking-[0.13em] ${isNight ? "text-white" : "text-slate-900"}`}>
                KNIGHT
                <span className={isDedicatedAdminView ? "text-purple-400" : isNight ? "text-[#c5ff55]" : "text-emerald-600"}>
                  {isDedicatedAdminView ? "ADMIN" : "ZONE"}
                </span>
              </p>
              <p className={`text-[9px] font-bold uppercase tracking-[0.19em] ${
                isDedicatedAdminView ? "text-purple-300/80" : isNight ? "text-[#95a390]" : "text-slate-500"
              }`}>
                {isDedicatedAdminView ? "Enterprise Console" : "Think. Solve. Compete."}
              </p>
            </div>
          )}
        </Link>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="space-y-4">
            {navGroups.map((group) => (
              <div key={group.label}>
                {isHovered ? (
                  <p
                    className={`px-3 text-[10px] font-black font-mono uppercase tracking-[0.2em] whitespace-nowrap ${
                      isDedicatedAdminView
                        ? "text-purple-400/90"
                        : isNight
                        ? "text-[#95a390]"
                        : "text-slate-500"
                    }`}
                  >
                    {group.label}
                  </p>
                ) : (
                  <div className={`mx-auto my-1.5 h-px w-8 ${isNight ? "bg-white/15" : "bg-slate-200"}`} />
                )}

                <div className="mt-1.5 space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isItemActive(item.path);

                    return (
                      <NavLink
                        key={item.name}
                        to={item.path}
                        title={!isHovered ? item.name : undefined}
                        className={`flex items-center rounded-xl text-xs font-bold transition-all duration-200 ${
                          isHovered
                            ? `gap-3 px-3 py-2.5 ${
                                active
                                  ? isDedicatedAdminView
                                    ? "bg-purple-900/40 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-900/20 font-bold"
                                    : isNight
                                    ? "bg-[#c5ff55]/15 text-[#c5ff55] border border-[#c5ff55]/30 shadow-sm shadow-[#c5ff55]/10 font-bold"
                                    : "bg-emerald-600 text-white border border-emerald-600 shadow-md shadow-emerald-500/20 font-bold"
                                  : isNight
                                  ? "text-[#c2cbbe] hover:bg-white/10 hover:text-white"
                                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                              }`
                            : `h-11 w-11 justify-center mx-auto ${
                                active
                                  ? isDedicatedAdminView
                                    ? "bg-purple-900/40 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-900/20 font-bold"
                                    : isNight
                                    ? "bg-[#c5ff55]/15 text-[#c5ff55] border border-[#c5ff55]/30 shadow-sm shadow-[#c5ff55]/10 font-bold"
                                    : "bg-emerald-600 text-white border border-emerald-600 shadow-md shadow-emerald-500/20 font-bold"
                                  : isNight
                                  ? "text-[#c2cbbe] hover:bg-white/10 hover:text-white"
                                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                              }`
                        }`}
                      >
                        <Icon
                          size={isHovered ? 17 : 19}
                          className={`shrink-0 ${
                            active
                              ? isDedicatedAdminView
                                ? "text-purple-300"
                                : isNight
                                ? "text-[#c5ff55]"
                                : "text-white"
                              : isNight
                              ? "text-[#c2cbbe]"
                              : "text-slate-500"
                          }`}
                        />
                        {isHovered && (
                          <span className="overflow-hidden whitespace-nowrap">
                            {item.name}
                          </span>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* Desktop Theme Toggle */}
        <div
          className={`border-t p-2 flex items-center justify-center ${
            isNight ? "border-white/10" : "border-slate-200 bg-slate-50/60"
          }`}
        >
          <ThemeToggle
            showLabel={isHovered}
            className={isHovered ? "w-full justify-between px-3" : "h-10 w-10"}
          />
        </div>

        {/* Desktop User Status Card */}
        {isAuthenticated ? (
          <div
            className={`border-t p-2 ${
              isNight ? "border-white/10 bg-[#0e120c]/60" : "border-slate-200 bg-slate-50"
            }`}
          >
            {isHovered ? (
              <div className="space-y-2">
                <div
                  className={`flex items-center gap-3 rounded-2xl border p-2.5 transition ${
                    isNight
                      ? "border-white/10 bg-white/5"
                      : "border-slate-200 bg-white shadow-xs"
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
                      isDedicatedAdminView
                        ? "bg-purple-600 text-white"
                        : isNight
                        ? "bg-[#c5ff55] text-[#14170f]"
                        : "bg-emerald-600 text-white"
                    }`}
                  >
                    {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden whitespace-nowrap">
                    <p className={`truncate text-xs font-bold ${isNight ? "text-white" : "text-slate-900"}`}>
                      {user?.name || user?.email?.split("@")[0]}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                          isAdmin
                            ? isNight
                              ? "bg-purple-900/40 text-purple-300 border border-purple-500/30"
                              : "bg-purple-100 text-purple-700 border border-purple-200"
                            : isNight
                            ? "bg-[#c5ff55]/15 text-[#c5ff55] border border-[#c5ff55]/30"
                            : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {isAdmin ? <ShieldCheck size={10} /> : <UserCheck size={10} />}
                        {isAdmin ? "ADMINISTRATOR" : role}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Admin Mode Toggle */}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      toggleAdminMode();
                      if (isDedicatedAdminView) {
                        navigate("/dashboard");
                      } else {
                        navigate("/admin");
                      }
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 py-1.5 px-2 text-[11px] font-bold text-purple-300 transition hover:bg-purple-500/20"
                  >
                    <ArrowRightLeft size={13} />
                    <span>{isDedicatedAdminView ? "Switch to Candidate View" : "Return to Admin Console"}</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5">
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      toggleAdminMode();
                      if (isDedicatedAdminView) {
                        navigate("/dashboard");
                      } else {
                        navigate("/admin");
                      }
                    }}
                    title={isDedicatedAdminView ? "Switch to Candidate View" : "Return to Admin Console"}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition"
                  >
                    <ArrowRightLeft size={14} />
                  </button>
                )}

                <div
                  title={`${user?.name || "Knight"} (${isAdmin ? "ADMIN" : role})`}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl text-xs font-black transition shadow-sm ${
                    isDedicatedAdminView
                      ? "bg-purple-600 text-white"
                      : isNight
                      ? "bg-[#c5ff55] text-[#14170f]"
                      : "bg-emerald-600 text-white"
                  }`}
                >
                  {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div
            className={`border-t p-2 ${
              isNight ? "border-white/10 bg-[#0e120c]/60" : "border-slate-200 bg-slate-50"
            }`}
          >
            {isHovered ? (
              <Link
                to="/login"
                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wider transition shadow-md ${
                  isNight
                    ? "bg-[#c5ff55] text-[#14170f] hover:bg-[#d5ff83]"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
              >
                <LogIn size={14} />
                Sign In to Battle
              </Link>
            ) : (
              <Link
                to="/login"
                title="Sign In"
                className={`flex h-11 w-11 items-center justify-center mx-auto rounded-xl text-xs font-black transition shadow-md ${
                  isNight
                    ? "bg-[#c5ff55] text-[#14170f] hover:bg-[#d5ff83]"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
              >
                <LogIn size={16} />
              </Link>
            )}
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
