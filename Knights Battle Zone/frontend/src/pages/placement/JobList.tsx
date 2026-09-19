import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { placementApi } from "@/lib/api";
import JobCard from "@/components/placement/JobCard";
import type { Application, Job } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type ApplyDraft = {
  resumeUrl: string;
  coverLetter: string;
};

export default function JobList() {
  const { isAdmin } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingJobId, setSubmittingJobId] = useState<number | null>(null);
  const [activeApplyJobId, setActiveApplyJobId] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<number, ApplyDraft>>({});
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [jobsResponse, myApplications] = await Promise.all([
        placementApi.getJobs({ page: 0, size: 50 }),
        placementApi.getMyApplications().catch(() => []),
      ]);
      setJobs(jobsResponse.data ?? []);
      setApplications(myApplications ?? []);
    } catch {
      setJobs([]);
      toast.error("Unable to load jobs right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return jobs;
    return jobs.filter((job) =>
      [job.title, job.companyName, job.location, job.description]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query)),
    );
  }, [jobs, search]);

  const appliedJobIds = useMemo(() => new Set(applications.map((app) => app.jobId)), [applications]);

  const updateDraft = (jobId: number, field: keyof ApplyDraft, value: string) => {
    setDrafts((prev) => ({
      ...prev,
      [jobId]: {
        resumeUrl: prev[jobId]?.resumeUrl ?? "",
        coverLetter: prev[jobId]?.coverLetter ?? "",
        [field]: value,
      },
    }));
  };

  const submitApplication = async (jobId: number) => {
    if (submittingJobId) return;
    setSubmittingJobId(jobId);
    try {
      const draft = drafts[jobId] ?? { resumeUrl: "", coverLetter: "" };
      const created = await placementApi.applyJob(jobId, {
        resumeUrl: draft.resumeUrl.trim() || undefined,
        coverLetter: draft.coverLetter.trim() || undefined,
      });
      setApplications((prev) => [created, ...prev]);
      setActiveApplyJobId(null);
      toast.success("Application submitted successfully.");
    } catch {
      toast.error("Application failed. Please try again.");
    } finally {
      setSubmittingJobId(null);
    }
  };

  return (
    <div className="space-y-5 p-4 md:p-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Placement Jobs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse open opportunities and apply directly from Knights Battle Zone.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search jobs, company, location..."
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20 md:w-80"
          />
          {isAdmin && (
            <Link
              to="/placement/jobs/new"
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              Create Job
            </Link>
          )}
        </div>
      </header>

      {!loading && filteredJobs.length === 0 && (
        <p className="rounded-md border border-border/70 bg-card p-4 text-sm text-muted-foreground">
          No jobs available right now.
        </p>
      )}

      <div className="grid gap-4">
        {filteredJobs.map((job) => {
          const alreadyApplied = appliedJobIds.has(job.id);
          const draft = drafts[job.id] ?? { resumeUrl: "", coverLetter: "" };
          const showApplyForm = activeApplyJobId === job.id;

          return (
            <JobCard key={job.id} job={job}>
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {job.salaryRange && <span className="rounded-full border px-2 py-1">Salary: {job.salaryRange}</span>}
                  {job.deadline && (
                    <span className="rounded-full border px-2 py-1">
                      Deadline: {new Date(job.deadline).toLocaleDateString()}
                    </span>
                  )}
                  <span className="rounded-full border px-2 py-1">Status: {job.status ?? "OPEN"}</span>
                </div>

                {!isAdmin && (
                  <div className="space-y-3">
                    {alreadyApplied ? (
                      <p className="text-sm font-medium text-emerald-600">You have already applied for this job.</p>
                    ) : (
                      <button
                        type="button"
                        className="rounded-md border border-primary px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10"
                        onClick={() => setActiveApplyJobId((prev) => (prev === job.id ? null : job.id))}
                      >
                        {showApplyForm ? "Hide Application Form" : "Apply Now"}
                      </button>
                    )}

                    {showApplyForm && (
                      <div className="grid gap-3 rounded-md border border-border bg-background p-3 md:grid-cols-2">
                        <label className="space-y-1 md:col-span-2">
                          <span className="text-xs font-medium text-muted-foreground">Resume URL</span>
                          <input
                            type="url"
                            value={draft.resumeUrl}
                            onChange={(event) => updateDraft(job.id, "resumeUrl", event.target.value)}
                            placeholder="https://drive.google.com/..."
                            className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                          />
                        </label>
                        <label className="space-y-1 md:col-span-2">
                          <span className="text-xs font-medium text-muted-foreground">Cover Letter</span>
                          <textarea
                            rows={3}
                            value={draft.coverLetter}
                            onChange={(event) => updateDraft(job.id, "coverLetter", event.target.value)}
                            placeholder="Write a short note for recruiter."
                            className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                          />
                        </label>
                        <div className="md:col-span-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() => void submitApplication(job.id)}
                            disabled={submittingJobId === job.id}
                            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {submittingJobId === job.id ? "Submitting..." : "Submit Application"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </JobCard>
          );
        })}
      </div>
    </div>
  );
}

