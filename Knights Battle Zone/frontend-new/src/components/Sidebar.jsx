
import { NavLink, Link } from "react-router-dom";
import {
  Swords,
  LayoutDashboard,
  Code2,
  Trophy,
  Gamepad2,
  Medal,
  Settings,
  CircleHelp,
  ArrowUpRight,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

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
];

const Sidebar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-[#e4e5df] bg-[#fbfcf9] text-[#252922] lg:flex">
      {/* Brand */}
      <Link
        to="/"
        className="flex h-[76px] shrink-0 items-center gap-3 border-b border-[#e4e5df] px-6"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#183d34] text-[#c5ff55]">
          <Swords size={20} strokeWidth={2.2} />
        </div>

        <div>
          <p className="text-[15px] font-black tracking-[0.13em]">
            KNIGHTZONE
          </p>
          <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.19em] text-[#8b948a]">
            Think. Solve. Compete.
          </p>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-6">
        {navigation.map((section) => (
          <div key={section.label} className="mb-7">
            <p className="mb-3 px-3 text-[9px] font-bold tracking-[0.18em] text-[#92998f]">
              {section.label}
            </p>

            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition ${
                        isActive
                          ? "bg-[#e8f2eb] text-[#183d34]"
                          : "text-[#70796f] hover:bg-[#f0f2ed] hover:text-[#252922]"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          size={17}
                          strokeWidth={isActive ? 2.2 : 1.8}
                        />
                        <span className="flex-1">{item.name}</span>
                        {isActive && (
                          <span className="h-1.5 w-1.5 rounded-full bg-[#13836d]" />
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Practice reminder */}
      <div className="mx-4 mb-4 rounded-xl border border-[#dfe4de] bg-white p-4">
        <div className="flex items-center gap-2 text-[#13836d]">
          <Code2 size={16} />
          <span className="text-[11px] font-bold">Daily practice</span>
        </div>

        <p className="mt-2 text-xs leading-5 text-[#727b71]">
          Consistency beats intensity. Solve one problem at a time.
        </p>

        <Link
          to="/problems"
          className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#183d34] hover:text-[#13836d]"
        >
          Open problems <ArrowUpRight size={13} />
        </Link>
      </div>

      {/* Footer links */}
      <div className="border-t border-[#e4e5df] p-4">
        <Link
          to="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium text-[#70796f] transition hover:bg-[#f0f2ed] hover:text-[#252922]"
        >
          <CircleHelp size={16} />
          Help & information
          <ChevronRight size={14} className="ml-auto" />
        </Link>

        <Link
          to="/dashboard"
          className="mt-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium text-[#70796f] transition hover:bg-[#f0f2ed] hover:text-[#252922]"
        >
          <Settings size={16} />
          Workspace
          <ChevronRight size={14} className="ml-auto" />
        </Link>

        {isAuthenticated && (
          <button
            onClick={logout}
            className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
          >
            <LogOut size={16} />
            Log out ({user?.name || user?.email?.split("@")[0] || "User"})
          </button>
        )}

        <div className="mt-3 border-t border-[#e4e5df] pt-4">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            KNIGHTZONE · LIVE BACKEND
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
