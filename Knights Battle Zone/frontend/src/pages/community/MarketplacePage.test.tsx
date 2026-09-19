import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import MarketplacePage from "./MarketplacePage";
import type { MarketplaceModeration, MarketplacePassage, PaginatedResponse } from "@/lib/types";

const apiMocks = vi.hoisted(() => ({
  getFeatured: vi.fn(),
  getTrending: vi.fn(),
  listPassages: vi.fn(),
  createPassage: vi.fn(),
  getPassage: vi.fn(),
  ratePassage: vi.fn(),
  toggleBookmark: vi.fn(),
  reportPassage: vi.fn(),
  getModerationReports: vi.fn(),
  getModerationAudit: vi.fn(),
  reviewModeration: vi.fn(),
}));

const authMocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/api", () => ({
  marketplaceApi: {
    getFeatured: (...args: unknown[]) => apiMocks.getFeatured(...args),
    getTrending: (...args: unknown[]) => apiMocks.getTrending(...args),
    listPassages: (...args: unknown[]) => apiMocks.listPassages(...args),
    createPassage: (...args: unknown[]) => apiMocks.createPassage(...args),
    getPassage: (...args: unknown[]) => apiMocks.getPassage(...args),
    ratePassage: (...args: unknown[]) => apiMocks.ratePassage(...args),
    toggleBookmark: (...args: unknown[]) => apiMocks.toggleBookmark(...args),
    reportPassage: (...args: unknown[]) => apiMocks.reportPassage(...args),
    getModerationReports: (...args: unknown[]) => apiMocks.getModerationReports(...args),
    getModerationAudit: (...args: unknown[]) => apiMocks.getModerationAudit(...args),
    reviewModeration: (...args: unknown[]) => apiMocks.reviewModeration(...args),
  },
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => authMocks.useAuth(),
}));

vi.mock("@/components/marketplace/PassageEditor", () => ({
  PassageEditor: (props: { onSubmit: (payload: { title: string; content: string; tags: string[]; syntaxMode: string }) => Promise<void> }) => (
    <button
      type="button"
      onClick={() => void props.onSubmit({ title: "Custom", content: "Typed", tags: ["custom"], syntaxMode: "PLAIN" })}
    >
      Mock Publish
    </button>
  ),
}));

vi.mock("@/components/marketplace/TagFilter", () => ({
  TagFilter: (props: { value: string; onChange: (value: string) => void }) => (
    <input
      aria-label="Tag Filter"
      value={props.value}
      onChange={(event) => props.onChange(event.target.value)}
    />
  ),
}));

vi.mock("@/components/marketplace/PassageCard", () => ({
  PassageCard: (props: { passage: MarketplacePassage }) => (
    <article data-testid={`passage-${props.passage.id}`}>{props.passage.title}</article>
  ),
}));

const makePassage = (id: number, title: string): MarketplacePassage => ({
  id,
  title,
  preview: `${title} preview`,
  content: null,
  syntaxMode: "PLAIN",
  tags: ["algorithms"],
  authorId: 1,
  authorName: "Author",
  featured: false,
  approved: true,
  status: "APPROVED",
  averageRating: 4.0,
  ratingCount: 10,
  playCount: 100,
  completionRate: 0.8,
  bookmarked: false,
  myRating: null,
  createdAt: "2026-03-01T10:00:00Z",
  updatedAt: "2026-03-01T10:00:00Z",
});

const pageOf = <T,>(content: T[], number = 0, totalPages = 1, totalElements = content.length): PaginatedResponse<T> => ({
  content,
  totalElements,
  totalPages,
  size: content.length,
  number,
  first: number === 0,
  last: number + 1 >= totalPages,
});

const makeModeration = (id: number): MarketplaceModeration => ({
  id,
  passageId: 1,
  passageTitle: "Reported Passage",
  reporterId: 11,
  reporterName: "Reporter",
  reason: "Pending issue",
  status: "PENDING",
  reviewNotes: null,
  reviewerId: null,
  reviewerName: null,
  createdAt: "2026-03-01T10:00:00Z",
  reviewedAt: null,
});

describe("MarketplacePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.useAuth.mockReturnValue({ user: { role: "USER" } });

    apiMocks.getFeatured.mockResolvedValue(pageOf([makePassage(1, "Featured Passage")]));
    apiMocks.getTrending.mockResolvedValue(pageOf([makePassage(2, "Trending Passage")]));
    apiMocks.createPassage.mockResolvedValue(makePassage(100, "Custom"));
    apiMocks.getPassage.mockResolvedValue(makePassage(1, "Featured Passage"));
    apiMocks.ratePassage.mockResolvedValue({ passageId: 1, rating: 5, averageRating: 4.5, ratingCount: 20 });
    apiMocks.toggleBookmark.mockResolvedValue({ passageId: 1, bookmarked: true });
    apiMocks.reportPassage.mockResolvedValue(undefined);
    apiMocks.getModerationReports.mockResolvedValue(pageOf([]));
    apiMocks.getModerationAudit.mockResolvedValue(pageOf([]));
    apiMocks.reviewModeration.mockResolvedValue(makeModeration(1));
  });

  it("loads featured/trending/new/my sections from API", async () => {
    apiMocks.listPassages.mockImplementation((params?: { sort?: string; mine?: boolean; size?: number }) => {
      if (params?.mine) return Promise.resolve(pageOf([makePassage(4, "My Passage")]));
      if (params?.sort === "new" && params?.size === 6) return Promise.resolve(pageOf([makePassage(3, "New Passage")]));
      return Promise.resolve(pageOf([]));
    });

    render(<MarketplacePage />);

    await waitFor(() => {
      expect(screen.getByText("Featured Passage")).toBeInTheDocument();
      expect(screen.getByText("Trending Passage")).toBeInTheDocument();
      expect(screen.getByText("New Passage")).toBeInTheDocument();
      expect(screen.getByText("My Passage")).toBeInTheDocument();
    });

    expect(apiMocks.getFeatured).toHaveBeenCalledWith({ page: 0, size: 6 });
    expect(apiMocks.getTrending).toHaveBeenCalledWith({ page: 0, size: 6 });
  });

  it("runs discover query with filters and paginates results", async () => {
    apiMocks.listPassages.mockImplementation((params?: { sort?: string; mine?: boolean; size?: number; page?: number; search?: string }) => {
      if (params?.mine) return Promise.resolve(pageOf([]));
      if (params?.sort === "new" && params?.size === 6) return Promise.resolve(pageOf([]));
      if (params?.size === 12 && (params?.page ?? 0) === 0) {
        return Promise.resolve(pageOf([makePassage(10, "Discover P0")], 0, 2, 24));
      }
      if (params?.size === 12 && params?.page === 1) {
        return Promise.resolve(pageOf([makePassage(11, "Discover P1")], 1, 2, 24));
      }
      return Promise.resolve(pageOf([]));
    });

    render(<MarketplacePage />);

    fireEvent.change(screen.getByPlaceholderText("Search title or content"), { target: { value: "binary" } });
    fireEvent.click(screen.getByRole("button", { name: "Discover" }));

    await waitFor(() => {
      expect(screen.getByText("Discover P0")).toBeInTheDocument();
      expect(screen.getByText("Page 1 of 2 - 24 total results")).toBeInTheDocument();
    });

    expect(apiMocks.listPassages).toHaveBeenCalledWith(
      expect.objectContaining({
        search: "binary",
        sort: "new",
        page: 0,
        size: 12,
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    await waitFor(() => {
      expect(screen.getByText("Discover P1")).toBeInTheDocument();
      expect(screen.getByText("Page 2 of 2 - 24 total results")).toBeInTheDocument();
    });
  });

  it("shows moderation panel for admins and allows approve action", async () => {
    authMocks.useAuth.mockReturnValue({ user: { role: "ADMIN" } });

    apiMocks.listPassages.mockImplementation((params?: { sort?: string; mine?: boolean; size?: number }) => {
      if (params?.mine) return Promise.resolve(pageOf([]));
      if (params?.sort === "new" && params?.size === 6) return Promise.resolve(pageOf([]));
      return Promise.resolve(pageOf([]));
    });

    apiMocks.getModerationReports.mockResolvedValue(pageOf([makeModeration(101)]));
    apiMocks.getModerationAudit.mockResolvedValue(pageOf([{
      id: 1,
      moderationId: 101,
      passageId: 1,
      passageTitle: "Reported Passage",
      reviewerId: 1,
      reviewerName: "Admin User",
      decision: "APPROVE",
      previousStatus: "PENDING",
      nextStatus: "APPROVED",
      reviewNotes: "safe",
      featuredAfterDecision: true,
      createdAt: "2026-03-01T10:00:00Z",
    }]));

    render(<MarketplacePage />);

    await waitFor(() => {
      expect(screen.getByText("Moderation Queue")).toBeInTheDocument();
      expect(screen.getByText("Pending issue")).toBeInTheDocument();
      expect(screen.getByText("Recent Review Audit")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId("moderation-notes-101"), { target: { value: "Looks safe now" } });
    fireEvent.click(screen.getByLabelText("Mark featured when approving"));
    fireEvent.click(screen.getByTestId("moderation-approve-101"));

    await waitFor(() => {
      expect(apiMocks.reviewModeration).toHaveBeenCalledWith(
        101,
        expect.objectContaining({
          decision: "APPROVE",
          notes: "Looks safe now",
          featured: true,
        }),
      );
    });
  });
});
