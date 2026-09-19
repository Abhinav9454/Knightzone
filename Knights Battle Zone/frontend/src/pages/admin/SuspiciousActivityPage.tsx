import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { suspiciousApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { AlertOctagon, Ban, CheckCircle2, Eye, Search } from "lucide-react";
import type { SuspiciousUser } from "@/lib/types";

export default function SuspiciousActivityPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith("/simple") ? "/simple" : "";

  const [users, setUsers] = useState<SuspiciousUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | SuspiciousUser["status"]>("ALL");
  const [severityFilter, setSeverityFilter] = useState<"ALL" | SuspiciousUser["severity"]>("ALL");

  useEffect(() => {
    suspiciousApi.getAll()
      .then((res) => setUsers(res.data))
      .catch(() => toast.error("Unable to load suspicious activity right now."))
      .finally(() => setLoading(false));
  }, []);

  const investigate = async (userId: number) => {
    try {
      await suspiciousApi.investigate(userId);
      setUsers((prev) => prev.map((user) => (user.userId === userId ? { ...user, status: "INVESTIGATING" } : user)));
      toast.success("User moved to investigating state.");
    } catch {
      toast.error("Unable to update suspicious user.");
    }
  };

  const markLocalStatus = (userId: number, status: SuspiciousUser["status"]) => {
    setUsers((prev) => prev.map((user) => (user.userId === userId ? { ...user, status } : user)));
    toast.success(`User marked as ${status.toLowerCase()}.`);
  };

  const normalizedSearch = search.trim().toLowerCase();

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (statusFilter !== "ALL" && user.status !== statusFilter) {
        return false;
      }
      if (severityFilter !== "ALL" && user.severity !== severityFilter) {
        return false;
      }
      if (!normalizedSearch) {
        return true;
      }
      return (
        user.username.toLowerCase().includes(normalizedSearch)
        || user.reason.toLowerCase().includes(normalizedSearch)
        || String(user.userId).includes(normalizedSearch)
      );
    });
  }, [users, normalizedSearch, severityFilter, statusFilter]);

  const summary = useMemo(() => {
    const critical = users.filter((user) => user.severity === "CRITICAL").length;
    const investigating = users.filter((user) => user.status === "INVESTIGATING").length;
    const banned = users.filter((user) => user.status === "BANNED").length;
    return {
      total: users.length,
      critical,
      investigating,
      banned,
    };
  }, [users]);

  return (
    <div className="space-y-6 page-transition">
      <section className="page-shell space-y-5">
        <header>
          <p className="hero-chip mb-3">Risk Detection Queue</p>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertOctagon className="text-destructive" />
            Suspicious Activity
          </h1>
          <p className="text-muted-foreground">
            Monitor risky users and enforce moderation actions.
          </p>
        </header>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="metric-card rounded-xl p-3">
            <p className="text-xs text-muted-foreground">Flagged Users</p>
            <p className="text-2xl font-bold">{summary.total}</p>
          </div>
          <div className="metric-card rounded-xl p-3">
            <p className="text-xs text-muted-foreground">Critical Severity</p>
            <p className="text-2xl font-bold text-destructive">{summary.critical}</p>
          </div>
          <div className="metric-card rounded-xl p-3">
            <p className="text-xs text-muted-foreground">Investigating</p>
            <p className="text-2xl font-bold text-warning">{summary.investigating}</p>
          </div>
          <div className="metric-card rounded-xl p-3">
            <p className="text-xs text-muted-foreground">Banned</p>
            <p className="text-2xl font-bold text-muted-foreground">{summary.banned}</p>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px]">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9"
              placeholder="Search user, reason, user ID"
            />
          </div>
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "ALL" | SuspiciousUser["status"])}
              className="w-full"
            >
              <option value="ALL">All</option>
              <option value="INVESTIGATING">Investigating</option>
              <option value="CLEARED">Cleared</option>
              <option value="BANNED">Banned</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Severity</span>
            <select
              value={severityFilter}
              onChange={(event) => setSeverityFilter(event.target.value as "ALL" | SuspiciousUser["severity"])}
              className="w-full"
            >
              <option value="ALL">All</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </label>
        </div>
      </section>

      <section className="glass-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="p-3 font-medium">User</th>
              <th className="p-3 font-medium">Reason</th>
              <th className="p-3 font-medium">Severity</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Detected</th>
              <th className="p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.userId} className="border-b border-border/50 hover:bg-muted/30">
                <td className="p-3 font-medium">{user.username}</td>
                <td className="p-3 text-muted-foreground text-xs max-w-[260px]">{user.reason}</td>
                <td className="p-3">
                  <Badge
                    variant="outline"
                    className={`text-xs ${user.severity === "CRITICAL" || user.severity === "HIGH" ? "text-destructive border-destructive/30" : user.severity === "MEDIUM" ? "text-warning border-warning/30" : "text-success border-success/30"}`}
                  >
                    {user.severity}
                  </Badge>
                </td>
                <td className="p-3">
                  <Badge
                    variant="outline"
                    className={`text-xs ${user.status === "INVESTIGATING" ? "text-warning" : user.status === "CLEARED" ? "text-success" : "text-destructive"}`}
                  >
                    {user.status}
                  </Badge>
                </td>
                <td className="p-3 text-muted-foreground text-xs">{new Date(user.detectedAt).toLocaleString()}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`${basePath}/profile/${encodeURIComponent(user.username)}`)}
                    >
                      <Eye size={14} className="mr-1" /> Profile
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void investigate(user.userId)}
                      disabled={user.status === "INVESTIGATING"}
                    >
                      <Search size={14} className="mr-1" /> Investigate
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-success"
                      onClick={() => markLocalStatus(user.userId, "CLEARED")}
                      disabled={user.status === "CLEARED"}
                    >
                      <CheckCircle2 size={14} className="mr-1" /> Clear
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => markLocalStatus(user.userId, "BANNED")}
                      disabled={user.status === "BANNED"}
                    >
                      <Ban size={14} className="mr-1" /> Ban
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && filteredUsers.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  No suspicious users detected for this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
