import { useState } from "react";
import { NavLink, Outlet, useLocation, Link } from "react-router-dom";
import {
  Menu,
  X,
  Swords,
  LayoutDashboard,
  Code2,
  Trophy,
  Gamepad2,
  Medal,
  ChevronRight,
  HelpCircle,
  Users,
  Keyboard,
  Briefcase,
  UserCheck,
} from "lucide-react";
import Sidebar from "./Sidebar";
import { KnightLogo } from "./svg";

const links = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Problems", path: "/problems", icon: Code2 },
  { name: "Contests", path: "/contests", icon: Trophy },
  { name: "Arena", path: "/arena", icon: Gamepad2 },
  { name: "Leaderboard", path: "/leaderboard", icon: Medal },
  { name: "Quizzes", path: "/quizzes", icon: HelpCircle },
  { name: "Clubs & Guilds", path: "/clubs", icon: Users },
  { name: "Speed Typing", path: "/typing", icon: Keyboard },
  { name: "Careers & Jobs", path: "/jobs", icon: Briefcase },
  { name: "Knight Profile", path: "/profile", icon: UserCheck },
];

const AppLayout = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Close the mobile menu whenever the route changes.
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="min-h-screen bg-[#f7f8f6] text-[#202722]">
      {/* Desktop collapsible hover sidebar */}
      <Sidebar />

      {/* Mobile header */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-[#e4e5df] bg-[#fbfcf9]/95 px-4 backdrop-blur-lg lg:hidden">
        <Link
          to="/dashboard"
          onClick={closeMenu}
          className="flex items-center gap-2.5"
        >
          <KnightLogo className="h-8 w-8" />
          <span className="text-sm font-black tracking-[0.12em] text-[#252922]">
            KNIGHT<span className="text-orange-600">ZONE</span>
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#dfe4de] text-[#34443a] transition hover:bg-[#edf2ec]"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile navigation drawer */}
      {menuOpen && (
        <>
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={closeMenu}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
          />

          <nav className="fixed inset-x-0 top-16 z-50 max-h-[calc(100vh-64px)] overflow-y-auto border-b border-[#e4e5df] bg-[#fbfcf9] p-4 shadow-xl lg:hidden">
            <p className="mb-3 px-3 text-[10px] font-bold tracking-[0.18em] text-[#92998f]">
              ARENA NAVIGATION
            </p>

            <div className="space-y-1">
              {links.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                        isActive
                          ? "bg-[#183d34] text-[#c5ff55] shadow-sm shadow-[#183d34]/20"
                          : "text-[#555d53] hover:bg-[#f0f2ed] hover:text-[#252922]"
                      }`
                    }
                  >
                    <Icon size={17} />
                    <span className="flex-1">{item.name}</span>
                    {location.pathname === item.path && (
                      <ChevronRight size={14} />
                    )}
                  </NavLink>
                );
              })}
            </div>

            <Link
              to="/"
              onClick={closeMenu}
              className="mt-4 block border-t border-[#e4e5df] px-3 pt-4 text-xs font-bold text-[#183d34]"
            >
              ← Back to homepage
            </Link>
          </nav>
        </>
      )}

      {/* Page content - with offset for compact desktop sidebar */}
      <div className="min-h-screen pt-16 lg:pl-[72px] lg:pt-0 transition-all duration-300">
        <Outlet />
      </div>
    </div>
  );
};

export default AppLayout;
