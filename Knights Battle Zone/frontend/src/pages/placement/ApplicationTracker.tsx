import React, { useEffect, useState } from "react";
import type { Application } from "@/lib/types";
import { placementApi } from "@/lib/api";
import ApplicationRow from "@/components/placement/ApplicationRow";

export default function ApplicationTracker() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const data = await placementApi.getMyApplications();
        setApplications(data ?? []);
      } catch {
        setApplications([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Application Tracker</h1>
      {!loading && applications.length === 0 && (
        <p className="text-sm text-muted-foreground">You have not applied to any placement job yet.</p>
      )}
      <div className="rounded-lg border p-3">
        {applications.map((app) => (
          <ApplicationRow key={app.id} app={app} />
        ))}
      </div>
    </div>
  );
}
