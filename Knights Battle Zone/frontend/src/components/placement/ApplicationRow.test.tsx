import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ApplicationRow from "./ApplicationRow";
import type { Application } from "@/lib/types";

const baseApplication: Application = {
  id: 501,
  jobId: 11,
  userId: 301,
  status: "APPLIED",
  appliedAt: "2026-03-02T10:00:00Z",
  updatedAt: "2026-03-02T10:00:00Z",
};

describe("ApplicationRow", () => {
  it("renders fallback user label and default cover letter", () => {
    render(<ApplicationRow app={baseApplication} />);

    expect(screen.getByText("User #301")).toBeInTheDocument();
    expect(screen.getByText("No cover letter")).toBeInTheDocument();
    expect(screen.getByText("APPLIED")).toBeInTheDocument();
  });

  it("renders provided candidate label when available", () => {
    render(
      <ApplicationRow
        app={{
          ...baseApplication,
          coverLetter: "Interested in backend role",
          // legacy field from some API payloads
          candidateName: "Abhinav",
        } as Application & { candidateName: string }}
      />,
    );

    expect(screen.getByText("Abhinav")).toBeInTheDocument();
    expect(screen.getByText("Interested in backend role")).toBeInTheDocument();
  });
});

