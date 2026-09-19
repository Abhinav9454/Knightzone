import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { placementApi } from "@/lib/api";
import type { Application, Job, PlacementDashboardStats } from "@/lib/types";

const EMPTY_DASHBOARD: PlacementDashboardStats = {
  totalJobs: 0,
  openJobs: 0,
  myApplications: 0,
  interviewsScheduled: 0,
  companiesHiring: 0,
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<PlacementDashboardStats>(EMPTY_DASHBOARD);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [dashboard, jobsResponse, apps] = await Promise.all([
          placementApi.getDashboard(),
          placementApi.getJobs({ page: 0, size: 6 }),
          placementApi.getMyApplications(),
        ]);

        if (cancelled) return;

        const dashboardData = dashboard ?? EMPTY_DASHBOARD;
        const jobsData = jobsResponse?.data ?? [];
        const applicationsData = apps ?? [];

        setStats({
          totalJobs: dashboardData.totalJobs ?? jobsData.length,
          openJobs: dashboardData.openJobs ?? jobsData.length,
          myApplications: dashboardData.myApplications ?? applicationsData.length,
          interviewsScheduled: dashboardData.interviewsScheduled ?? 0,
          companiesHiring: dashboardData.companiesHiring ?? 0,
        });
        setJobs(jobsData);
        setApplications(applicationsData);
      } catch {
        if (cancelled) return;
        setError("Unable to load placement dashboard right now.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const recentApplications = useMemo(
    () =>
      [...applications]
        .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime())
        .slice(0, 5),
    [applications],
  );

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Placement - Student Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome back, {user?.name ?? "Student"}. Track opportunities and your application pipeline.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        <MetricCard label="Total Jobs" value={stats.totalJobs} loading={loading} />
        <MetricCard label="Open Jobs" value={stats.openJobs} loading={loading} />
        <MetricCard label="My Applications" value={stats.myApplications} loading={loading} />
        <MetricCard label="Interviews" value={stats.interviewsScheduled} loading={loading} />
        <MetricCard label="Companies Hiring" value={stats.companiesHiring} loading={loading} />
      </div>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Latest Open Jobs</h2>
            <span className="text-xs text-muted-foreground">{jobs.length} shown</span>
          </div>
          <div className="mt-3 space-y-3">
            {!loading && jobs.length === 0 && (
              <p className="text-sm text-muted-foreground">No open jobs available right now.</p>
            )}
            {jobs.map((job) => (
              <article key={job.id} className="rounded-md border p-3">
                <p className="font-medium">{job.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {job.companyName ?? "Company"} {job.location ? `| ${job.location}` : ""}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {job.employmentType ?? "Role"} {job.salaryRange ? `| ${job.salaryRange}` : ""}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Applications</h2>
            <span className="text-xs text-muted-foreground">{recentApplications.length} shown</span>
          </div>
          <div className="mt-3 space-y-3">
            {!loading && recentApplications.length === 0 && (
              <p className="text-sm text-muted-foreground">You have not applied to any jobs yet.</p>
            )}
            {recentApplications.map((app) => (
              <article key={app.id} className="rounded-md border p-3">
                <p className="font-medium">Job #{app.jobId}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Status: <span className="font-semibold">{app.status}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Applied: {new Date(app.appliedAt).toLocaleString()}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricCard({ label, value, loading }: { label: string; value: number; loading: boolean }) {
  return (
    <article className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </article>
  );
}

