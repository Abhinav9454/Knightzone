
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
} from "lucide-react";
import Sidebar from "./Sidebar";

const links = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Problems", path: "/problems", icon: Code2 },
  { name: "Contests", path: "/contests", icon: Trophy },
  { name: "Arena", path: "/arena", icon: Gamepad2 },
  { name: "Leaderboard", path: "/leaderboard", icon: Medal },
];

const AppLayout = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Close the mobile menu whenever the route changes.
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="min-h-screen bg-[#f7f8f6] text-[#202722]">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile header */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-[#e4e5df] bg-[#fbfcf9]/95 px-4 backdrop-blur-lg lg:hidden">
        <Link
          to="/dashboard"
          onClick={closeMenu}
          className="flex items-center gap-2.5"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#183d34] text-[#c5ff55]">
            <Swords size={19} />
          </span>
          <span className="text-sm font-black tracking-[0.12em] text-[#252922]">
            KNIGHTZONE
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

      {/* Mobile navigation */}
      {menuOpen && (
        <>
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={closeMenu}
            className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          />

          <nav className="fixed inset-x-0 top-16 z-50 border-b border-[#e4e5df] bg-[#fbfcf9] p-4 shadow-xl lg:hidden">
            <p className="mb-3 px-3 text-[10px] font-bold tracking-[0.18em] text-[#92998f]">
              NAVIGATION
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
                      `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${
                        isActive
                          ? "bg-[#e8f2eb] text-[#183d34]"
                          : "text-[#70796f] hover:bg-[#f0f2ed]"
                      }`
                    }
                  >
                    <Icon size={18} />
                    <span className="flex-1">{item.name}</span>
                    {location.pathname === item.path && (
                      <ChevronRight size={16} />
                    )}
                  </NavLink>
                );
              })}
            </div>

            <Link
              to="/"
              onClick={closeMenu}
              className="mt-3 block border-t border-[#e4e5df] px-3 pt-4 text-sm font-medium text-[#70796f]"
            >
              Back to home
            </Link>
          </nav>
        </>
      )}

      {/* Page content */}
      <div className="min-h-screen pt-16 lg:ml-64 lg:pt-0">
        <Outlet />
      </div>
    </div>
  );
};

export default AppLayout;
