import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  Menu,
  X,
  Swords,
  ChevronDown,
  Code2,
  Trophy,
  Users,
  LayoutDashboard,
  LogIn,
  UserPlus,
  LogOut,
  UserCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navLinks = [
  { name: "Problems", path: "/problems", icon: Code2 },
  { name: "Contests", path: "/contests", icon: Trophy },
  { name: "Leaderboard", path: "/leaderboard", icon: Users },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  const closeMenu = () => setMenuOpen(false);

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive
        ? "bg-orange-50 text-orange-600"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <nav className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
        {/* LOGO */}

        <Link
          to="/"
          onClick={closeMenu}
          className="group flex shrink-0 items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm transition group-hover:bg-orange-600">
            <Swords size={23} strokeWidth={2.3} />
          </div>

          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-slate-950">
              KNIGHT<span className="text-orange-600">ZONE</span>
            </h1>

            <p className="text-[10px] font-semibold uppercase tracking-[0.19em] text-slate-500">
              Battle with code
            </p>
          </div>
        </Link>

        {/* DESKTOP NAVIGATION */}

        <div className="hidden items-center gap-1 lg:flex">
          <NavLink to="/" end className={linkClass}>
            Home
          </NavLink>

          {navLinks.map(({ name, path, icon: Icon }) => (
            <NavLink key={path} to={path} className={linkClass}>
              <Icon size={16} />
              {name}
            </NavLink>
          ))}

          <NavLink to="/arena" className={linkClass}>
            <LayoutDashboard size={16} />
            Arena
          </NavLink>
        </div>

        {/* DESKTOP AUTH BUTTONS */}

        <div className="hidden items-center gap-3 sm:flex">
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3.5 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-200"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                  {(user?.name || user?.email || "K").charAt(0).toUpperCase()}
                </div>
                <span>{user?.name || user?.email?.split("@")[0]}</span>
              </Link>
              <button
                onClick={logout}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                <LogOut size={14} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
              >
                <LogIn size={16} />
                Log in
              </Link>

              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-100"
              >
                Get started
                <UserPlus size={16} />
              </Link>
            </>
          )}
        </div>

        {/* MOBILE MENU BUTTON */}

        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-100 lg:hidden"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* MOBILE NAVIGATION */}

      {menuOpen && (
        <div className="border-t border-slate-200 bg-white px-5 py-4 shadow-lg lg:hidden">
          <div className="mx-auto max-w-7xl space-y-1">
            <NavLink
              to="/"
              end
              onClick={closeMenu}
              className={linkClass}
            >
              Home
            </NavLink>

            {navLinks.map(({ name, path, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                onClick={closeMenu}
                className={linkClass}
              >
                <Icon size={17} />
                {name}
              </NavLink>
            ))}

            <NavLink
              to="/arena"
              onClick={closeMenu}
              className={linkClass}
            >
              <LayoutDashboard size={17} />
              Arena
            </NavLink>

            <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
              <Link
                to="/login"
                onClick={closeMenu}
                className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <LogIn size={16} />
                Log in
              </Link>

              <Link
                to="/register"
                onClick={closeMenu}
                className="flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-3 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
              >
                <UserPlus size={16} />
                Sign up
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}