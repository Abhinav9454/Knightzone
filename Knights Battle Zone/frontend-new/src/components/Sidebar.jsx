import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Code2,
  Trophy,
  Gamepad2,
  Medal,
  Settings,
  CircleHelp,
  ChevronRight,
  LogOut,
  ShieldCheck,
  UserCheck,
  HelpCircle,
  Users,
  Keyboard,
  Briefcase,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { KnightLogo } from "./svg";

const navigation = [
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
    ],
  },
  {
    label: "COMMUNITY & PRACTICE",
    items: [
      { name: "Quizzes", path: "/quizzes", icon: HelpCircle },
      { name: "Clubs & Guilds", path: "/clubs", icon: Users },
      { name: "Speed Typing", path: "/typing", icon: Keyboard },
    ],
  },
  {
    label: "CAREER & PROFILE",
    items: [
      { name: "Careers & Jobs", path: "/jobs", icon: Briefcase },
      { name: "Knight Profile", path: "/profile", icon: UserCheck },
    ],
  },
];

const Sidebar = () => {
  const [isHovered, setIsHovered] = useState(false);
  const { user, role, isAdmin, isAuthenticated, logout } = useAuth();

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-[#e4e5df] bg-[#fbfcf9] text-[#252922] transition-all duration-300 ease-in-out lg:flex ${
        isHovered ? "w-64 shadow-2xl bg-white" : "w-[72px] shadow-sm"
      }`}
    >
      {/* Brand Header */}
      <Link
        to="/"
        className={`flex h-[72px] shrink-0 items-center border-b border-[#e4e5df] transition-all duration-300 ${
          isHovered ? "gap-3 px-5" : "justify-center px-2"
        }`}
      >
        <div className="shrink-0">
          <KnightLogo
            className="h-9 w-9 transition-transform duration-300 hover:scale-105"
            animated
          />
        </div>

        {isHovered && (
          <div className="overflow-hidden whitespace-nowrap transition-opacity duration-300">
            <p className="text-[15px] font-black tracking-[0.13em] text-[#183d34]">
              KNIGHT<span className="text-orange-600">ZONE</span>
            </p>
            <p className="text-[9px] font-semibold uppercase tracking-[0.19em] text-[#8b948a]">
              Think. Solve. Compete.
            </p>
          </div>
        )}
      </Link>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2">
        <div className="space-y-5">
          {navigation.map((group) => (
            <div key={group.label}>
              {isHovered ? (
                <p className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#8b948a] whitespace-nowrap">
                  {group.label}
                </p>
              ) : (
                <div className="mx-auto my-1.5 h-px w-8 bg-[#e4e5df]" />
              )}

              <div className="mt-1.5 space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.name}
                      to={item.path}
                      title={!isHovered ? item.name : undefined}
                      className={({ isActive }) =>
                        `flex items-center rounded-xl text-xs font-semibold transition-all duration-200 ${
                          isHovered
                            ? `gap-3 px-3 py-2.5 ${
                                isActive
                                  ? "bg-[#183d34] text-[#c5ff55] shadow-sm shadow-[#183d34]/20"
                                  : "text-[#555d53] hover:bg-[#f0f2ed] hover:text-[#252922]"
                              }`
                            : `h-11 w-11 justify-center mx-auto ${
                                isActive
                                  ? "bg-[#183d34] text-[#c5ff55] shadow-sm"
                                  : "text-[#555d53] hover:bg-[#f0f2ed] hover:text-[#252922]"
                              }`
                        }`
                      }
                    >
                      <Icon size={isHovered ? 17 : 19} className="shrink-0" />
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

      {/* User Status Card */}
      {isAuthenticated && (
        <div className="border-t border-[#e4e5df] p-2">
          {isHovered ? (
            <Link
              to="/profile"
              className="flex items-center gap-3 rounded-2xl border border-[#dfe4de] bg-slate-50 p-2.5 transition hover:bg-slate-100 hover:border-[#183d34]/30"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#183d34] text-xs font-bold text-[#c5ff55]">
                {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1 overflow-hidden whitespace-nowrap">
                <p className="truncate text-xs font-bold text-[#202722]">
                  {user?.name || user?.email?.split("@")[0]}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                      isAdmin
                        ? "bg-purple-100 text-purple-700"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {isAdmin ? <ShieldCheck size={10} /> : <UserCheck size={10} />}
                    {role}
                  </span>
                </div>
              </div>
            </Link>
          ) : (
            <Link
              to="/profile"
              title={`${user?.name || "Knight"} (${role})`}
              className="flex h-11 w-11 items-center justify-center mx-auto rounded-xl bg-[#183d34] text-xs font-bold text-[#c5ff55] hover:opacity-90 transition shadow-sm"
            >
              {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
            </Link>
          )}
        </div>
      )}

      {/* Footer Links & Logout */}
      <div className="border-t border-[#e4e5df] p-2">
        <Link
          to="/"
          title={!isHovered ? "Help & information" : undefined}
          className={`flex items-center rounded-xl text-xs font-medium text-[#70796f] transition hover:bg-[#f0f2ed] hover:text-[#252922] ${
            isHovered
              ? "gap-3 px-3 py-2"
              : "h-10 w-10 justify-center mx-auto"
          }`}
        >
          <CircleHelp size={16} className="shrink-0" />
          {isHovered && (
            <>
              <span className="whitespace-nowrap">Help & info</span>
              <ChevronRight size={13} className="ml-auto" />
            </>
          )}
        </Link>

        {isAuthenticated && (
          <button
            onClick={logout}
            title={!isHovered ? "Log out" : undefined}
            className={`mt-1 flex w-full items-center rounded-xl text-xs font-semibold text-rose-600 transition hover:bg-rose-50 ${
              isHovered
                ? "gap-3 px-3 py-2"
                : "h-10 w-10 justify-center mx-auto"
            }`}
          >
            <LogOut size={16} className="shrink-0" />
            {isHovered && <span className="whitespace-nowrap">Log out</span>}
          </button>
        )}

        {isHovered && (
          <div className="mt-2 border-t border-[#e4e5df] pt-2 px-1">
            <p className="flex items-center gap-1.5 text-[9px] font-semibold text-emerald-700 whitespace-nowrap">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              KNIGHTZONE · LIVE
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
