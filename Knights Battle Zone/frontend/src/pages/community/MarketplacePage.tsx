import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { PassageCard } from "@/components/marketplace/PassageCard";
import { PassageEditor } from "@/components/marketplace/PassageEditor";
import { TagFilter } from "@/components/marketplace/TagFilter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { marketplaceApi } from "@/lib/api";
import { isAdminRole } from "@/lib/auth-role";
import { useRealtimeRefresh } from "@/lib/realtime";
import type { MarketplaceModeration, MarketplaceModerationAudit, MarketplacePassage, MarketplaceSort } from "@/lib/types";

export default function MarketplacePage() {
  const { user } = useAuth();
  const isAdmin = isAdminRole(user?.role);

  const [featured, setFeatured] = useState<MarketplacePassage[]>([]);
  const [trending, setTrending] = useState<MarketplacePassage[]>([]);
  const [newest, setNewest] = useState<MarketplacePassage[]>([]);
  const [mine, setMine] = useState<MarketplacePassage[]>([]);
  const [selected, setSelected] = useState<MarketplacePassage | null>(null);

  const [search, setSearch] = useState("");
  const [tag, setTag] = useState("");
  const [sort, setSort] = useState<MarketplaceSort>("new");
  const [discover, setDiscover] = useState<MarketplacePassage[]>([]);
  const [discoverPage, setDiscoverPage] = useState(0);
  const [discoverTotalPages, setDiscoverTotalPages] = useState(0);
  const [discoverTotalElements, setDiscoverTotalElements] = useState(0);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [moderationRows, setModerationRows] = useState<MarketplaceModeration[]>([]);
  const [moderationStatus, setModerationStatus] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [moderationPage, setModerationPage] = useState(0);
  const [moderationTotalPages, setModerationTotalPages] = useState(0);
  const [moderationTotalElements, setModerationTotalElements] = useState(0);
  const [loadingModeration, setLoadingModeration] = useState(false);
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [moderationNotes, setModerationNotes] = useState<Record<number, string>>({});
  const [featuredOnApprove, setFeaturedOnApprove] = useState<Record<number, boolean>>({});
  const [auditRows, setAuditRows] = useState<MarketplaceModerationAudit[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  const load = useCallback(async () => {
    try {
      const [featuredRes, trendingRes, newRes, myRes] = await Promise.all([
        marketplaceApi.getFeatured({ page: 0, size: 6 }),
        marketplaceApi.getTrending({ page: 0, size: 6 }),
        marketplaceApi.listPassages({ sort: "new", page: 0, size: 6 }),
        marketplaceApi.listPassages({ mine: true, page: 0, size: 6 }),
      ]);
      setFeatured(featuredRes.content || []);
      setTrending(trendingRes.content || []);
      setNewest(newRes.content || []);
      setMine(myRes.content || []);
    } catch {
      toast.error("Unable to load marketplace sections.");
    } finally {
      setLoading(false);
    }
  }, []);

  useRealtimeRefresh(load, { intervalMs: 12000, scope: "marketplace" });

  const loadModerationReports = useCallback(async () => {
    if (!isAdmin) {
      setModerationRows([]);
      setModerationPage(0);
      setModerationTotalPages(0);
      setModerationTotalElements(0);
      return;
    }

    setLoadingModeration(true);
    try {
      const statusFilter = moderationStatus === "ALL" ? undefined : moderationStatus;
      const response = await marketplaceApi.getModerationReports({
        status: statusFilter,
        page: moderationPage,
        size: 10,
      });
      setModerationRows(response.content || []);
      setModerationTotalPages(response.totalPages ?? 0);
      setModerationTotalElements(response.totalElements ?? 0);
      setModerationPage(response.number ?? moderationPage);
    } catch {
      toast.error("Unable to load moderation reports.");
    } finally {
      setLoadingModeration(false);
    }
  }, [isAdmin, moderationPage, moderationStatus]);

  useRealtimeRefresh(loadModerationReports, {
    enabled: isAdmin,
    intervalMs: 12000,
    scope: "marketplace",
  });

  const loadModerationAudit = useCallback(async () => {
    if (!isAdmin) {
      setAuditRows([]);
      return;
    }

    setLoadingAudit(true);
    try {
      const response = await marketplaceApi.getModerationAudit({ page: 0, size: 8 });
      setAuditRows(response.content || []);
    } catch {
      toast.error("Unable to load moderation audit trail.");
    } finally {
      setLoadingAudit(false);
    }
  }, [isAdmin]);

  useRealtimeRefresh(loadModerationAudit, {
    enabled: isAdmin,
    intervalMs: 15000,
    scope: "marketplace",
  });

  const discoverPassages = async (page = 0) => {
    setDiscovering(true);
    try {
      const res = await marketplaceApi.listPassages({
        search: search.trim() || undefined,
        tag: tag.trim() || undefined,
        sort,
        page,
        size: 12,
      });
      setDiscover(res.content || []);
      setDiscoverPage(res.number ?? page);
      setDiscoverTotalPages(res.totalPages ?? 0);
      setDiscoverTotalElements(res.totalElements ?? (res.content?.length ?? 0));
    } catch {
      toast.error("Discover query failed.");
    } finally {
      setDiscovering(false);
    }
  };

  const createPassage = async (payload: { title: string; content: string; tags: string[]; syntaxMode: string }) => {
    setSaving(true);
    try {
      await marketplaceApi.createPassage(payload);
      toast.success("Passage submitted. It will appear after moderation approval.");
      await load();
    } catch {
      toast.error("Unable to publish passage.");
    } finally {
      setSaving(false);
    }
  };

  const openPassage = async (passageId: number) => {
    try {
      const data = await marketplaceApi.getPassage(passageId);
      setSelected(data);
    } catch {
      toast.error("Unable to open passage.");
    }
  };

  const ratePassage = async (passageId: number, rating: number) => {
    try {
      await marketplaceApi.ratePassage(passageId, { rating, completed: true });
      toast.success("Rating saved.");
      await Promise.all([discoverPassages(discoverPage), load()]);
      if (selected?.id === passageId) {
        setSelected(await marketplaceApi.getPassage(passageId));
      }
    } catch {
      toast.error("Unable to rate passage.");
    }
  };

  const bookmarkPassage = async (passageId: number) => {
    try {
      const res = await marketplaceApi.toggleBookmark(passageId);
      toast.success(res.bookmarked ? "Passage bookmarked." : "Bookmark removed.");
      await Promise.all([discoverPassages(discoverPage), load()]);
      if (selected?.id === passageId) {
        setSelected(await marketplaceApi.getPassage(passageId));
      }
    } catch {
      toast.error("Unable to update bookmark.");
    }
  };

  const reportPassage = async (passageId: number) => {
    const reason = window.prompt("Report reason:");
    if (!reason?.trim()) return;
    try {
      await marketplaceApi.reportPassage(passageId, reason.trim());
      toast.success("Report submitted.");
    } catch {
      toast.error("Unable to submit report.");
    }
  };

  const reviewModeration = async (moderation: MarketplaceModeration, decision: "APPROVE" | "REJECT") => {
    setReviewingId(moderation.id);
    try {
      await marketplaceApi.reviewModeration(moderation.id, {
        decision,
        notes: moderationNotes[moderation.id]?.trim() || undefined,
        featured: decision === "APPROVE" ? !!featuredOnApprove[moderation.id] : false,
      });
      toast.success(`Report ${decision === "APPROVE" ? "approved" : "rejected"}.`);
      await Promise.all([load(), loadModerationReports(), loadModerationAudit()]);
    } catch {
      toast.error("Unable to review report.");
    } finally {
      setReviewingId(null);
    }
  };

  const allTags = useMemo(() => {
    const merged = [...featured, ...trending, ...newest, ...mine, ...discover]
      .flatMap((passage) => passage.tags || []);
    return Array.from(new Set(merged));
  }, [featured, trending, newest, mine, discover]);

  const section = (
    title: string,
    rows: MarketplacePassage[],
    emptyText: string,
    compact = true,
  ) => (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => (
            <PassageCard
              key={row.id}
              passage={row}
              compact={compact}
              onOpen={openPassage}
              onRate={ratePassage}
              onBookmark={bookmarkPassage}
              onReport={reportPassage}
            />
          ))}
        </div>
      )}
    </section>
  );

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Content Marketplace</h1>
        <p className="text-muted-foreground">
          Share custom typing passages, discover trending content, and save your favorites.
        </p>
      </header>

      <PassageEditor saving={saving} onSubmit={createPassage} />

      {isAdmin && (
        <section className="rounded-xl border border-border/70 bg-card/70 p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold">Moderation Queue</h2>
              <p className="text-sm text-muted-foreground">
                Review passage reports and decide approval or rejection.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                className="rounded-md border bg-background px-3 py-2 text-sm"
                value={moderationStatus}
                onChange={(event) => {
                  setModerationStatus(event.target.value as "ALL" | "PENDING" | "APPROVED" | "REJECTED");
                  setModerationPage(0);
                }}
              >
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="ALL">All</option>
              </select>
              <Button
                variant="outline"
                disabled={loadingModeration}
                onClick={() => void loadModerationReports()}
              >
                {loadingModeration ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </div>

          {moderationRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No moderation reports found for the selected filter.</p>
          ) : (
            <div className="space-y-3">
              {moderationRows.map((row) => {
                const pending = row.status === "PENDING";
                return (
                  <article key={row.id} className="rounded-lg border border-border/70 bg-background/60 p-3 space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-semibold">{row.passageTitle}</h3>
                        <p className="text-xs text-muted-foreground">
                          Reporter: {row.reporterName} | {new Date(row.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <span className="rounded-full border px-2 py-1 text-xs">{row.status}</span>
                    </div>

                    <p className="text-sm">
                      <span className="font-medium">Reason:</span> {row.reason}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => void openPassage(row.passageId)}>
                        Open Passage
                      </Button>
                    </div>

                    {pending ? (
                      <div className="space-y-2">
                        <textarea
                          data-testid={`moderation-notes-${row.id}`}
                          className="min-h-[74px] w-full rounded-md border bg-background px-3 py-2 text-sm"
                          placeholder="Review notes (optional)"
                          value={moderationNotes[row.id] || ""}
                          onChange={(event) => setModerationNotes((prev) => ({ ...prev, [row.id]: event.target.value }))}
                        />
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={!!featuredOnApprove[row.id]}
                            onChange={(event) => setFeaturedOnApprove((prev) => ({ ...prev, [row.id]: event.target.checked }))}
                          />
                          Mark featured when approving
                        </label>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            data-testid={`moderation-approve-${row.id}`}
                            size="sm"
                            disabled={reviewingId === row.id}
                            onClick={() => void reviewModeration(row, "APPROVE")}
                          >
                            {reviewingId === row.id ? "Saving..." : "Approve"}
                          </Button>
                          <Button
                            data-testid={`moderation-reject-${row.id}`}
                            size="sm"
                            variant="outline"
                            disabled={reviewingId === row.id}
                            onClick={() => void reviewModeration(row, "REJECT")}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>Reviewed by: {row.reviewerName || "System"}</p>
                        <p>Reviewed at: {row.reviewedAt ? new Date(row.reviewedAt).toLocaleString() : "-"}</p>
                        <p>Notes: {row.reviewNotes || "-"}</p>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}

          {moderationTotalPages > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                Page {moderationPage + 1} of {moderationTotalPages} - {moderationTotalElements} total reports
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={loadingModeration || moderationPage <= 0}
                  onClick={() => setModerationPage((prev) => Math.max(prev - 1, 0))}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={loadingModeration || moderationPage + 1 >= moderationTotalPages}
                  onClick={() => setModerationPage((prev) => prev + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          <div className="border-t border-border/60 pt-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">Recent Review Audit</h3>
              <Button variant="ghost" size="sm" disabled={loadingAudit} onClick={() => void loadModerationAudit()}>
                {loadingAudit ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
            {auditRows.length === 0 ? (
              <p className="text-xs text-muted-foreground">No audit entries yet.</p>
            ) : (
              <div className="space-y-2">
                {auditRows.map((audit) => (
                  <article key={audit.id} className="rounded-md border border-border/60 bg-background/60 p-2">
                    <p className="text-sm">
                      <span className="font-medium">{audit.reviewerName}</span> set <span className="font-medium">{audit.decision}</span> for{" "}
                      <span className="font-medium">{audit.passageTitle}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(audit.createdAt).toLocaleString()} | {audit.previousStatus} {"->"} {audit.nextStatus} | featured: {audit.featuredAfterDecision ? "yes" : "no"}
                    </p>
                    <p className="text-xs text-muted-foreground">Notes: {audit.reviewNotes || "-"}</p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <section className="rounded-xl border border-border/70 bg-card/70 p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_160px_auto]">
          <label className="text-sm font-medium">
            Search
            <input
              className="mt-1 w-full rounded-md border bg-background px-3 py-2"
              placeholder="Search title or content"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <TagFilter value={tag} onChange={setTag} suggestions={allTags} />
          <label className="text-sm font-medium">
            Sort
            <select
              className="mt-1 w-full rounded-md border bg-background px-3 py-2"
              value={sort}
              onChange={(event) => setSort(event.target.value as MarketplaceSort)}
            >
              <option value="new">New</option>
              <option value="featured">Featured</option>
              <option value="trending">Trending</option>
            </select>
          </label>
          <div className="flex items-end">
            <Button className="w-full" disabled={discovering} onClick={() => void discoverPassages(0)}>
              {discovering ? "Searching..." : "Discover"}
            </Button>
          </div>
        </div>

        <div className="mt-4">
          {section("Discover Results", discover, "Run a discover search using filters above.", false)}
          {discoverTotalPages > 0 && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                Page {discoverPage + 1} of {discoverTotalPages} - {discoverTotalElements} total results
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={discovering || discoverPage <= 0}
                  onClick={() => void discoverPassages(Math.max(discoverPage - 1, 0))}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={discovering || discoverPage + 1 >= discoverTotalPages}
                  onClick={() => void discoverPassages(discoverPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      <>
        {section("Featured", featured, "No featured passages yet.")}
        {section("Trending", trending, "No trending passages yet.")}
        {section("New", newest, "No new passages yet.")}
        {section("My Passages", mine, "You have not shared any passage yet.")}
      </>

      {selected && (
        <section className="rounded-xl border border-border/70 bg-card/70 p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold">{selected.title}</h2>
              <p className="text-sm text-muted-foreground">
                by {selected.authorName} - mode {selected.syntaxMode}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Close</Button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {selected.tags.map((t) => (
              <span key={t} className="rounded-full border px-2 py-1 text-xs text-muted-foreground">#{t}</span>
            ))}
          </div>

          <pre className={`mt-3 max-h-[360px] overflow-auto whitespace-pre-wrap rounded-md border bg-background/70 p-3 text-sm ${
            ["CODE", "TYPESCRIPT", "JAVA", "PYTHON", "CPP"].includes(selected.syntaxMode) ? "font-mono" : ""
          }`}>
            {selected.content || selected.preview || ""}
          </pre>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => void bookmarkPassage(selected.id)}>
              {selected.bookmarked ? "Remove Bookmark" : "Bookmark"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => void reportPassage(selected.id)}>
              Report
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}

