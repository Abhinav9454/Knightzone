import React from "react";
import type { Job } from "@/lib/types";

type JobCardProps = {
  job: Job;
  children?: React.ReactNode;
};

export default function JobCard({ job, children }: JobCardProps) {
  const subtitle = job.companyName ?? job.location ?? `Company #${job.companyId}`;
  const postedDate = job.postedAt ? new Date(job.postedAt).toLocaleDateString() : "--";

  return (
    <article className="rounded-lg border border-border/70 bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-medium">{job.title}</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="text-sm text-muted-foreground">{postedDate}</div>
      </div>

      {job.description && <p className="mt-2 text-sm text-muted-foreground">{job.description}</p>}
      {children && <div className="mt-4 border-t border-border/70 pt-3">{children}</div>}
    </article>
  );
}
