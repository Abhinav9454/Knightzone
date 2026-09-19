import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

import TrackerPage from "./TrackerPage";
import type { TrackerConnection, TrackerPerformanceReport } from "@/lib/types";

const apiMocks = vi.hoisted(() => ({
  getConnections: vi.fn(),
  getReport: vi.fn(),
  connectPlatform: vi.fn(),
  syncPlatform: vi.fn(),
  syncAll: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  trackerApi: {
    getConnections: (...args: unknown[]) => apiMocks.getConnections(...args),
    getReport: (...args: unknown[]) => apiMocks.getReport(...args),
    connectPlatform: (...args: unknown[]) => apiMocks.connectPlatform(...args),
    syncPlatform: (...args: unknown[]) => apiMocks.syncPlatform(...args),
    syncAll: (...args: unknown[]) => apiMocks.syncAll(...args),
  },
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: 1, name: "Test User", email: "test@example.com", role: "STUDENT" },
  }),
}));

vi.mock("@/lib/realtime", () => ({
  useRealtimeRefresh: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const reportFixture: TrackerPerformanceReport = {
  generatedAt: "2026-03-13T00:00:00Z",
  summary: {
    totalSolved: 0,
    weeklySolved: 0,
    monthlySolved: 0,
    currentStreakDays: 0,
    bestStreakDays: 0,
    platformSolvedCounts: {},
    difficultyCounts: {},
    topicCounts: {},
    dailySolvedLast30Days: {},
    strongTopics: [],
    weakTopics: [],
    githubRepositories: 0,
    githubCommits: 0,
    githubLanguages: {},
    githubTopRepos: [],
    recentProblems: [],
    lastSyncedAt: null,
  },
  weeklyInsight: {
    summary: "No data yet",
    recommendations: [],
    aiGenerated: false,
    generatedAt: "2026-03-13T00:00:00Z",
  },
  skillGap: {
    targetRole: "SDE",
    strongTopics: [],
    weakTopics: [],
    recommendedPractice: [],
    aiGenerated: false,
  },
};

describe("TrackerPage supported platforms", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMocks.getConnections.mockResolvedValue([] as TrackerConnection[]);
    apiMocks.getReport.mockResolvedValue(reportFixture);
    apiMocks.connectPlatform.mockResolvedValue(undefined);
    apiMocks.syncPlatform.mockResolvedValue(undefined);
    apiMocks.syncAll.mockResolvedValue([]);
  });

  it("shows only supported tracker platforms in setup selector", async () => {
    render(
      <MemoryRouter initialEntries={["/tracker/setup"]}>
        <TrackerPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(apiMocks.getConnections).toHaveBeenCalled());

    const select = await screen.findByLabelText("Platform");
    const options = Array.from((select as HTMLSelectElement).options).map((option) => option.value);

    expect(options).toEqual(["LEETCODE", "CODEFORCES", "GITHUB"]);
    expect(screen.queryByRole("option", { name: "GEEKSFORGEEKS" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "HACKERRANK" })).not.toBeInTheDocument();
  });
});
