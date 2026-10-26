import { useState } from "react";
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
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { KnightLogo } from "./svg";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, role, isAdmin, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
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
              <h1 className="text-xl font-black tracking-tight text-slate-950">
                KNIGHT<span className="text-orange-600">ZONE</span>
              </h1>
              <span className="hidden sm:inline-flex items-center rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800 tracking-wider uppercase">
                Arena
              </span>
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
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
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2 text-xs font-bold text-slate-800 transition hover:bg-slate-100 hover:border-slate-300"
              >
                <LayoutDashboard size={14} className="text-[#183d34]" />
                Dashboard
              </Link>

              {/* Profile Pill */}
              <Link
                to="/profile"
                className="inline-flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-800 transition hover:bg-slate-50 hover:border-slate-300 shadow-sm"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#183d34] text-xs font-bold text-[#c5ff55]">
                  {(user?.name || user?.email || "K").charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold leading-tight text-slate-900">
                    {user?.name || user?.email?.split("@")[0]}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider ${
                      isAdmin ? "text-purple-600" : "text-emerald-600"
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
                        USER
                      </>
                    )}
                  </span>
                </div>
              </Link>

              {/* Logout Button */}
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
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
              >
                <LogIn size={15} />
                Log in
              </Link>

              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-orange-500/20 transition hover:bg-orange-600"
              >
                Get started
                <UserPlus size={15} />
              </Link>
            </>
          )}
        </div>

        {/* MOBILE MENU TOGGLE */}
        <div className="flex items-center gap-2 sm:hidden">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation menu"
            className="rounded-xl border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-100"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* MOBILE DROPDOWN */}
      {menuOpen && (
        <div className="border-t border-slate-200 bg-white px-5 py-4 shadow-lg sm:hidden">
          {isAuthenticated ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#183d34] text-sm font-bold text-[#c5ff55]">
                  {(user?.name || user?.email || "K").charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {user?.name || user?.email}
                  </p>
                  <p className="text-xs font-bold text-emerald-600 uppercase">
                    {role}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/dashboard"
                  onClick={closeMenu}
                  className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-800"
                >
                  <LayoutDashboard size={14} />
                  Dashboard
                </Link>
                <Link
                  to="/profile"
                  onClick={closeMenu}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-800"
                >
                  <UserIcon size={14} />
                  Profile
                </Link>
              </div>

              <button
                onClick={() => {
                  logout();
                  closeMenu();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 py-2.5 text-xs font-bold text-rose-600"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Link
                to="/login"
                onClick={closeMenu}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-800"
              >
                <LogIn size={15} />
                Log in
              </Link>
              <Link
                to="/register"
                onClick={closeMenu}
                className="flex items-center justify-center gap-2 rounded-xl bg-orange-500 py-2.5 text-xs font-bold text-white shadow-sm"
              >
                <UserPlus size={15} />
                Get started
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}