import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, RefreshCw, Smartphone, Wifi } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { systemApi, type ApiProbeResult } from "@/lib/api";

const AUTO_REFRESH_SECONDS = 20;

type ProbeTone = "good" | "warn" | "bad";

const getProbeTone = (probe: ApiProbeResult): ProbeTone => {
  if (probe.status >= 500 || probe.status === 0) return "bad";
  if (probe.status === 401 || probe.status === 403 || probe.status === 404) return "warn";
  return "good";
};

const getProbeLabel = (probe: ApiProbeResult) => {
  if (probe.status === 401 || probe.status === 403) return "Auth Required";
  if (probe.status === 404) return "Route Missing";
  if (probe.status >= 500 || probe.status === 0) return "Service Down";
  return "Connected";
};

export default function MobileQuickCheckPage() {
  const [results, setResults] = useState<ApiProbeResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [countdown, setCountdown] = useState(AUTO_REFRESH_SECONDS);
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);

  const runChecks = useCallback(async () => {
    setRunning(true);
    try {
      const probes = await systemApi.checkBackendConnections();
      setResults(probes);
      setLastCheckedAt(new Date());
    } finally {
      setRunning(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void runChecks();
  }, [runChecks]);

  useEffect(() => {
    if (!autoRefresh) return;

    const refreshTimer = setInterval(() => {
      void runChecks();
      setCountdown(AUTO_REFRESH_SECONDS);
    }, AUTO_REFRESH_SECONDS * 1000);

    const countdownTimer = setInterval(() => {
      setCountdown((previous) => (previous <= 1 ? AUTO_REFRESH_SECONDS : previous - 1));
    }, 1000);

    return () => {
      clearInterval(refreshTimer);
      clearInterval(countdownTimer);
    };
  }, [autoRefresh, runChecks]);

  const summary = useMemo(() => {
    const healthy = results.filter((probe) => getProbeTone(probe) === "good").length;
    const warning = results.filter((probe) => getProbeTone(probe) === "warn").length;
    const failed = results.filter((probe) => getProbeTone(probe) === "bad").length;
    return {
      total: results.length,
      healthy,
      warning,
      failed,
    };
  }, [results]);

  const quickLinks = useMemo(
    () => [
      { name: "Login", path: "/login" },
      { name: "Dashboard", path: "/" },
      { name: "Contests", path: "/contests" },
      { name: "Quizzes", path: "/quizzes" },
      { name: "Leaderboard", path: "/leaderboard" },
      { name: "Profile", path: "/profile" },
      { name: "Admin", path: "/admin" },
    ],
    [],
  );

  return (
    <main className="min-h-screen bg-background text-foreground px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-4">
        <Card>
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
              <Smartphone className="h-5 w-5 text-primary" />
              Mobile Quick Check
            </CardTitle>
            <CardDescription>
              Phone se app + backend connectivity verify karne ke liye quick smoke test screen.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-xl font-semibold">{summary.total}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Connected</p>
                <p className="text-xl font-semibold text-emerald-500">{summary.healthy}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Warnings</p>
                <p className="text-xl font-semibold text-amber-500">{summary.warning}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Down</p>
                <p className="text-xl font-semibold text-destructive">{summary.failed}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => void runChecks()} disabled={running} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Run Check
              </Button>
              <Button variant="outline" onClick={() => setAutoRefresh((v) => !v)}>
                Auto Refresh: {autoRefresh ? `ON (${countdown}s)` : "OFF"}
              </Button>
              <Badge variant="outline" className="gap-1">
                <Wifi className="h-3.5 w-3.5" />
                {window.location.origin}
              </Badge>
            </div>

            <div className="text-xs text-muted-foreground">
              Last checked: {lastCheckedAt ? lastCheckedAt.toLocaleTimeString() : "Not yet"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">API Status</CardTitle>
            <CardDescription>
              401/403 ka matlab endpoint reachable hai, bas login required hai.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {!loading && results.map((probe) => {
              const tone = getProbeTone(probe);
              return (
                <div key={probe.name} className="rounded-lg border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{probe.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{probe.path}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={tone === "bad" ? "destructive" : tone === "warn" ? "secondary" : "default"}
                        className="gap-1"
                      >
                        {tone === "good" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                        {getProbeLabel(probe)}
                      </Badge>
                      <Badge variant="outline">HTTP {probe.status || "N/A"}</Badge>
                      <Badge variant="outline">{probe.latencyMs}ms</Badge>
                    </div>
                  </div>
                  {probe.message && (
                    <p className="mt-2 text-xs text-muted-foreground break-all">{probe.message}</p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Page Links</CardTitle>
            <CardDescription>In pages ko phone par tap karke UI flow bhi verify kar sakte ho.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {quickLinks.map((link) => (
                <a
                  key={link.path}
                  href={link.path}
                  className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted/60 transition-colors"
                >
                  {link.name}
                </a>
              ))}
            </div>
            <Separator className="my-4" />
            <ol className="list-decimal pl-4 text-xs text-muted-foreground space-y-1">
              <li>Phone aur laptop ko same Wi-Fi pe connect rakho.</li>
              <li>`http://YOUR-PC-IP:3000/mobile-check` open karo.</li>
              <li>Connected + page links dono pass ho gaye to basic working OK hai.</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
