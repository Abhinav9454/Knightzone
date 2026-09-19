import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PassageCard } from "./PassageCard";
import type { MarketplacePassage } from "@/lib/types";

const basePassage: MarketplacePassage = {
  id: 101,
  title: "Binary Search Mastery",
  preview: "Practice binary search with sorted arrays and boundary checks.",
  content: null,
  syntaxMode: "PLAIN",
  tags: ["algorithms", "search"],
  authorId: 9,
  authorName: "Abhinav",
  featured: true,
  approved: true,
  status: "APPROVED",
  averageRating: 4.2,
  ratingCount: 18,
  playCount: 240,
  completionRate: 0.73,
  bookmarked: false,
  myRating: 0,
  createdAt: "2026-03-01T10:00:00Z",
  updatedAt: "2026-03-01T10:00:00Z",
};

describe("PassageCard", () => {
  it("renders passage summary details", () => {
    render(<PassageCard passage={basePassage} />);

    expect(screen.getByText("Binary Search Mastery")).toBeInTheDocument();
    expect(screen.getByText(/by Abhinav/i)).toBeInTheDocument();
    expect(screen.getByText(/Completion 73.0%/i)).toBeInTheDocument();
    expect(screen.getByText("#algorithms")).toBeInTheDocument();
    expect(screen.getByText("#search")).toBeInTheDocument();
  });

  it("triggers open, rate, bookmark and report callbacks", () => {
    const onOpen = vi.fn();
    const onRate = vi.fn().mockResolvedValue(undefined);
    const onBookmark = vi.fn().mockResolvedValue(undefined);
    const onReport = vi.fn().mockResolvedValue(undefined);

    render(
      <PassageCard
        passage={basePassage}
        onOpen={onOpen}
        onRate={onRate}
        onBookmark={onBookmark}
        onReport={onReport}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    expect(onOpen).toHaveBeenCalledWith(101);

    fireEvent.click(screen.getByRole("button", { name: /Rate 4 stars/i }));
    expect(onRate).toHaveBeenCalledWith(101, 4);

    fireEvent.click(screen.getByRole("button", { name: /Bookmark/i }));
    expect(onBookmark).toHaveBeenCalledWith(101);

    fireEvent.click(screen.getByRole("button", { name: /Report/i }));
    expect(onReport).toHaveBeenCalledWith(101);
  });

  it("shows Bookmarked label when passage is already bookmarked", () => {
    render(
      <PassageCard
        passage={{ ...basePassage, bookmarked: true }}
        onBookmark={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    expect(screen.getByRole("button", { name: /Bookmarked/i })).toBeInTheDocument();
  });
});

