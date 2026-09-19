import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import StudentDashboard from "./StudentDashboard";
import type { Application, Job, PlacementDashboardStats } from "@/lib/types";

const authMocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
}));

const apiMocks = vi.hoisted(() => ({
  getDashboard: vi.fn(),
  getJobs: vi.fn(),
  getMyApplications: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => authMocks.useAuth(),
}));

vi.mock("@/lib/api", () => ({
  placementApi: {
    getDashboard: (...args: unknown[]) => apiMocks.getDashboard(...args),
    getJobs: (...args: unknown[]) => apiMocks.getJobs(...args),
    getMyApplications: (...args: unknown[]) => apiMocks.getMyApplications(...args),
  },
}));

describe("StudentDashboard", () => {
  const stats: PlacementDashboardStats = {
    totalJobs: 12,
    openJobs: 7,
    myApplications: 3,
    interviewsScheduled: 1,
    companiesHiring: 5,
  };

  const jobs: Job[] = [
    {
      id: 10,
      title: "Backend Engineer",
      companyId: 3,
      companyName: "Algo Labs",
      postedAt: "2026-03-01T10:00:00Z",
      location: "Remote",
      status: "OPEN",
    },
  ];

  const applications: Application[] = [
    {
      id: 99,
      jobId: 10,
      userId: 1,
      status: "APPLIED",
      appliedAt: "2026-03-02T10:00:00Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.useAuth.mockReturnValue({
      user: { id: 1, name: "Abhinav", email: "abhinav@example.com" },
    });
  });

  it("renders placement metrics and lists", async () => {
    apiMocks.getDashboard.mockResolvedValue(stats);
    apiMocks.getJobs.mockResolvedValue({ data: jobs });
    apiMocks.getMyApplications.mockResolvedValue(applications);

    render(<StudentDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Placement - Student Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Backend Engineer")).toBeInTheDocument();
      expect(screen.getByText("My Applications")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
    });
  });

  it("shows fallback error state when API fails", async () => {
    apiMocks.getDashboard.mockRejectedValue(new Error("network"));
    apiMocks.getJobs.mockResolvedValue({ data: [] });
    apiMocks.getMyApplications.mockResolvedValue([]);

    render(<StudentDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Unable to load placement dashboard right now.")).toBeInTheDocument();
    });
  });
});
