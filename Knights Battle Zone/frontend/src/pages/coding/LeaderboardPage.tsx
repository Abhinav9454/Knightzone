import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Trophy, Eye, Filter, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";

import { leaderboardApi } from "@/lib/api";
import type { LeaderboardEntry, LeaderboardFilters } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { useRealtimeRefresh } from "@/lib/realtime";
import { connectLeaderboardRealtime } from "@/lib/leaderboardRealtime";
import {
  LEADERBOARD_DEFAULT_FILTERS,
  buildLeaderboardSearchParams,
  countActiveLeaderboardFilters,
  parseLeaderboardFilters,
} from "@/lib/leaderboardFilters";
import { UserAvatar, LeaderboardBadge } from "@/components/AvatarAndBadges";
import ImageService from "@/lib/images";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";

type LeaderboardMeta = {
  total: number;
  page: number;
  size: number;
  appliedFilters: Record<string, string>;
};

const MODE_OPTIONS = ["ALL", "CLASSIC", "SUDDEN_DEATH", "SPEED", "ACCURACY"];
const DIFFICULTY_OPTIONS = ["ALL", "EASY", "MEDIUM", "HARD"];
const TIME_RANGE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "all-time", label: "All Time" },
] as const;

function LeaderboardSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="rounded-xl border border-border p-3">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="mt-2 h-4 w-2/3" />
        </div>
      ))}
    </div>
  );
}

function LeaderboardTable({ data, loading }: { data: LeaderboardEntry[]; loading: boolean }) {
  const { user } = useAuth();

  if (loading) {
    return <LeaderboardSkeleton />;
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center">
        <p className="font-medium">No leaderboard data for selected filters</p>
        <p className="text-sm text-muted-foreground mt-1">Try changing filters or time range.</p>
      </div>
    );
  }

  return (
    <>
      <div className="relative mb-8 h-96 hidden md:block">
        <div className="absolute inset-0 opacity-10 rounded-2xl overflow-hidden">
          <img src={ImageService.gaming.achievement()} alt="Achievement" className="w-full h-full object-cover" />
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-4 max-w-2xl mx-auto h-full items-end pb-8">
          {[1, 0, 2].map((idx) => {
            const entry = data[idx];
            if (!entry) return null;
            const heights = ["h-48", "h-64", "h-40"];
            const colors = ["text-accent", "text-primary", "text-warning"];
            const bgColors = ["bg-accent/20", "bg-primary/20", "bg-warning/20"];
            const borders = ["border-accent/50", "border-primary/50", "border-warning/50"];
            const placeLabel = ["2nd", "1st", "3rd"];

            return (
              <div key={entry.rank} className="flex flex-col items-center justify-end">
                <div className="text-center mb-4">
                  <UserAvatar username={entry.username} userId={entry.userId} size="lg" className="mx-auto mb-2" />
                  <p className="font-bold text-lg">{entry.username}</p>
                  <p className="text-sm text-muted-foreground">{entry.score} pts</p>
                </div>
                <div className={`w-full ${heights[idx]} ${bgColors[idx]} rounded-t-2xl flex items-center justify-center border-2 ${borders[idx]} border-b-0`}>
                  <div className="text-center p-4">
                    <p className="text-sm font-semibold">{placeLabel[idx]}</p>
                    <p className={`text-3xl font-black ${colors[idx]}`}>#{entry.rank}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-2 md:hidden">
        {data.map((entry) => {
          const isCurrentUser = entry.userId === user?.id;
          return (
            <article key={`${entry.rank}-${entry.userId}`} className={`rounded-xl border p-3 ${isCurrentUser ? "border-primary/60 bg-primary/10" : "border-border bg-card/65"}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">#{entry.rank} {entry.username}</p>
                <p className="font-bold text-primary">{entry.score}</p>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {entry.college || "No college"} | Solved {entry.problemsSolved}
              </p>
              {isCurrentUser && <p className="mt-1 text-xs text-primary">You</p>}
            </article>
          );
        })}
      </div>

      <div className="glass-card hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="p-3 font-medium w-16">Rank</th>
              <th className="p-3 font-medium">User</th>
              <th className="p-3 font-medium">College</th>
              <th className="p-3 font-medium">First AC</th>
              <th className="p-3 font-medium text-right">Score</th>
              <th className="p-3 font-medium text-right">Solved</th>
            </tr>
          </thead>
          <tbody>
            {data.map((entry) => {
              const isCurrentUser = entry.userId === user?.id;
              return (
                <tr key={`${entry.rank}-${entry.userId}`} className={`border-b border-border/50 transition-colors ${isCurrentUser ? "bg-primary/5" : "hover:bg-muted/30"}`}>
                  <td className="p-3">
                    <LeaderboardBadge rank={entry.rank} variant="badge" />
                  </td>
                  <td className="p-3 font-medium">
                    <div className="flex items-center gap-3">
                      <UserAvatar username={entry.username} userId={entry.userId} size="sm" />
                      <div>
                        <div className="font-semibold">{entry.username}</div>
                        {isCurrentUser && <span className="text-xs text-primary">You</span>}
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground">{entry.college || "N/A"}</td>
                  <td className="p-3 text-muted-foreground">
                    {entry.firstAcceptedAt ? new Date(entry.firstAcceptedAt).toLocaleString() : "N/A"}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-primary">{entry.score}</td>
                  <td className="p-3 text-right text-muted-foreground">{entry.problemsSolved}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

type FilterFieldsProps = {
  value: LeaderboardFilters;
  onChange: (next: LeaderboardFilters) => void;
};

function FilterFields({ value, onChange }: FilterFieldsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Input
        value={value.region ?? ""}
        onChange={(event) => onChange({ ...value, region: event.target.value || undefined })}
        placeholder="Region"
        aria-label="Filter by region"
      />
      <Input
        value={value.country ?? ""}
        onChange={(event) => onChange({ ...value, country: event.target.value || undefined })}
        placeholder="Country"
        aria-label="Filter by country"
      />
      <Input
        value={value.college ?? ""}
        onChange={(event) => onChange({ ...value, college: event.target.value || undefined })}
        placeholder="College"
        aria-label="Filter by college"
      />
      <Input
        value={value.department ?? ""}
        onChange={(event) => onChange({ ...value, department: event.target.value || undefined })}
        placeholder="Department"
        aria-label="Filter by department"
      />

      <Select value={value.mode ?? "ALL"} onValueChange={(next) => onChange({ ...value, mode: next === "ALL" ? undefined : next })}>
        <SelectTrigger aria-label="Filter by mode">
          <SelectValue placeholder="Mode" />
        </SelectTrigger>
        <SelectContent>
          {MODE_OPTIONS.map((mode) => (
            <SelectItem key={mode} value={mode}>{mode === "ALL" ? "All Modes" : mode}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.difficulty ?? "ALL"}
        onValueChange={(next) => onChange({ ...value, difficulty: next === "ALL" ? undefined : next })}
      >
        <SelectTrigger aria-label="Filter by difficulty">
          <SelectValue placeholder="Difficulty" />
        </SelectTrigger>
        <SelectContent>
          {DIFFICULTY_OPTIONS.map((difficulty) => (
            <SelectItem key={difficulty} value={difficulty}>
              {difficulty === "ALL" ? "All Difficulty" : difficulty}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.timeRange}
        onValueChange={(next) => onChange({ ...value, timeRange: next as LeaderboardFilters["timeRange"] })}
      >
        <SelectTrigger aria-label="Filter by time range">
          <SelectValue placeholder="Time range" />
        </SelectTrigger>
        <SelectContent>
          {TIME_RANGE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [globalData, setGlobalData] = useState<LeaderboardEntry[]>([]);
  const [shadowData, setShadowData] = useState<LeaderboardEntry[]>([]);
  const [meta, setMeta] = useState<LeaderboardMeta>({
    total: 0,
    page: 0,
    size: LEADERBOARD_DEFAULT_FILTERS.size,
    appliedFilters: {},
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const hasErrorToast = useRef(false);
  const hasLoadedOnce = useRef(false);

  const filters = useMemo(
    () => parseLeaderboardFilters(searchParams),
    [searchParams],
  );
  const [draftFilters, setDraftFilters] = useState<LeaderboardFilters>(filters);

  useEffect(() => {
    setDraftFilters(filters);
  }, [filters]);

  const activeFilterCount = useMemo(() => countActiveLeaderboardFilters(filters), [filters]);

  const updateUrlFilters = useCallback((next: LeaderboardFilters, replace = true) => {
    const params = buildLeaderboardSearchParams(next);
    setSearchParams(params, { replace });
  }, [setSearchParams]);

  const loadLeaderboard = useCallback(async () => {
    if (hasLoadedOnce.current) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [globalLeaderboard, shadowLeaderboard] = await Promise.all([
        leaderboardApi.getGlobalFiltered(filters),
        leaderboardApi.getShadow(),
      ]);
      setGlobalData(globalLeaderboard.content);
      setShadowData(shadowLeaderboard);
      setMeta({
        total: globalLeaderboard.total,
        page: globalLeaderboard.page,
        size: globalLeaderboard.size,
        appliedFilters: globalLeaderboard.appliedFilters,
      });
      hasErrorToast.current = false;
    } catch {
      if (!hasErrorToast.current) {
        toast.error("Unable to refresh leaderboard right now.");
        hasErrorToast.current = true;
      }
    } finally {
      hasLoadedOnce.current = true;
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  useRealtimeRefresh(loadLeaderboard, { intervalMs: 12000, scope: "leaderboard" });

  const loadRef = useRef(loadLeaderboard);
  useEffect(() => {
    loadRef.current = loadLeaderboard;
  }, [loadLeaderboard]);

  useEffect(() => {
    const connection = connectLeaderboardRealtime({
      onUpdate: () => {
        void loadRef.current();
      },
    });
    return () => {
      connection.close();
    };
  }, []);

  const userGlobal = globalData.find((entry) => entry.userId === user?.id);
  const userShadow = shadowData.find((entry) => entry.userId === user?.id);
  const totalPages = Math.max(1, Math.ceil(meta.total / Math.max(1, meta.size)));
  const canGoPrev = filters.page > 0;
  const canGoNext = filters.page + 1 < totalPages;

  const appliedChips = [
    filters.region ? { key: "region", label: `Region: ${filters.region}` } : null,
    filters.country ? { key: "country", label: `Country: ${filters.country}` } : null,
    filters.college ? { key: "college", label: `College: ${filters.college}` } : null,
    filters.department ? { key: "department", label: `Department: ${filters.department}` } : null,
    filters.mode ? { key: "mode", label: `Mode: ${filters.mode}` } : null,
    filters.difficulty ? { key: "difficulty", label: `Difficulty: ${filters.difficulty}` } : null,
    filters.timeRange !== "all-time" ? { key: "timeRange", label: `Range: ${filters.timeRange}` } : null,
  ].filter((chip): chip is { key: string; label: string } => Boolean(chip));

  const removeFilter = (key: string) => {
    const next: LeaderboardFilters = { ...filters, page: 0 };
    if (key === "timeRange") {
      next.timeRange = "all-time";
    } else if (key === "region") {
      next.region = undefined;
    } else if (key === "country") {
      next.country = undefined;
    } else if (key === "college") {
      next.college = undefined;
    } else if (key === "department") {
      next.department = undefined;
    } else if (key === "mode") {
      next.mode = undefined;
    } else if (key === "difficulty") {
      next.difficulty = undefined;
    }
    updateUrlFilters(next);
  };

  const applyDraftFilters = () => {
    updateUrlFilters({ ...draftFilters, page: 0 });
    setFilterDrawerOpen(false);
  };

  const resetFilters = () => {
    setDraftFilters(LEADERBOARD_DEFAULT_FILTERS);
    updateUrlFilters(LEADERBOARD_DEFAULT_FILTERS);
    setFilterDrawerOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Leaderboard</h1>
          <p className="text-muted-foreground">Advanced ranking with real-time updates</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void loadLeaderboard()} className="gap-2">
            <RefreshCw size={14} /> Refresh
          </Button>
          <Drawer open={filterDrawerOpen} onOpenChange={setFilterDrawerOpen}>
            <DrawerTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 md:hidden">
                <Filter size={14} /> Filters
                {activeFilterCount > 0 && <Badge variant="secondary">{activeFilterCount}</Badge>}
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Leaderboard Filters</DrawerTitle>
                <DrawerDescription>Apply filters to narrow down rankings.</DrawerDescription>
              </DrawerHeader>
              <div className="px-4 pb-4 space-y-4">
                <FilterFields value={draftFilters} onChange={setDraftFilters} />
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={applyDraftFilters}>Apply</Button>
                  <Button variant="outline" className="flex-1" onClick={resetFilters}>Reset</Button>
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>

      <div className="glass-card p-4 space-y-4 hidden md:block">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-primary" />
            <p className="text-sm font-medium">Filters</p>
            {activeFilterCount > 0 && <Badge variant="secondary">{activeFilterCount} active</Badge>}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={resetFilters}>Reset</Button>
            <Button size="sm" onClick={applyDraftFilters}>Apply</Button>
          </div>
        </div>
        <FilterFields value={draftFilters} onChange={setDraftFilters} />
      </div>

      {appliedChips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {appliedChips.map((chip) => (
            <Badge key={chip.key} variant="secondary" className="gap-1 pr-1">
              {chip.label}
              <button
                type="button"
                aria-label={`Remove ${chip.key} filter`}
                className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                onClick={() => removeFilter(chip.key)}
              >
                <X size={12} />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground">Your Global Standing</p>
          {userGlobal ? (
            <p className="text-sm mt-1">
              Rank <span className="font-bold">#{userGlobal.rank}</span> - Score <span className="font-bold">{userGlobal.score}</span>
            </p>
          ) : (
            <p className="text-sm mt-1 text-muted-foreground">No rank yet for current filters.</p>
          )}
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground">Your Shadow Standing</p>
          {userShadow ? (
            <p className="text-sm mt-1">
              Rank <span className="font-bold">#{userShadow.rank}</span> - Score <span className="font-bold">{userShadow.score}</span>
            </p>
          ) : (
            <p className="text-sm mt-1 text-muted-foreground">No rank yet.</p>
          )}
        </div>
      </div>

      <Tabs defaultValue="global">
        <TabsList className="bg-muted">
          <TabsTrigger value="global" className="gap-2"><Trophy size={14} /> Global</TabsTrigger>
          <TabsTrigger value="shadow" className="gap-2"><Eye size={14} /> Shadow Ranking</TabsTrigger>
        </TabsList>
        <TabsContent value="global" className="mt-4 space-y-4">
          <LeaderboardTable data={globalData} loading={loading} />
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs text-muted-foreground">
              Showing page {meta.page + 1} of {totalPages} ({meta.total} total)
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={!canGoPrev}
                onClick={() => updateUrlFilters({ ...filters, page: Math.max(0, filters.page - 1) }, false)}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={!canGoNext}
                onClick={() => updateUrlFilters({ ...filters, page: filters.page + 1 }, false)}
              >
                Next
              </Button>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="shadow" className="mt-4">
          <div className="glass-card p-4 mb-4 text-sm text-muted-foreground border-primary/20">
            <Eye size={14} className="inline mr-2 text-primary" />
            Shadow ranking shows what rankings would look like with an alternative scoring algorithm.
          </div>
          <LeaderboardTable data={shadowData} loading={loading} />
        </TabsContent>
      </Tabs>

      {Object.keys(meta.appliedFilters).length > 0 && (
        <p className="text-xs text-muted-foreground">
          Server applied filters: {Object.entries(meta.appliedFilters).map(([key, value]) => `${key}=${value}`).join(", ")}
        </p>
      )}
    </div>
  );
}
