import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Brain,
  CalendarClock,
  CheckCircle2,
  DatabaseZap,
  GitBranch,
  History,
  Link2,
  RefreshCw,
  Rocket,
  Target,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { trackerApi } from "@/lib/api";
import type {
  TrackerConnection,
  TrackerPerformanceReport,
  TrackerPlatform,
  TrackerSyncResult,
} from "@/lib/types";
import { useRealtimeRefresh } from "@/lib/realtime";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type TrackerWorkspace = "hub" | "setup" | "overview" | "insights" | "history";

type WorkspaceCard = {
  id: Exclude<TrackerWorkspace, "hub">;
  title: string;
  description: string;
  icon: LucideIcon;
  actionLabel: string;
};

const PLATFORMS: TrackerPlatform[] = ["LEETCODE", "CODEFORCES", "GITHUB"];
const TARGET_ROLES = ["SDE", "Backend Engineer", "Frontend Engineer", "Competitive Programmer", "Data Engineer"];

const WORKSPACE_CARDS: WorkspaceCard[] = [
  {
    id: "setup",
    title: "Setup Connections",
    description: "Add usernames, connect platforms, and trigger sync from one clean place.",
    icon: Link2,
    actionLabel: "Open setup",
  },
  {
    id: "overview",
    title: "Overview Dashboard",
    description: "See totals, streak, platform mix, and your current pace without noise.",
    icon: BarChart3,
    actionLabel: "Open overview",
  },
  {
    id: "insights",
    title: "Skill Insights",
    description: "Check weak topics, role fit, and weekly recommendations in focused cards.",
    icon: Brain,
    actionLabel: "Open insights",
  },
  {
    id: "history",
    title: "History & Repos",
    description: "Review solved problems, GitHub repos, and latest sync activity clearly.",
    icon: History,
    actionLabel: "Open history",
  },
];

const platformHelp: Record<TrackerPlatform, string> = {
  LEETCODE: "LeetCode username",
  CODEFORCES: "Codeforces handle",
  GITHUB: "GitHub username",
};

const getTrackerBasePath = (pathname: string) =>
  pathname.startsWith("/simple/") ? "/simple/tracker" : "/tracker";

const getWorkspaceFromPath = (pathname: string): TrackerWorkspace => {
  const segments = pathname.toLowerCase().split("/").filter(Boolean);
  const trackerIndex = segments.lastIndexOf("tracker");
  const nextSegment = trackerIndex >= 0 ? segments[trackerIndex + 1] : "";

  if (nextSegment === "setup" || nextSegment === "overview" || nextSegment === "insights" || nextSegment === "history") {
    return nextSegment;
  }

  return "hub";
};

const formatDate = (value?: string | null) => {
  if (!value) return "N/A";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "N/A" : parsed.toLocaleDateString();
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "N/A";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "N/A" : parsed.toLocaleString();
};

const toSafeEntries = (record?: Record<string, number>) => Object.entries(record || {});

const toErrorMessage = (reason: unknown, fallback: string) => {
  if (!reason || typeof reason !== "object") return fallback;
  const maybeError = reason as {
    response?: { data?: { message?: string; error?: string } };
    message?: string;
  };
  return maybeError.response?.data?.message || maybeError.response?.data?.error || maybeError.message || fallback;
};

function WorkspaceLinkCard({
  title,
  description,
  icon: Icon,
  href,
  actionLabel,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  actionLabel: string;
}) {
  return (
    <Link
      to={href}
      className="group block rounded-[1.5rem] border border-border/70 bg-card/80 p-5 shadow-[0_16px_40px_hsl(var(--foreground)/0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_24px_60px_hsl(var(--primary)/0.12)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="rounded-2xl bg-primary/10 p-3 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
      </div>
      <h3 className="mt-5 text-xl font-bold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
        {actionLabel}
      </div>
    </Link>
  );
}

function SimpleStatCard({
  label,
  value,
  note,
  icon: Icon,
  href,
}: {
  label: string;
  value: string | number;
  note: string;
  icon: LucideIcon;
  href?: string;
}) {
  const content = (
    <div className="rounded-[1.35rem] border border-border/70 bg-card/80 p-4 shadow-[0_12px_30px_hsl(var(--foreground)/0.05)] transition-all duration-300 hover:border-primary/30 hover:shadow-[0_18px_40px_hsl(var(--primary)/0.10)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className="mt-4 text-3xl font-black text-foreground">{value}</p>
      <p className="mt-2 text-xs text-muted-foreground">{note}</p>
    </div>
  );

  if (href) {
    return <Link to={href} className="block hover:-translate-y-0.5 transition-transform">{content}</Link>;
  }

  return content;
}

export default function TrackerPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const basePath = getTrackerBasePath(location.pathname);
  const workspace = getWorkspaceFromPath(location.pathname);

  const [connections, setConnections] = useState<TrackerConnection[]>([]);
  const [report, setReport] = useState<TrackerPerformanceReport | null>(null);
  const [syncLog, setSyncLog] = useState<TrackerSyncResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [platform, setPlatform] = useState<TrackerPlatform>("LEETCODE");
  const [username, setUsername] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [targetRole, setTargetRole] = useState("SDE");
  const [useAiReport, setUseAiReport] = useState(false);
  const hasLoadErrorToast = useRef(false);

  const workspacePath = useCallback(
    (next: TrackerWorkspace) => (next === "hub" ? basePath : `${basePath}/${next}`),
    [basePath],
  );

  const loadData = useCallback(async (role = targetRole, useAi = useAiReport) => {
    setLoading(true);
    try {
      const [connectionsResult, reportResult] = await Promise.allSettled([
        trackerApi.getConnections(),
        trackerApi.getReport(role, useAi),
      ]);

      let errorMessage: string | null = null;

      if (connectionsResult.status === "fulfilled") {
        setConnections(connectionsResult.value);
      } else {
        errorMessage = toErrorMessage(connectionsResult.reason, "Unable to load tracker connections.");
      }

      if (reportResult.status === "fulfilled") {
        setReport(reportResult.value);
      } else {
        errorMessage = errorMessage ?? toErrorMessage(reportResult.reason, "Unable to load tracker report.");
      }

      setFetchError(errorMessage);
      if (errorMessage && !hasLoadErrorToast.current) {
        toast.error(errorMessage);
        hasLoadErrorToast.current = true;
      }
      if (!errorMessage) {
        hasLoadErrorToast.current = false;
      }
    } catch {
      setFetchError("Unable to load tracker data.");
      if (!hasLoadErrorToast.current) {
        toast.error("Unable to load tracker data.");
        hasLoadErrorToast.current = true;
      }
    } finally {
      setLoading(false);
    }
  }, [targetRole, useAiReport]);

  useEffect(() => {
    void loadData(targetRole, useAiReport);
  }, [loadData, targetRole, useAiReport]);

  useRealtimeRefresh(() => loadData(targetRole, useAiReport), {
    scope: "tracker",
    intervalMs: 30000,
    enabled: true,
    immediate: false,
  });

  const onConnect = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!username.trim()) {
      toast.error("Username is required");
      return;
    }

    setSubmitting(true);
    try {
      await trackerApi.connectPlatform({
        platform,
        username: username.trim(),
        accessToken: accessToken.trim() || undefined,
      });
      toast.success(`${platform} connected`);
      setUsername("");
      setAccessToken("");
      await loadData(targetRole, useAiReport);
      navigate(workspacePath("overview"));
    } catch {
      toast.error("Failed to connect platform");
    } finally {
      setSubmitting(false);
    }
  };

  const onSyncPlatform = async (target: TrackerPlatform) => {
    try {
      const result = await trackerApi.syncPlatform(target);
      setSyncLog((prev) => [result, ...prev].slice(0, 10));
      toast[result.success ? "success" : "error"](`${target}: ${result.message}`);
      await loadData(targetRole, useAiReport);
    } catch {
      toast.error(`Failed to sync ${target}`);
    }
  };

  const onSyncAll = async () => {
    setSubmitting(true);
    try {
      const results = await trackerApi.syncAll();
      setSyncLog(results);
      toast.success("Sync completed");
      await loadData(targetRole, useAiReport);
    } catch {
      toast.error("Sync all failed");
    } finally {
      setSubmitting(false);
    }
  };

  const onGenerateReport = async () => {
    setReportLoading(true);
    try {
      const data = await trackerApi.getReport(targetRole, useAiReport);
      setReport(data);
      toast.success(useAiReport ? "AI report generated" : "Performance report generated");
    } catch {
      toast.error("Unable to generate report");
    } finally {
      setReportLoading(false);
    }
  };

  const summary = report?.summary;
  const insight = report?.weeklyInsight;
  const skillGap = report?.skillGap;

  const connectedPlatforms = connections.length;
  const totalSolved = summary?.totalSolved ?? 0;
  const weeklySolved = summary?.weeklySolved ?? 0;
  const weakTopicCount = skillGap?.weakTopics.length ?? summary?.weakTopics.length ?? 0;
  const recentProblems = summary?.recentProblems ?? [];
  const topRepos = summary?.githubTopRepos ?? [];
  const platformRows = useMemo(
    () => toSafeEntries(summary?.platformSolvedCounts).sort((a, b) => b[1] - a[1]),
    [summary?.platformSolvedCounts],
  );
  const difficultyRows = useMemo(
    () => toSafeEntries(summary?.difficultyCounts).sort((a, b) => b[1] - a[1]),
    [summary?.difficultyCounts],
  );
  const topicRows = useMemo(
    () => toSafeEntries(summary?.topicCounts).sort((a, b) => b[1] - a[1]).slice(0, 8),
    [summary?.topicCounts],
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      <section className="rounded-[2rem] border border-border/70 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.12),transparent_25%),linear-gradient(135deg,hsl(var(--card))_0%,hsl(var(--background))_100%)] p-5 shadow-[0_20px_60px_hsl(var(--foreground)/0.08)] sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
              <Rocket className="h-3.5 w-3.5" />
              Tracker Studio
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              Easy tracker flow for {user?.name || "you"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Start from the hub, open a focused page, and do one task at a time. No clutter, no giant wall of widgets.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SimpleStatCard
              label="Platforms"
              value={connectedPlatforms}
              note="Connected accounts"
              icon={Link2}
              href={workspacePath("setup")}
            />
            <SimpleStatCard
              label="Solved"
              value={totalSolved}
              note="All-time total"
              icon={CheckCircle2}
              href={workspacePath("overview")}
            />
            <SimpleStatCard
              label="Weak Topics"
              value={weakTopicCount}
              note="Needs work"
              icon={Target}
              href={workspacePath("insights")}
            />
            <SimpleStatCard
              label="History"
              value={recentProblems.length}
              note="Recent solved"
              icon={History}
              href={workspacePath("history")}
            />
          </div>
        </div>
      </section>

      <nav className="flex flex-wrap gap-2">
        <Button asChild variant={workspace === "hub" ? "default" : "outline"} size="sm">
          <Link to={workspacePath("hub")}>Hub</Link>
        </Button>
        <Button asChild variant={workspace === "setup" ? "default" : "outline"} size="sm">
          <Link to={workspacePath("setup")}>Setup</Link>
        </Button>
        <Button asChild variant={workspace === "overview" ? "default" : "outline"} size="sm">
          <Link to={workspacePath("overview")}>Overview</Link>
        </Button>
        <Button asChild variant={workspace === "insights" ? "default" : "outline"} size="sm">
          <Link to={workspacePath("insights")}>Insights</Link>
        </Button>
        <Button asChild variant={workspace === "history" ? "default" : "outline"} size="sm">
          <Link to={workspacePath("history")}>History</Link>
        </Button>
      </nav>

      {fetchError && (
        <div className="rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          {fetchError}
        </div>
      )}

      {workspace === "hub" && (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {WORKSPACE_CARDS.map((card) => (
            <WorkspaceLinkCard
              key={card.id}
              title={card.title}
              description={card.description}
              icon={card.icon}
              href={workspacePath(card.id)}
              actionLabel={card.actionLabel}
            />
          ))}
        </section>
      )}

      {workspace === "setup" && (
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="content-panel">
            <CardHeader>
              <CardTitle className="text-xl">Connect a platform</CardTitle>
              <CardDescription>
                Add one username at a time. After connect, sync from the right panel.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onConnect} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="tracker-platform" className="text-sm font-medium">
                    Platform
                  </label>
                  <select
                    id="tracker-platform"
                    aria-label="Platform"
                    value={platform}
                    onChange={(event) => setPlatform(event.target.value as TrackerPlatform)}
                    className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    {PLATFORMS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="tracker-username" className="text-sm font-medium">
                    Username
                  </label>
                  <Input
                    id="tracker-username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder={platformHelp[platform]}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="tracker-token" className="text-sm font-medium">
                    Access token
                  </label>
                  <Input
                    id="tracker-token"
                    value={accessToken}
                    onChange={(event) => setAccessToken(event.target.value)}
                    placeholder="Optional"
                  />
                </div>

                <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                  {submitting ? "Connecting..." : "Connect platform"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="content-panel">
            <CardHeader>
              <CardTitle className="text-xl">Connected platforms</CardTitle>
              <CardDescription>Sync one platform or refresh all together.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {connections.length === 0 && !loading && (
                <div className="rounded-xl border border-dashed border-border/70 px-4 py-6 text-sm text-muted-foreground">
                  No platforms connected yet.
                </div>
              )}

              {connections.map((connection) => (
                <div key={connection.id} className="rounded-xl border border-border/70 bg-background/50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">{connection.platform}</p>
                        <Badge variant="secondary">{connection.username}</Badge>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Last fetched: {formatDateTime(connection.lastFetchedAt)}
                      </p>
                    </div>
                    <Button type="button" variant="outline" onClick={() => void onSyncPlatform(connection.platform)}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Sync
                    </Button>
                  </div>
                </div>
              ))}

              <Button type="button" onClick={() => void onSyncAll()} disabled={submitting} className="w-full">
                <DatabaseZap className="mr-2 h-4 w-4" />
                Sync all platforms
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {workspace === "overview" && (
        <div className="space-y-4">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SimpleStatCard label="Total Solved" value={summary?.totalSolved ?? 0} note="Across all platforms" icon={CheckCircle2} />
            <SimpleStatCard label="Weekly Solved" value={summary?.weeklySolved ?? 0} note="Current 7-day pace" icon={TrendingUp} />
            <SimpleStatCard label="Current Streak" value={summary?.currentStreakDays ?? 0} note="Days in a row" icon={Rocket} />
            <SimpleStatCard label="GitHub Repos" value={summary?.githubRepositories ?? 0} note="Tracked repositories" icon={GitBranch} href={workspacePath("history")} />
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <Card className="content-panel">
              <CardHeader>
                <CardTitle>Platform breakdown</CardTitle>
                <CardDescription>See where most of your solved volume is coming from.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {platformRows.length === 0 && <p className="text-sm text-muted-foreground">No platform data yet.</p>}
                {platformRows.map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-border/70 bg-background/50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-foreground">{label}</p>
                      <Badge variant="outline">{value}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="content-panel">
              <CardHeader>
                <CardTitle>Difficulty mix</CardTitle>
                <CardDescription>Simple view of easy, medium, and hard coverage.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {difficultyRows.length === 0 && <p className="text-sm text-muted-foreground">No difficulty data yet.</p>}
                {difficultyRows.map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-border/70 bg-background/50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-foreground">{label}</p>
                      <Badge variant="outline">{value}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <WorkspaceLinkCard
              title="Open Insights"
              description="Jump to weak topics and recommended practice."
              icon={Brain}
              href={workspacePath("insights")}
              actionLabel="Go to insights"
            />
            <WorkspaceLinkCard
              title="Open History"
              description="Review solved problems and repository activity."
              icon={History}
              href={workspacePath("history")}
              actionLabel="Go to history"
            />
            <WorkspaceLinkCard
              title="Back to Setup"
              description="Connect another platform or trigger new syncs."
              icon={Link2}
              href={workspacePath("setup")}
              actionLabel="Go to setup"
            />
          </section>
        </div>
      )}

      {workspace === "insights" && (
        <div className="space-y-4">
          <Card className="content-panel">
            <CardHeader>
              <CardTitle className="text-xl">Generate focused report</CardTitle>
              <CardDescription>
                Choose a target role and keep the report simple. You can optionally turn AI on.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
              <div className="space-y-2">
                <label htmlFor="tracker-role" className="text-sm font-medium">Target role</label>
                <select
                  id="tracker-role"
                  value={targetRole}
                  onChange={(event) => setTargetRole(event.target.value)}
                  className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  {TARGET_ROLES.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
              <Button
                type="button"
                variant={useAiReport ? "default" : "outline"}
                onClick={() => setUseAiReport((prev) => !prev)}
              >
                {useAiReport ? "AI On" : "AI Off"}
              </Button>
              <Button type="button" onClick={() => void onGenerateReport()} disabled={reportLoading}>
                Generate report
              </Button>
              <Button asChild type="button" variant="outline">
                <Link to={workspacePath("overview")}>Back to overview</Link>
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card className="content-panel">
              <CardHeader>
                <CardTitle>Weak topics</CardTitle>
                <CardDescription>Start here for fastest improvement.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(skillGap?.weakTopics || summary?.weakTopics || []).length === 0 && (
                  <p className="text-sm text-muted-foreground">No weak topics identified yet.</p>
                )}
                {(skillGap?.weakTopics || summary?.weakTopics || []).map((topic) => (
                  <div key={topic} className="rounded-xl border border-border/70 bg-background/50 px-4 py-3">
                    {topic}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="content-panel">
              <CardHeader>
                <CardTitle>Strong topics</CardTitle>
                <CardDescription>Areas where your base is already solid.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(skillGap?.strongTopics || summary?.strongTopics || []).length === 0 && (
                  <p className="text-sm text-muted-foreground">No strong topics identified yet.</p>
                )}
                {(skillGap?.strongTopics || summary?.strongTopics || []).map((topic) => (
                  <div key={topic} className="rounded-xl border border-border/70 bg-background/50 px-4 py-3">
                    {topic}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="content-panel">
            <CardHeader>
              <CardTitle>Recommended practice</CardTitle>
              <CardDescription>
                Suggestions for {skillGap?.targetRole || targetRole}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(skillGap?.recommendedPractice || []).length === 0 && (
                <p className="text-sm text-muted-foreground">Generate a report to see recommendations.</p>
              )}
              {(skillGap?.recommendedPractice || []).map((item) => (
                <div key={`${item.topic}-${item.reason}`} className="rounded-2xl border border-border/70 bg-background/50 p-4">
                  <p className="text-base font-semibold text-foreground">{item.topic}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{item.reason}</p>
                  <div className="mt-3 space-y-2">
                    {item.suggestedProblems.map((problem) => (
                      <div key={`${item.topic}-${problem}`} className="rounded-xl border border-border/60 bg-card px-3 py-2 text-sm">
                        {problem}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="content-panel">
            <CardHeader>
              <CardTitle>Weekly insight</CardTitle>
              <CardDescription>
                {insight?.aiGenerated ? "AI generated summary" : "Simple summary"} · last update {formatDateTime(insight?.generatedAt)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-foreground">{insight?.summary || "No insight generated yet."}</p>
              {(insight?.recommendations || []).map((item) => (
                <div key={item} className="rounded-xl border border-border/70 bg-background/50 px-4 py-3 text-sm text-muted-foreground">
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {workspace === "history" && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SimpleStatCard label="Recent Problems" value={recentProblems.length} note="Latest synced questions" icon={History} />
            <SimpleStatCard label="Top Topics" value={topicRows.length} note="Most repeated categories" icon={Target} />
            <SimpleStatCard label="GitHub Commits" value={summary?.githubCommits ?? 0} note="Tracked repo commits" icon={GitBranch} />
            <SimpleStatCard label="Last Sync" value={summary?.lastSyncedAt ? formatDate(summary.lastSyncedAt) : "N/A"} note="Most recent refresh" icon={CalendarClock} />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card className="content-panel">
              <CardHeader>
                <CardTitle>Recent solved problems</CardTitle>
                <CardDescription>Clear list with platform, difficulty, and solved date.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentProblems.length === 0 && <p className="text-sm text-muted-foreground">No recent problems synced yet.</p>}
                {recentProblems.slice(0, 12).map((problem) => (
                  <div key={`${problem.platform}-${problem.problemId}-${problem.solvedAt}`} className="rounded-2xl border border-border/70 bg-background/50 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">{problem.problemName || problem.problemId}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge variant="secondary">{problem.platform}</Badge>
                          <Badge variant="outline">{problem.difficulty || "UNKNOWN"}</Badge>
                        </div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <p>{formatDate(problem.solvedAt)}</p>
                        {problem.problemUrl && (
                          <a href={problem.problemUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block underline underline-offset-2">
                            Open
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="content-panel">
              <CardHeader>
                <CardTitle>GitHub repositories</CardTitle>
                <CardDescription>Your most active repositories in one simple list.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {topRepos.length === 0 && <p className="text-sm text-muted-foreground">No GitHub repositories synced yet.</p>}
                {topRepos.slice(0, 10).map((repo) => (
                  <div key={`${repo.repoName}-${repo.lastUpdated}`} className="rounded-2xl border border-border/70 bg-background/50 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">{repo.repoName}</p>
                        <p className="mt-2 text-xs text-muted-foreground">Updated: {formatDateTime(repo.lastUpdated)}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">Commits {repo.commits}</Badge>
                        <Badge variant="outline">Stars {repo.stars}</Badge>
                        <Badge variant="outline">Forks {repo.forks}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="content-panel">
            <CardHeader>
              <CardTitle>Sync log</CardTitle>
              <CardDescription>Recent sync responses from your latest actions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {syncLog.length === 0 && <p className="text-sm text-muted-foreground">No sync actions in this session yet.</p>}
              {syncLog.map((entry) => (
                <div key={`${entry.platform}-${entry.updatedAt}`} className="rounded-2xl border border-border/70 bg-background/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{entry.platform}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{entry.message}</p>
                    </div>
                    <Badge variant={entry.success ? "default" : "destructive"}>
                      {entry.success ? "Success" : "Failed"}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    fetched {entry.fetchedItems} · new {entry.newItems} · repos {entry.fetchedRepositories} · {formatDateTime(entry.updatedAt)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}
