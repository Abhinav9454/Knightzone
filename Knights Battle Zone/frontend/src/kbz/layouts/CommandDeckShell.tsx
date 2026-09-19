import { useState } from "react";
import { Bell, CircleDollarSign, Crown, Moon, PanelRight, Swords, Sun, Trophy, Users, ChartNoAxesCombined, BriefcaseBusiness, Store, X } from "lucide-react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

type CommandDeckShellProps = { routePrefix?: string };

const navigation = [
  { label: "Arena", icon: Trophy, href: "/contests" },
  { label: "Duel", icon: Swords, href: "/duels" },
  { label: "Rank", icon: Crown, href: "/leaderboard" },
  { label: "Stats", icon: ChartNoAxesCombined, href: "/tracker" },
  { label: "Clubs", icon: Users, href: "/clubs" },
  { label: "Career", icon: BriefcaseBusiness, href: "/placement" },
  { label: "Store", icon: Store, href: "/marketplace" },
];

export function CommandDeckShell({ routePrefix = "" }: CommandDeckShellProps) {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activityOpen, setActivityOpen] = useState(false);
  const initials = (user?.name || "Knight").slice(0, 2).toUpperCase();

  return <div className="command-shell">
    <header className="command-hud">
      <button type="button" className="command-theme" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Toggle theme">{theme === "dark" ? <Moon /> : <Sun />}<span>{theme === "dark" ? "Night" : "Day"}</span></button>
      <div className="command-title"><Crown /><span>KBZ</span><strong>COMMAND DECK</strong></div>
      <div className="command-actions"><span className="command-coins"><CircleDollarSign />2,480</span><button type="button" aria-label="Notifications"><Bell /><i>3</i></button><button type="button" className="command-avatar" onClick={() => navigate(routePrefix + "/profile")} aria-label="Open profile">{initials}</button><button type="button" onClick={() => setActivityOpen(true)} aria-label="Open activity feed"><PanelRight /></button></div>
    </header>
    <main className="command-content"><Outlet /></main>
    <nav className="command-bottom-nav" aria-label="Primary navigation">{navigation.map(({ label, icon: Icon, href }) => { const target = routePrefix + href; const active = location.pathname === target || location.pathname.startsWith(target + "/"); return <button type="button" className={active ? "active" : ""} onClick={() => navigate(target)} key={label}><Icon /><span>{label}</span></button>; })}</nav>
    <div className={"command-drawer-backdrop " + (activityOpen ? "open" : "")} onClick={() => setActivityOpen(false)} />
    <aside className={"command-activity-drawer " + (activityOpen ? "open" : "")}><div><span><PanelRight /> BATTLE FEED</span><button type="button" onClick={() => setActivityOpen(false)} aria-label="Close activity feed"><X /></button></div><p><b>NovaByte</b> won a Graphs duel <small>2m</small></p><p><b>RookRider</b> claimed a season chest <small>7m</small></p><p><b>CodeCrusader</b> entered the Arena <small>12m</small></p><section><span>FRIENDS ONLINE</span><strong>12 knights ready</strong><button type="button" onClick={() => navigate(routePrefix + "/clubs")}>Open party finder</button></section></aside>
  </div>;
}
