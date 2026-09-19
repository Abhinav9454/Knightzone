import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import JobList from "./JobList";
import type { Job } from "@/lib/types";

const apiMocks = vi.hoisted(() => ({
  getJobs: vi.fn(),
  getMyApplications: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  placementApi: {
    getJobs: (...args: unknown[]) => apiMocks.getJobs(...args),
    getMyApplications: (...args: unknown[]) => apiMocks.getMyApplications(...args),
  },
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    isAdmin: false,
  }),
}));

const jobs: Job[] = [
  {
    id: 1,
    title: "SDE Intern",
    companyId: 7,
    companyName: "Tech Nova",
    location: "Remote",
    postedAt: "2026-03-01T10:00:00Z",
    description: "Build scalable features",
    status: "OPEN",
  },
  {
    id: 2,
    title: "Frontend Engineer",
    companyId: 8,
    companyName: "UI Forge",
    location: "Delhi",
    postedAt: "2026-03-02T10:00:00Z",
    description: "Ship polished UI",
    status: "OPEN",
  },
];

describe("JobList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMocks.getMyApplications.mockResolvedValue([]);
  });

  it("loads and renders jobs from API", async () => {
    apiMocks.getJobs.mockResolvedValue({ data: jobs });

    render(<JobList />);

    await waitFor(() => {
      expect(screen.getByText("SDE Intern")).toBeInTheDocument();
      expect(screen.getByText("Frontend Engineer")).toBeInTheDocument();
    });

    expect(apiMocks.getJobs).toHaveBeenCalledWith({ page: 0, size: 50 });
  });

  it("shows empty state on API failure", async () => {
    apiMocks.getJobs.mockRejectedValue(new Error("network"));

    render(<JobList />);

    await waitFor(() => {
      expect(screen.getByText("No jobs available right now.")).toBeInTheDocument();
    });
  });
});
