import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  Menu,
  X,
  Code2,
  Trophy,
  Users,
  LayoutDashboard,
  LogIn,
  UserPlus,
  LogOut,
  ShieldAlert,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { KnightLogo } from "./svg";

const navLinks = [
  { name: "Problems", path: "/problems", icon: Code2 },
  { name: "Contests", path: "/contests", icon: Trophy },
  { name: "Leaderboard", path: "/leaderboard", icon: Users },
  { name: "Arena", path: "/arena", icon: LayoutDashboard },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, role, isAdmin, isAuthenticated, logout } = useAuth();

  const closeMenu = () => setMenuOpen(false);

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
      isActive
        ? "bg-orange-500/10 text-orange-600 shadow-sm"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <nav className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
        {/* CREATIVE SVG LOGO */}
        <Link
          to="/"
          onClick={closeMenu}
          className="group flex shrink-0 items-center gap-3"
        >
          <div className="relative flex items-center justify-center">
            <KnightLogo className="h-10 w-10 transition-transform duration-300 group-hover:scale-110" animated />
          </div>

          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-950">
              KNIGHT<span className="text-orange-600">ZONE</span>
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Battle with code
            </p>
          </div>
        </Link>

        {/* DESKTOP NAVIGATION */}
        <div className="hidden items-center gap-1.5 lg:flex">
          <NavLink to="/" end className={linkClass}>
            Home
          </NavLink>

          {navLinks.map(({ name, path, icon: Icon }) => (
            <NavLink key={path} to={path} className={linkClass}>
              <Icon size={16} />
              {name}
            </NavLink>
          ))}
        </div>

        {/* DESKTOP AUTH BUTTONS & ROLE BADGES */}
        <div className="hidden items-center gap-3 sm:flex">
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 hover:border-slate-300"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white shadow-sm">
                  {(user?.name || user?.email || "K").charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold leading-tight text-slate-900">
                    {user?.name || user?.email?.split("@")[0]}
                  </span>
                  {/* Strict Admin / User Badge */}
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider ${
                      isAdmin ? "text-purple-600" : "text-emerald-600"
                    }`}
                  >
                    {isAdmin ? (
                      <>
                        <ShieldAlert size={10} />
                        ADMIN
                      </>
                    ) : (
                      <>
                        <UserIcon size={10} />
                        USER
                      </>
                    )}
                  </span>
                </div>
              </Link>
              <button
                onClick={logout}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
              >
                <LogOut size={14} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
              >
                <LogIn size={16} />
                Log in
              </Link>

              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-500/20 transition hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-100"
              >
                Get started
                <UserPlus size={16} />
              </Link>
            </>
          )}
        </div>

        {/* MOBILE MENU TOGGLE */}
        <div className="flex items-center gap-2 sm:hidden">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation menu"
            className="rounded-xl border border-slate-200 p-2.5 text-slate-700 transition hover:bg-slate-100"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* MOBILE DROPDOWN */}
      {menuOpen && (
        <div className="border-b border-slate-200 bg-white px-5 py-4 sm:hidden">
          <div className="flex flex-col gap-1">
            <NavLink to="/" end onClick={closeMenu} className={linkClass}>
              Home
            </NavLink>
            {navLinks.map(({ name, path, icon: Icon }) => (
              <NavLink key={path} to={path} onClick={closeMenu} className={linkClass}>
                <Icon size={16} />
                {name}
              </NavLink>
            ))}

            <div className="my-2 border-t border-slate-100" />

            {isAuthenticated ? (
              <div className="flex flex-col gap-2 pt-2">
                <Link
                  to="/dashboard"
                  onClick={closeMenu}
                  className="flex items-center justify-between rounded-xl bg-slate-100 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">
                      {(user?.name || user?.email || "K").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{user?.name || user?.email}</p>
                      <p className="text-xs font-semibold text-emerald-600">{role}</p>
                    </div>
                  </div>
                </Link>
                <button
                  onClick={() => {
                    logout();
                    closeMenu();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 py-2.5 text-sm font-bold text-rose-600"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-800"
                >
                  <LogIn size={16} />
                  Log in
                </Link>
                <Link
                  to="/register"
                  onClick={closeMenu}
                  className="flex items-center justify-center gap-2 rounded-xl bg-orange-500 py-2.5 text-sm font-bold text-white shadow-sm"
                >
                  <UserPlus size={16} />
                  Get started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}