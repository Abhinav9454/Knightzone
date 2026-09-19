import { useEffect, useMemo, useState } from "react";
import { Activity, RefreshCw, Server } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { systemApi, type ApiProbeResult } from "@/lib/api";
import { toast } from "sonner";

export default function BackendHealthPage() {
  const [results, setResults] = useState<ApiProbeResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);

  const runChecks = async () => {
    setRunning(true);
    try {
      const data = await systemApi.checkBackendConnections();
      setResults(data);
      setLastCheckedAt(new Date());
      const failedCount = data.filter((item) => !item.ok).length;
      if (failedCount > 0) {
        toast.error(`${failedCount} backend module(s) not reachable`);
      } else {
        toast.success("All backend modules are connected");
      }
    } catch {
      toast.error("Unable to run backend connection checks");
    } finally {
      setRunning(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    runChecks();
  }, []);

  const summary = useMemo(() => {
    const total = results.length;
    const healthy = results.filter((item) => item.ok).length;
    return { total, healthy, failed: total - healthy };
  }, [results]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Server size={24} className="text-primary" />
            Backend Health
          </h1>
          <p className="text-muted-foreground">
            Frontend se backend modules ka real-time connection status
          </p>
        </div>
        <Button onClick={runChecks} disabled={running} className="gap-2">
          <RefreshCw size={16} />
          Re-check
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground">Total Modules</p>
          <p className="text-2xl font-bold">{summary.total}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground">Connected</p>
          <p className="text-2xl font-bold text-success">{summary.healthy}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground">Failed</p>
          <p className="text-2xl font-bold text-destructive">{summary.failed}</p>
        </div>
      </div>

      <div className="glass-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <Activity size={16} className="text-primary" />
            Module Status
          </h2>
          <p className="text-xs text-muted-foreground">
            {lastCheckedAt ? `Last checked: ${lastCheckedAt.toLocaleTimeString()}` : "Not checked yet"}
          </p>
        </div>

        {!loading && (
          <div className="space-y-2">
            {results.map((item) => (
              <div key={item.name} className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-muted/40 px-3 py-2">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{item.path}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={item.ok ? "default" : "destructive"}>
                    {item.ok ? "Connected" : "Failed"}
                  </Badge>
                  <Badge variant="outline">HTTP {item.status || "N/A"}</Badge>
                  <Badge variant="outline">{item.latencyMs}ms</Badge>
                  {item.message && <span className="text-xs text-muted-foreground max-w-[280px] truncate">{item.message}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

