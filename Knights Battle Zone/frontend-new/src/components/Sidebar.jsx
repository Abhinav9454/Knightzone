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
  const { user, role, isAdmin, isAuthenticated, logout } = useAuth();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-[#e4e5df] bg-[#fbfcf9] text-[#252922] lg:flex">
      {/* Brand */}
      <Link
        to="/"
        className="flex h-[76px] shrink-0 items-center gap-3 border-b border-[#e4e5df] px-6 group"
      >
        <KnightLogo className="h-9 w-9 transition-transform duration-300 group-hover:scale-105" />

        <div>
          <p className="text-[15px] font-black tracking-[0.13em]">
            KNIGHT<span className="text-emerald-700">ZONE</span>
          </p>
          <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.19em] text-[#8b948a]">
            Think. Solve. Compete.
          </p>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-6">
        <div className="space-y-6">
          {navigation.map((group) => (
            <div key={group.label}>
              <p className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#8b948a]">
                {group.label}
              </p>

              <div className="mt-2 space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.name}
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                          isActive
                            ? "bg-[#183d34] text-[#c5ff55] shadow-sm shadow-[#183d34]/20"
                            : "text-[#555d53] hover:bg-[#f0f2ed] hover:text-[#252922]"
                        }`
                      }
                    >
                      <Icon size={17} />
                      {item.name}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* User Status Profile Card */}
      {isAuthenticated && (
        <Link
          to="/profile"
          className="mx-4 mb-3 block rounded-2xl border border-[#dfe4de] bg-white p-3 shadow-sm hover:border-[#183d34]/40 hover:shadow-md transition"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#183d34] text-xs font-bold text-[#c5ff55]">
              {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
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
          </div>
        </Link>
      )}

      {/* Footer links */}
      <div className="border-t border-[#e4e5df] p-4">
        <Link
          to="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-[#70796f] transition hover:bg-[#f0f2ed] hover:text-[#252922]"
        >
          <CircleHelp size={15} />
          Help & information
          <ChevronRight size={13} className="ml-auto" />
        </Link>

        {isAuthenticated && (
          <button
            onClick={logout}
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
          >
            <LogOut size={15} />
            Log out
          </button>
        )}

        <div className="mt-3 border-t border-[#e4e5df] pt-3">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            KNIGHTZONE · CONNECTED
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
