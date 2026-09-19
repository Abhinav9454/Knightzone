import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { reviewFlagApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Check, Eye, Flag, Search, X } from "lucide-react";
import type { ReviewFlag } from "@/lib/types";

export default function ReviewFlagsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith("/simple") ? "/simple" : "";

  const [flags, setFlags] = useState<ReviewFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | ReviewFlag["status"]>("ALL");
  const [typeFilter, setTypeFilter] = useState<"ALL" | ReviewFlag["type"]>("ALL");

  useEffect(() => {
    reviewFlagApi.getAll()
      .then((res) => setFlags(res.data))
      .catch(() => toast.error("Unable to load review flags right now."))
      .finally(() => setLoading(false));
  }, []);

  const resolve = async (id: number) => {
    try {
      await reviewFlagApi.resolve(id);
      setFlags((prev) => prev.map((flag) => (flag.id === id ? { ...flag, status: "RESOLVED" } : flag)));
      toast.success("Flag resolved.");
    } catch {
      toast.error("Failed to resolve flag.");
    }
  };

  const dismiss = async (id: number) => {
    try {
      await reviewFlagApi.dismiss(id);
      setFlags((prev) => prev.map((flag) => (flag.id === id ? { ...flag, status: "DISMISSED" } : flag)));
      toast.success("Flag dismissed.");
    } catch {
      toast.error("Failed to dismiss flag.");
    }
  };

  const normalizedSearch = search.trim().toLowerCase();

  const filteredFlags = useMemo(() => {
    return flags.filter((flag) => {
      if (statusFilter !== "ALL" && flag.status !== statusFilter) {
        return false;
      }
      if (typeFilter !== "ALL" && flag.type !== typeFilter) {
        return false;
      }
      if (!normalizedSearch) {
        return true;
      }
      return (
        flag.reason.toLowerCase().includes(normalizedSearch)
        || flag.reporterName.toLowerCase().includes(normalizedSearch)
        || String(flag.targetId).includes(normalizedSearch)
      );
    });
  }, [flags, normalizedSearch, statusFilter, typeFilter]);

  const summary = useMemo(() => {
    const open = flags.filter((flag) => flag.status === "OPEN").length;
    const resolved = flags.filter((flag) => flag.status === "RESOLVED").length;
    const dismissed = flags.filter((flag) => flag.status === "DISMISSED").length;
    return {
      total: flags.length,
      open,
      resolved,
      dismissed,
    };
  }, [flags]);

  const openTarget = (flag: ReviewFlag) => {
    if (flag.type === "PROBLEM") {
      navigate(`${basePath}/problems/${flag.targetId}`);
      return;
    }
    if (flag.type === "SUBMISSION") {
      navigate(`${basePath}/submissions?submissionId=${flag.targetId}`);
      return;
    }
    navigate(`${basePath}/marketplace`);
  };

  return (
    <div className="space-y-6 page-transition">
      <section className="page-shell space-y-5">
        <header>
          <p className="hero-chip mb-3">Content Governance</p>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Flag className="text-warning" />
            Review Flags
          </h1>
          <p className="text-muted-foreground">Moderate community-reported items and close resolution queue.</p>
        </header>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="metric-card rounded-xl p-3">
            <p className="text-xs text-muted-foreground">Total Flags</p>
            <p className="text-2xl font-bold">{summary.total}</p>
          </div>
          <div className="metric-card rounded-xl p-3">
            <p className="text-xs text-muted-foreground">Open</p>
            <p className="text-2xl font-bold text-warning">{summary.open}</p>
          </div>
          <div className="metric-card rounded-xl p-3">
            <p className="text-xs text-muted-foreground">Resolved</p>
            <p className="text-2xl font-bold text-success">{summary.resolved}</p>
          </div>
          <div className="metric-card rounded-xl p-3">
            <p className="text-xs text-muted-foreground">Dismissed</p>
            <p className="text-2xl font-bold text-muted-foreground">{summary.dismissed}</p>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px]">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9"
              placeholder="Search reason, reporter, target"
            />
          </div>
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "ALL" | ReviewFlag["status"])}
              className="w-full"
            >
              <option value="ALL">All</option>
              <option value="OPEN">Open</option>
              <option value="RESOLVED">Resolved</option>
              <option value="DISMISSED">Dismissed</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Type</span>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as "ALL" | ReviewFlag["type"])}
              className="w-full"
            >
              <option value="ALL">All</option>
              <option value="PROBLEM">Problem</option>
              <option value="COMMENT">Comment</option>
              <option value="SUBMISSION">Submission</option>
            </select>
          </label>
        </div>
      </section>

      <section className="glass-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="p-3 font-medium">Type</th>
              <th className="p-3 font-medium">Target</th>
              <th className="p-3 font-medium">Reason</th>
              <th className="p-3 font-medium">Reporter</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Date</th>
              <th className="p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredFlags.map((flag) => (
              <tr key={flag.id} className="border-b border-border/50 hover:bg-muted/30">
                <td className="p-3"><Badge variant="outline" className="text-xs">{flag.type}</Badge></td>
                <td className="p-3">#{flag.targetId}</td>
                <td className="p-3 text-muted-foreground text-xs max-w-[280px]">{flag.reason}</td>
                <td className="p-3 font-medium">{flag.reporterName}</td>
                <td className="p-3">
                  <Badge
                    variant="outline"
                    className={`text-xs ${flag.status === "OPEN" ? "text-warning" : flag.status === "RESOLVED" ? "text-success" : "text-muted-foreground"}`}
                  >
                    {flag.status}
                  </Badge>
                </td>
                <td className="p-3 text-muted-foreground text-xs">{new Date(flag.createdAt).toLocaleString()}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openTarget(flag)}>
                      <Eye size={14} className="mr-1" />
                      Open
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-success"
                      disabled={flag.status !== "OPEN"}
                      onClick={() => void resolve(flag.id)}
                    >
                      <Check size={14} className="mr-1" />
                      Resolve
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      disabled={flag.status !== "OPEN"}
                      onClick={() => void dismiss(flag.id)}
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
                  No review flags available for this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
