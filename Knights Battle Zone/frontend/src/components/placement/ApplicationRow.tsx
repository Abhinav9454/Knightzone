import React from "react";
import type { Application } from "@/lib/types";

type ApplicationRowView = Application & {
  candidateName?: string;
  applicantId?: number | string;
};

export default function ApplicationRow({ app }: { app: Application }) {
  const row = app as ApplicationRowView;
  const displayName =
    row.candidateName ??
    (row.applicantId !== undefined && row.applicantId !== null
      ? String(row.applicantId)
      : `User #${app.userId}`);

  return (
    <div className="flex items-center justify-between border-b py-2">
      <div>
        <div className="font-medium">{displayName}</div>
        <div className="text-sm text-muted-foreground">{app.coverLetter ?? "No cover letter"}</div>
      </div>
      <div className="text-sm">{app.status}</div>
    </div>
  );
}
