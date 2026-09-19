import type { LeaderboardFilters, LeaderboardTimeRange } from "./types";

export const LEADERBOARD_DEFAULT_FILTERS: LeaderboardFilters = {
  timeRange: "all-time",
  page: 0,
  size: 20,
};

const VALID_TIME_RANGES: LeaderboardTimeRange[] = ["today", "week", "all-time"];
const VALID_DIFFICULTY = ["EASY", "MEDIUM", "HARD"];

export const normalizeFilterValue = (value?: string | null) => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const parseLeaderboardFilters = (searchParams: URLSearchParams): LeaderboardFilters => {
  const rawTimeRange = normalizeFilterValue(searchParams.get("timeRange"))?.toLowerCase();
  const rawPage = Number(searchParams.get("page"));
  const rawSize = Number(searchParams.get("size"));
  const rawDifficulty = normalizeFilterValue(searchParams.get("difficulty"))?.toUpperCase();

  return {
    region: normalizeFilterValue(searchParams.get("region")),
    country: normalizeFilterValue(searchParams.get("country")),
    college: normalizeFilterValue(searchParams.get("college")),
    department: normalizeFilterValue(searchParams.get("department")),
    mode: normalizeFilterValue(searchParams.get("mode")),
    difficulty: rawDifficulty && VALID_DIFFICULTY.includes(rawDifficulty) ? rawDifficulty : undefined,
    timeRange: VALID_TIME_RANGES.includes(rawTimeRange as LeaderboardTimeRange)
      ? (rawTimeRange as LeaderboardTimeRange)
      : LEADERBOARD_DEFAULT_FILTERS.timeRange,
    page: Number.isFinite(rawPage) && rawPage >= 0 ? Math.floor(rawPage) : LEADERBOARD_DEFAULT_FILTERS.page,
    size:
      Number.isFinite(rawSize) && rawSize > 0
        ? Math.min(100, Math.floor(rawSize))
        : LEADERBOARD_DEFAULT_FILTERS.size,
  };
};

export const buildLeaderboardSearchParams = (filters: LeaderboardFilters) => {
  const params = new URLSearchParams();
  if (filters.region) params.set("region", filters.region);
  if (filters.country) params.set("country", filters.country);
  if (filters.college) params.set("college", filters.college);
  if (filters.department) params.set("department", filters.department);
  if (filters.mode) params.set("mode", filters.mode);
  if (filters.difficulty) params.set("difficulty", filters.difficulty);
  if (filters.timeRange !== LEADERBOARD_DEFAULT_FILTERS.timeRange) params.set("timeRange", filters.timeRange);
  if (filters.page !== LEADERBOARD_DEFAULT_FILTERS.page) params.set("page", String(filters.page));
  if (filters.size !== LEADERBOARD_DEFAULT_FILTERS.size) params.set("size", String(filters.size));
  return params;
};

export const countActiveLeaderboardFilters = (filters: LeaderboardFilters) => {
  let count = 0;
  if (filters.region) count += 1;
  if (filters.country) count += 1;
  if (filters.college) count += 1;
  if (filters.department) count += 1;
  if (filters.mode) count += 1;
  if (filters.difficulty) count += 1;
  if (filters.timeRange !== LEADERBOARD_DEFAULT_FILTERS.timeRange) count += 1;
  return count;
};
