import { describe, expect, it } from "vitest";

import {
  LEADERBOARD_DEFAULT_FILTERS,
  buildLeaderboardSearchParams,
  countActiveLeaderboardFilters,
  parseLeaderboardFilters,
} from "./leaderboardFilters";

describe("leaderboardFilters", () => {
  it("parses query params into typed filters", () => {
    const params = new URLSearchParams(
      "region=North&country=India&college=ABC&department=CSE&mode=SPEED&difficulty=HARD&timeRange=week&page=2&size=40",
    );

    const parsed = parseLeaderboardFilters(params);

    expect(parsed).toEqual({
      region: "North",
      country: "India",
      college: "ABC",
      department: "CSE",
      mode: "SPEED",
      difficulty: "HARD",
      timeRange: "week",
      page: 2,
      size: 40,
    });
  });

  it("falls back to safe defaults for invalid params", () => {
    const params = new URLSearchParams("timeRange=invalid&page=-1&size=1000&difficulty=abc");
    const parsed = parseLeaderboardFilters(params);

    expect(parsed.timeRange).toBe("all-time");
    expect(parsed.page).toBe(0);
    expect(parsed.size).toBe(100);
    expect(parsed.difficulty).toBeUndefined();
  });

  it("builds compact shareable query params", () => {
    const params = buildLeaderboardSearchParams({
      ...LEADERBOARD_DEFAULT_FILTERS,
      country: "India",
      mode: "SPEED",
      page: 3,
    });

    expect(params.toString()).toBe("country=India&mode=SPEED&page=3");
  });

  it("counts only active filters", () => {
    const count = countActiveLeaderboardFilters({
      ...LEADERBOARD_DEFAULT_FILTERS,
      country: "India",
      college: "XYZ",
      timeRange: "today",
    });

    expect(count).toBe(3);
  });
});
