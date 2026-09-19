import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Activity, Bell, Braces, Check, ChevronRight, CircleDollarSign, Crown, Flame, Gem, Moon, ShieldCheck, Sparkles, Sun, Swords, Target, Timer, Trophy, Users, Zap } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { contestApi, dashboardApi } from "@/lib/api";
import { connectLeaderboardRealtime } from "@/lib/leaderboardRealtime";
import { useRealtimeRefresh } from "@/lib/realtime";
import { connectSubmissionRealtime } from "@/lib/submissionRealtime";
import type { Contest, DashboardStats } from "@/lib/types";

const EMPTY_STATS: DashboardStats = { contestsParticipated: 0, problemsSolved: 0, currentRating: 0, globalRank: 0, upcomingContests: 0, recentSubmissions: [] };
const navigation = [{ label: "Arena", icon: Swords, href: "/contests" }, { label: "Duels", icon: Target, href: "/duels" }, { label: "Tournaments", icon: Trophy, href: "/contests" }, { label: "Practice", icon: Braces, href: "/problems" }, { label: "Clubs", icon: Users, href: "/clubs" }, { label: "Analytics", icon: Activity, href: "/tracker" }];
const clamp = (value: number, maximum = 100) => Math.max(0, Math.min(maximum, value));

export default function DashboardPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [contests, setContests] = useState<Contest[]>([]);
  const errorToastShown = useRef(false);
  const isSimpleShell = location.pathname.startsWith("/simple/");
  const appPath = (path: string) => isSimpleShell ? `/simple${path}` : path;

  const loadDashboard = useCallback(async () => {
    try {
      const [statsData, contestData] = await Promise.all([dashboardApi.getStats(), contestApi.getAll()]);
      setStats(statsData); setContests(contestData); errorToastShown.current = false;
    } catch {
      if (!errorToastShown.current) { toast.error("Command telemetry is temporarily offline."); errorToastShown.current = true; }
    }
  }, []);
  useRealtimeRefresh(loadDashboard, { intervalMs: 25000, maxIntervalMs: 120000, backoffMultiplier: 1.8, jitterRatio: 0.2, scope: "dashboard" });
  useEffect(() => { const connection = connectLeaderboardRealtime({ onUpdate: () => void loadDashboard() }); return () => connection.close(); }, [loadDashboard]);
  useEffect(() => { if (!user?.id) return undefined; const connection = connectSubmissionRealtime(user.id, { onUpdate: () => void loadDashboard() }); return () => connection.close(); }, [loadDashboard, user?.id]);

  const name = user?.name || "Knight";
  const firstName = name.split(" ")[0];
  const xpProgress = clamp(36 + Math.round(stats.problemsSolved / 2));
  const integrity = clamp(92 + Math.min(7, stats.contestsParticipated));
  const tournamentName = contests.find((contest) => contest.status === "UPCOMING")?.title || "Neon Knights Invitational";
  const rank = stats.globalRank || 842;
  const rating = stats.currentRating || 1480;
  const statCards = [
    { label: "Contests Won", value: Math.max(3, Math.floor(stats.contestsParticipated / 3)), icon: Trophy, tone: "gold" },
    { label: "Duels Won", value: Math.max(12, Math.floor(stats.problemsSolved / 4)), icon: Swords, tone: "blue" },
    { label: "Problems Solved", value: stats.problemsSolved, icon: Braces, tone: "purple" },
    { label: "Global Rank", value: `#${rank}`, icon: Crown, tone: "gold" },
    { label: "Win Streak", value: "7 days", icon: Flame, tone: "orange" },
    { label: "Integrity", value: `${integrity}%`, icon: ShieldCheck, tone: "green" },
  ];

  return <div className="kbz-dashboard">
    <section className="kbz-top-hud">
      <div className="kbz-player"><div className="kbz-avatar"><span>{name.slice(0, 2).toUpperCase()}</span><Crown /></div><div><p className="kbz-overline">GRANDMASTER PATH · LEVEL 11</p><strong>{name}</strong></div><div className="kbz-xp"><span><b>8,550</b> / 9,000 XP</span><div><i style={{ width: `${xpProgress}%` }} /></div></div></div>
      <div className="kbz-hud-actions"><span className="kbz-season"><Timer /> Season 04 · 18d 04h</span><span className="kbz-coins"><CircleDollarSign /> 2,480</span><button type="button" className="kbz-icon-button" aria-label="Notifications"><Bell /><i>3</i></button><button type="button" className="kbz-theme-toggle" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Toggle day and night mode">{theme === "dark" ? <Moon /> : <Sun />}<span>{theme === "dark" ? "Night" : "Day"}</span></button></div>
    </section>
    <div className="kbz-layout">
      <aside className="kbz-rail"><div className="kbz-brand"><div className="kbz-brand-mark"><Crown /></div><span>KNIGHTS<br /><b>BATTLE ZONE</b></span></div><nav aria-label="Battle zone navigation">{navigation.map(({ label, icon: Icon, href }, index) => <Link key={label} to={appPath(href)} className={index === 0 ? "active" : ""}><Icon /><span>{label}</span></Link>)}</nav><div className="kbz-rank-card"><span>YOUR RANK</span><strong>GOLD II</strong><p>1,480 rating</p><div className="kbz-rank-track"><i /></div><small>Next: Platinum III</small></div></aside>
      <main className="kbz-main">
        <section className="kbz-hero"><div className="kbz-hero-copy"><p className="kbz-overline"><Sparkles /> COMMAND DECK ONLINE</p><h1>Welcome back, {firstName}.<br /><em>The arena is calling.</em></h1><p>450 XP to Level 12. Your next victory unlocks the <b>Arcane Solver</b> title.</p><div><Link className="kbz-primary-action" to={appPath("/duels")}><Swords /> Enter Duel Lobby</Link><Link className="kbz-ghost-action" to={appPath("/contests")}>View arena <ChevronRight /></Link></div></div><div className="kbz-hero-emblem"><div><Crown /><span>GOLD<br />KNIGHT</span></div><small>SEASON RANK</small></div></section>
        <section className="kbz-stat-grid">{statCards.map(({ label, value, icon: Icon, tone }) => <article className={`kbz-stat kbz-${tone}`} key={label}><Icon /><div><span>{label}</span><strong>{value}</strong></div></article>)}</section>
        <section className="kbz-feature-grid">
          <article className="kbz-panel kbz-tournament"><div className="kbz-panel-heading"><span><Trophy /> LIVE TOURNAMENT</span><b>LIVE</b></div><h2>{tournamentName}</h2><p>Algorithmic warfare · Round 2 is open now</p><div className="kbz-tournament-footer"><div><span>Prize pool</span><strong>12,000 <Gem /></strong></div><div><span>Combatants</span><strong>328 / 500</strong></div><Link to={appPath("/contests")}>Join battle <ChevronRight /></Link></div></article>
          <article className="kbz-panel kbz-quests"><div className="kbz-panel-heading"><span><Target /> DAILY QUESTS</span><span>2 / 3</span></div>{[["Solve two medium problems", "complete"], ["Win a ranked duel", "complete"], ["Study graphs for 20 min", "pending"]].map(([quest, status]) => <div className="kbz-quest" key={quest}><i className={status}>{status === "complete" && <Check />}</i><span>{quest}</span>{status === "pending" && <small>+80 XP</small>}</div>)}</article>
          <article className="kbz-panel kbz-duel"><div className="kbz-panel-heading"><span><Swords /> NEXT DUEL</span><span>14:30 UTC</span></div><div className="kbz-versus"><div className="kbz-opponent kbz-you">{name.slice(0, 1)}<small>YOU</small></div><b>VS</b><div className="kbz-opponent">N<small>NovaByte</small></div></div><p>Best of 3 · Dynamic Programming</p></article>
        </section>
        <section className="kbz-analysis-grid"><article className="kbz-panel kbz-skill-tree"><div className="kbz-panel-heading"><span><Zap /> SKILL CONSTELLATION</span><Link to={appPath("/tracker")}>View map <ChevronRight /></Link></div><div className="kbz-tree"><div className="kbz-node unlocked">Arrays</div><div className="kbz-node unlocked">Graphs</div><div className="kbz-node current">DP</div><div className="kbz-node">Trees</div><div className="kbz-node">Greedy</div></div><div className="kbz-skill-legend"><span><i /> Unlocked</span><span><i /> In progress</span><span><i /> Locked</span></div></article><article className="kbz-panel kbz-performance"><div className="kbz-panel-heading"><span><Activity /> ARENA PERFORMANCE</span><span className="kbz-positive">+18.4%</span></div><div className="kbz-chart"><svg viewBox="0 0 500 180" role="img" aria-label="Rising performance graph"><defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop stopColor="currentColor" stopOpacity=".28" /><stop offset="1" stopColor="currentColor" stopOpacity="0" /></linearGradient></defs><path d="M0 156 C38 136 60 142 95 112 S144 130 179 99 S235 107 264 70 S320 84 351 51 S415 62 448 29 S480 40 500 12 V180 H0Z" fill="url(#chartFill)" /><path d="M0 156 C38 136 60 142 95 112 S144 130 179 99 S235 107 264 70 S320 84 351 51 S415 62 448 29 S480 40 500 12" fill="none" stroke="currentColor" strokeWidth="4" /></svg><div><span>MON</span><span>WED</span><span>FRI</span><span>SUN</span></div></div></article></section>
      </main>
      <aside className="kbz-rightbar">
        <article className="kbz-panel kbz-season-pass"><div className="kbz-panel-heading"><span><Crown /> SEASON PASS</span><small>Tier 24</small></div><div className="kbz-pass-art"><Crown /></div><strong>Silver Vanguard</strong><p>1,450 / 2,000 season XP</p><div className="kbz-progress"><i style={{ width: "72%" }} /></div><Link to={appPath("/store")}>View rewards <ChevronRight /></Link></article>
        <article className="kbz-panel kbz-leaderboard"><div className="kbz-panel-heading"><span><Crown /> ARENA LEADERS</span><Link to={appPath("/leaderboard")}>All</Link></div>{["CipherQueen", "ByteBishop", "DragonLoop", name, "CodeCrusader"].map((player, index) => <div className={`kbz-leader ${player === name ? "you" : ""}`} key={player}><b>0{index + 1}</b><i>{player.slice(0, 1)}</i><span>{player}</span><small>{[2850, 2720, 2640, rating, 2380][index]}</small></div>)}</article>
        <article className="kbz-panel kbz-activity"><div className="kbz-panel-heading"><span><Activity /> LIVE ACTIVITY</span><i /></div><p><b>NovaByte</b> defeated a Graphs duel <small>2m</small></p><p><b>RookRider</b> unlocked Silver tier <small>8m</small></p><p><b>CodeCrusader</b> joined the tournament <small>11m</small></p></article>
        <article className="kbz-panel kbz-submissions"><div className="kbz-panel-heading"><span><Braces /> RECENT RUNS</span><Link to={appPath("/submissions")}>All</Link></div>{stats.recentSubmissions.slice(0, 3).map((submission, index) => <div className="kbz-submission" key={`${submission.problemTitle}-${index}`}><i><Check /></i><span>{submission.problemTitle}</span><small>{submission.status}</small></div>) || <div className="kbz-submission"><i><Check /></i><span>Two Sum — Arena Drill</span><small>Accepted</small></div>}</article>
      </aside>
    </div>
  </div>;
}
