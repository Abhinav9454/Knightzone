import { useCallback, useMemo, useRef, useState } from "react";
import { placementApi } from "@/lib/api";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Briefcase, CheckCircle2, Search, Target, TriangleAlert } from "lucide-react";
import type { CompanyMatch, PlacementTopic } from "@/lib/types";
import { toast } from "sonner";
import { useRealtimeRefresh } from "@/lib/realtime";

export default function PlacementReadinessPage() {
  const [topics, setTopics] = useState<PlacementTopic[]>([]);
  const [companies, setCompanies] = useState<CompanyMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [importanceFilter, setImportanceFilter] = useState<"ALL" | PlacementTopic["importance"]>("ALL");
  const [companyQuery, setCompanyQuery] = useState("");
  const hasErrorToast = useRef(false);

  const overallReadiness = Math.round(topics.reduce((sum, topic) => sum + topic.mastery, 0) / Math.max(topics.length, 1));

  const loadReadiness = useCallback(async () => {
    try {
      const res = await placementApi.getReadiness();
      setTopics(res.data.topics || []);
      setCompanies(res.data.companies || []);
      hasErrorToast.current = false;
    } catch {
      if (!hasErrorToast.current) {
        toast.error("Unable to refresh placement readiness right now.");
        hasErrorToast.current = true;
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useRealtimeRefresh(loadReadiness, { intervalMs: 20000, scope: "dashboard" });

  const filteredTopics = useMemo(() => {
    if (importanceFilter === "ALL") {
      return topics;
    }
    return topics.filter((topic) => topic.importance === importanceFilter);
  }, [importanceFilter, topics]);

  const normalizedCompanyQuery = companyQuery.trim().toLowerCase();

  const filteredCompanies = useMemo(() => {
    if (!normalizedCompanyQuery) {
      return companies;
    }
    return companies.filter((company) => company.name.toLowerCase().includes(normalizedCompanyQuery));
  }, [companies, normalizedCompanyQuery]);

  const weakTopicNames = useMemo(
    () => new Set(topics.filter((topic) => topic.mastery < 60).map((topic) => topic.name.toLowerCase())),
    [topics],
  );

  const hardGaps = useMemo(
    () => topics.filter((topic) => topic.importance === "HIGH" && topic.mastery < 50),
    [topics],
  );

  const strongCompanyMatches = useMemo(
    () => companies.filter((company) => company.match >= 75).length,
    [companies],
  );

  return (
    <div className="space-y-6 page-transition">
      <section className="page-shell space-y-5">
        <header>
          <p className="hero-chip mb-3">Career Readiness Radar</p>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="text-primary" />
            Placement Readiness
          </h1>
          <p className="text-muted-foreground">
            Hard-signal readiness scoring from your live practice footprint.
          </p>
        </header>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="metric-card rounded-xl p-3">
            <p className="text-xs text-muted-foreground">Overall Readiness</p>
            <p className={`text-3xl font-bold ${overallReadiness >= 70 ? "text-success" : overallReadiness >= 50 ? "text-warning" : "text-destructive"}`}>
              {overallReadiness}%
            </p>
          </div>
          <div className="metric-card rounded-xl p-3">
            <p className="text-xs text-muted-foreground">Hard Gaps (High Priority)</p>
            <p className="text-3xl font-bold text-destructive">{hardGaps.length}</p>
          </div>
          <div className="metric-card rounded-xl p-3">
            <p className="text-xs text-muted-foreground">Strong Company Matches</p>
            <p className="text-3xl font-bold text-success">{strongCompanyMatches}</p>
          </div>
          <div className="metric-card rounded-xl p-3">
            <p className="text-xs text-muted-foreground">Tracked Topics</p>
            <p className="text-3xl font-bold">{topics.length}</p>
          </div>
        </div>

        <Progress value={overallReadiness} className="h-2" />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold flex items-center gap-2"><Target size={16} /> Topic Mastery</h2>
            <label className="text-sm">
              <span className="mr-2 text-muted-foreground">Importance</span>
              <select
                value={importanceFilter}
                onChange={(event) => setImportanceFilter(event.target.value as "ALL" | PlacementTopic["importance"])}
              >
                <option value="ALL">All</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </label>
          </div>

          {hardGaps.length > 0 && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
              <p className="font-semibold text-destructive flex items-center gap-2">
                <TriangleAlert size={14} /> Hard Check Alert
              </p>
              <p className="mt-1 text-muted-foreground">
                High-priority gaps detected in: {hardGaps.map((topic) => topic.name).join(", ")}
              </p>
            </div>
          )}

          <div className="space-y-3">
            {!loading && filteredTopics.length === 0 && (
              <div className="glass-card p-4 text-sm text-muted-foreground">
                No submission-based readiness data yet. Solve problems to generate live placement insights.
              </div>
            )}
            {filteredTopics.map((topic) => (
              <div key={topic.name} className="glass-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {topic.mastery >= 70
                      ? <CheckCircle2 size={14} className="text-success" />
                      : <TriangleAlert size={14} className={topic.mastery >= 50 ? "text-warning" : "text-destructive"} />}
                    <span className="font-medium text-sm">{topic.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-xs ${topic.importance === "HIGH" ? "text-destructive" : topic.importance === "MEDIUM" ? "text-warning" : "text-muted-foreground"}`}
                    >
                      {topic.importance}
                    </Badge>
                    <span className="text-sm font-mono">{topic.mastery}%</span>
                  </div>
                </div>
                <Progress value={topic.mastery} className="h-1.5" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold flex items-center gap-2"><Briefcase size={16} /> Company Matches</h2>
            <div className="relative w-full sm:w-64">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={companyQuery}
                onChange={(event) => setCompanyQuery(event.target.value)}
                className="pl-9"
                placeholder="Search company"
              />
            </div>
          </div>

          <div className="space-y-3">
            {!loading && filteredCompanies.length === 0 && (
              <div className="glass-card p-4 text-sm text-muted-foreground">
                Company match scores will appear as soon as enough live activity is available.
              </div>
            )}
            {filteredCompanies.map((company) => {
              const gapTopics = company.requiredTopics.filter((topic) => weakTopicNames.has(topic.toLowerCase()));
              return (
                <div key={company.name} className="glass-card p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{company.name}</h3>
                    <span className={`text-sm font-bold ${company.match >= 75 ? "text-success" : company.match >= 60 ? "text-warning" : "text-destructive"}`}>
                      {company.match}% match
                    </span>
                  </div>
                  <Progress value={company.match} className="h-1.5" />
                  <div className="flex gap-1 flex-wrap">
                    {company.requiredTopics.map((topic) => (
                      <Badge key={`${company.name}-${topic}`} variant="outline" className="text-xs">{topic}</Badge>
                    ))}
                  </div>
                  {gapTopics.length > 0 && (
                    <p className="text-xs text-destructive">
                      Gap topics for this company: {gapTopics.join(", ")}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
