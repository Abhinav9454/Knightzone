import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { tabSwitchApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ShieldAlert, SwitchCamera, TimerReset } from "lucide-react";

type LocalSwitchEvent = {
  id: string;
  contestId: number;
  userId: number;
  createdAt: string;
};

export default function TabSwitchMonitorPage() {
  const { user } = useAuth();
  const [contestId, setContestId] = useState("");
  const [userIdInput, setUserIdInput] = useState(user?.id ? String(user.id) : "");
  const [count, setCount] = useState<number | null>(null);
  const [threshold, setThreshold] = useState("3");
  const [loadingCount, setLoadingCount] = useState(false);
  const [loggingSwitch, setLoggingSwitch] = useState(false);
  const [events, setEvents] = useState<LocalSwitchEvent[]>([]);

  const parseInputs = () => {
    const contest = Number(contestId);
    const userId = Number(userIdInput);
    if (Number.isNaN(contest) || contest <= 0 || Number.isNaN(userId) || userId <= 0) {
      return null;
    }
    return { contest, userId };
  };

  const fetchCount = async () => {
    const parsed = parseInputs();
    if (!parsed) {
      toast.error("Valid contest ID and user ID required.");
      return;
    }
    setLoadingCount(true);
    try {
      const value = await tabSwitchApi.getCount(parsed.contest, parsed.userId);
      setCount(value);
    } catch {
      toast.error("Unable to fetch tab switch count.");
    } finally {
      setLoadingCount(false);
    }
  };

  const logSwitch = async () => {
    const parsed = parseInputs();
    if (!parsed) {
      toast.error("Valid contest ID and user ID required.");
      return;
    }
    setLoggingSwitch(true);
    try {
      await tabSwitchApi.logSwitch(parsed.contest, parsed.userId);
      setEvents((prev) => [
        {
          id: `${Date.now()}-${parsed.userId}`,
          contestId: parsed.contest,
          userId: parsed.userId,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      toast.success("Tab switch logged.");
      await fetchCount();
    } catch {
      toast.error("Unable to log tab switch.");
    } finally {
      setLoggingSwitch(false);
    }
  };

  const parsedThreshold = Number(threshold);

  const risk = useMemo(() => {
    const limit = Number.isNaN(parsedThreshold) || parsedThreshold <= 0 ? 3 : parsedThreshold;
    const value = count ?? 0;
    if (value >= limit + 2) {
      return {
        label: "Critical",
        tone: "text-destructive",
        note: "Immediate proctor action recommended.",
      };
    }
    if (value >= limit) {
      return {
        label: "Warning",
        tone: "text-warning",
        note: "Candidate exceeded safe tab-switch threshold.",
      };
    }
    return {
      label: "Normal",
      tone: "text-success",
      note: "Tab-switch behavior is within acceptable range.",
    };
  }, [count, parsedThreshold]);

  return (
    <div className="space-y-6 page-transition">
      <section className="page-shell space-y-5">
        <header>
          <p className="hero-chip mb-3">Exam Integrity</p>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <SwitchCamera className="text-primary" />
            Tab Switch Monitor
          </h1>
          <p className="text-muted-foreground">
            Contest-level tab switch tracking with hard threshold alerts.
          </p>
        </header>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-sm">
            Contest ID
            <input
              type="number"
              min={1}
              className="mt-1 h-10 w-full rounded-md border bg-background px-3"
              value={contestId}
              onChange={(event) => setContestId(event.target.value)}
            />
          </label>
          <label className="text-sm">
            User ID
            <input
              type="number"
              min={1}
              className="mt-1 h-10 w-full rounded-md border bg-background px-3"
              value={userIdInput}
              onChange={(event) => setUserIdInput(event.target.value)}
            />
          </label>
          <label className="text-sm">
            Alert Threshold
            <input
              type="number"
              min={1}
              className="mt-1 h-10 w-full rounded-md border bg-background px-3"
              value={threshold}
              onChange={(event) => setThreshold(event.target.value)}
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={loadingCount} onClick={() => void fetchCount()}>
            {loadingCount ? "Loading..." : "Get Count"}
          </Button>
          <Button disabled={loggingSwitch} onClick={() => void logSwitch()}>
            {loggingSwitch ? "Logging..." : "Log Tab Switch"}
          </Button>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="glass-card p-4 space-y-3">
          <h2 className="text-lg font-semibold">Current Risk Snapshot</h2>
          <div className="rounded-lg border border-border/70 bg-muted/25 p-3">
            <p className="text-xs text-muted-foreground">Current Count</p>
            <p className="text-3xl font-bold">{count ?? "-"}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={risk.tone}>{risk.label}</Badge>
            <span className="text-sm text-muted-foreground">{risk.note}</span>
          </div>
          {(count ?? 0) >= (Number.isNaN(parsedThreshold) ? 3 : parsedThreshold) && (
            <p className="text-sm text-destructive flex items-center gap-2">
              <AlertTriangle size={14} />
              Threshold exceeded. Escalate to manual review.
            </p>
          )}
        </div>

        <div className="glass-card p-4 space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ShieldAlert size={16} className="text-warning" />
            Hard Checks
          </h2>
          <p className="text-sm text-muted-foreground">Use these checks during live exams:</p>
          <div className="space-y-2 text-sm">
            <p className={(count ?? 0) <= 1 ? "text-success" : "text-warning"}>{"- Keep count <= 1 in first 20 minutes."}</p>
            <p className={(count ?? 0) < (Number.isNaN(parsedThreshold) ? 3 : parsedThreshold) ? "text-success" : "text-destructive"}>{"- Do not exceed configured threshold."}</p>
            <p className={events.length > 0 ? "text-warning" : "text-success"}>{"- Correlate every switch with webcam/screen logs."}</p>
          </div>
        </div>
      </section>

      <section className="glass-card p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Recent Monitor Events</h2>
          <Button variant="ghost" size="sm" onClick={() => setEvents([])}>
            <TimerReset size={14} className="mr-1" /> Clear local log
          </Button>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-muted-foreground">
                <th className="px-2 py-2">Time</th>
                <th className="px-2 py-2">Contest</th>
                <th className="px-2 py-2">User</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="border-b border-border/40">
                  <td className="px-2 py-2">{new Date(event.createdAt).toLocaleString()}</td>
                  <td className="px-2 py-2">#{event.contestId}</td>
                  <td className="px-2 py-2">#{event.userId}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {events.length === 0 && (
            <p className="py-3 text-sm text-muted-foreground">No local events logged yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
