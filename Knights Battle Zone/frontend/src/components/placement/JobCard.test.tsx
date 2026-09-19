import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import JobCard from "./JobCard";
import type { Job } from "@/lib/types";

const baseJob: Job = {
  id: 11,
  title: "Backend Engineer",
  companyId: 99,
  companyName: "Knights Battle Zone Labs",
  location: "Remote",
  postedAt: "2026-03-01T10:00:00Z",
  description: "Build and maintain APIs.",
  status: "OPEN",
};

describe("JobCard", () => {
  it("renders title, subtitle and description", () => {
    render(<JobCard job={baseJob} />);

    expect(screen.getByText("Backend Engineer")).toBeInTheDocument();
    expect(screen.getByText("Knights Battle Zone Labs")).toBeInTheDocument();
    expect(screen.getByText("Build and maintain APIs.")).toBeInTheDocument();
  });

  it("falls back to location when company name is missing", () => {
    render(<JobCard job={{ ...baseJob, companyName: undefined, location: "Bengaluru" }} />);
    expect(screen.getByText("Bengaluru")).toBeInTheDocument();
  });

  it("shows posted date in local format", () => {
    render(<JobCard job={baseJob} />);
    expect(screen.getByText(new Date(baseJob.postedAt).toLocaleDateString())).toBeInTheDocument();
  });
});

