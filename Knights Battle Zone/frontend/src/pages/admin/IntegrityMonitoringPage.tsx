import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { integrityApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Check, Eye, Search, ShieldAlert, X } from "lucide-react";
import type { FlaggedSubmission } from "@/lib/types";

export default function IntegrityMonitoringPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith("/simple") ? "/simple" : "";

  const [flags, setFlags] = useState<FlaggedSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | FlaggedSubmission["status"]>("ALL");
  const [severityFilter, setSeverityFilter] = useState<"ALL" | FlaggedSubmission["severity"]>("ALL");

  useEffect(() => {
    integrityApi.getFlagged()
      .then((res) => setFlags(res.data))
      .catch(() => toast.error("Unable to load integrity data right now."))
      .finally(() => setLoading(false));
  }, []);

  const review = async (id: number, action: "DISMISS" | "REVIEWED") => {
    try {
      await integrityApi.review(id, action);
      setFlags((prev) => prev.map((f) => (f.id === id
        ? { ...f, status: action === "DISMISS" ? "DISMISSED" : "REVIEWED" }
        : f)));
      toast.success(`Submission marked as ${action === "DISMISS" ? "dismissed" : "reviewed"}.`);
    } catch {
      toast.error("Unable to update integrity status.");
    }
  };

  const normalizedSearch = search.trim().toLowerCase();

  const filteredFlags = useMemo(() => {
    return flags.filter((flag) => {
      if (statusFilter !== "ALL" && flag.status !== statusFilter) {
        return false;
      }
      if (severityFilter !== "ALL" && flag.severity !== severityFilter) {
        return false;
      }
      if (!normalizedSearch) {
        return true;
      }
      return (
        flag.username.toLowerCase().includes(normalizedSearch)
        || flag.reason.toLowerCase().includes(normalizedSearch)
        || String(flag.submissionId).includes(normalizedSearch)
      );
    });
  }, [flags, normalizedSearch, severityFilter, statusFilter]);

  const summary = useMemo(() => {
    const pending = flags.filter((flag) => flag.status === "PENDING").length;
    const highSeverity = flags.filter((flag) => flag.severity === "HIGH").length;
    return {
      total: flags.length,
      pending,
      highSeverity,
      reviewed: flags.filter((flag) => flag.status === "REVIEWED").length,
    };
  }, [flags]);

  return (
    <div className="space-y-6 page-transition">
      <section className="page-shell space-y-5">
        <header>
          <p className="hero-chip mb-3">Anti-Plagiarism Queue</p>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldAlert className="text-destructive" />
            Integrity Monitoring
          </h1>
          <p className="text-muted-foreground">
            Review flagged submissions and close integrity actions fast.
          </p>
        </header>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="metric-card rounded-xl p-3">
            <p className="text-xs text-muted-foreground">Total Flags</p>
            <p className="text-2xl font-bold">{summary.total}</p>
          </div>
          <div className="metric-card rounded-xl p-3">
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-warning">{summary.pending}</p>
          </div>
          <div className="metric-card rounded-xl p-3">
            <p className="text-xs text-muted-foreground">High Severity</p>
            <p className="text-2xl font-bold text-destructive">{summary.highSeverity}</p>
          </div>
          <div className="metric-card rounded-xl p-3">
            <p className="text-xs text-muted-foreground">Reviewed</p>
            <p className="text-2xl font-bold text-success">{summary.reviewed}</p>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px]">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9"
              placeholder="Search user, reason, submission"
            />
          </div>
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "ALL" | FlaggedSubmission["status"])}
              className="w-full"
            >
              <option value="ALL">All</option>
              <option value="PENDING">Pending</option>
              <option value="REVIEWED">Reviewed</option>
              <option value="DISMISSED">Dismissed</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Severity</span>
            <select
              value={severityFilter}
              onChange={(event) => setSeverityFilter(event.target.value as "ALL" | FlaggedSubmission["severity"])}
              className="w-full"
            >
              <option value="ALL">All</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </label>
        </div>
      </section>

      <section className="glass-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="p-3 font-medium">User</th>
              <th className="p-3 font-medium">Submission</th>
              <th className="p-3 font-medium">Reason</th>
              <th className="p-3 font-medium">Severity</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Detected</th>
              <th className="p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredFlags.map((flag) => (
              <tr key={flag.id} className="border-b border-border/50 hover:bg-muted/30">
                <td className="p-3 font-medium">{flag.username}</td>
                <td className="p-3">#{flag.submissionId}</td>
                <td className="p-3 text-muted-foreground text-xs max-w-[260px]">{flag.reason}</td>
                <td className="p-3">
                  <Badge
                    variant="outline"
                    className={`text-xs ${flag.severity === "HIGH" ? "text-destructive border-destructive/30" : flag.severity === "MEDIUM" ? "text-warning border-warning/30" : "text-success border-success/30"}`}
                  >
                    {flag.severity}
                  </Badge>
                </td>
                <td className="p-3">
                  <Badge
                    variant="outline"
                    className={`text-xs ${flag.status === "PENDING" ? "text-warning" : flag.status === "REVIEWED" ? "text-success" : "text-muted-foreground"}`}
                  >
                    {flag.status}
                  </Badge>
                </td>
                <td className="p-3 text-muted-foreground text-xs">{new Date(flag.detectedAt).toLocaleString()}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`${basePath}/submissions?submissionId=${flag.submissionId}`)}
                    >
                      <Eye size={14} className="mr-1" />
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-success"
                      disabled={flag.status !== "PENDING"}
                      onClick={() => void review(flag.id, "REVIEWED")}
                    >
                      <Check size={14} className="mr-1" />
                      Review
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      disabled={flag.status !== "PENDING"}
                      onClick={() => void review(flag.id, "DISMISS")}
                    >
                      <X size={14} className="mr-1" />
                      Dismiss
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && filteredFlags.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-muted-foreground">
                  No flagged submissions found for this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
