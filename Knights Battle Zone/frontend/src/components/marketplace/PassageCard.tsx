import { Bookmark, Flag, Flame, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RatingStars } from "@/components/marketplace/RatingStars";
import type { MarketplacePassage } from "@/lib/types";

interface PassageCardProps {
  passage: MarketplacePassage;
  onOpen?: (passageId: number) => void;
  onRate?: (passageId: number, rating: number) => Promise<void>;
  onBookmark?: (passageId: number) => Promise<void>;
  onReport?: (passageId: number) => Promise<void>;
  compact?: boolean;
}

export function PassageCard({
  passage,
  onOpen,
  onRate,
  onBookmark,
  onReport,
  compact = false,
}: PassageCardProps) {
  return (
    <article className="rounded-xl border border-border/70 bg-card/70 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold">{passage.title}</h3>
          <p className="text-xs text-muted-foreground">
            by {passage.authorName} - {new Date(passage.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {passage.featured && (
            <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px]">
              <Sparkles size={12} /> Featured
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px]">
            <Flame size={12} /> {passage.playCount}
          </span>
        </div>
      </div>

      <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{passage.preview || "No preview available."}</p>

      <div className="mt-2 flex flex-wrap gap-1">
        {passage.tags.slice(0, 6).map((tag) => (
          <span key={tag} className="rounded-full border px-2 py-1 text-[11px] text-muted-foreground">
            #{tag}
          </span>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="space-y-1">
          <RatingStars value={passage.averageRating} readOnly size="sm" />
          <p className="text-xs text-muted-foreground">
            {passage.averageRating.toFixed(2)} ({passage.ratingCount} ratings)
          </p>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <p>Completion {(passage.completionRate * 100).toFixed(1)}%</p>
          <p>Mode {passage.syntaxMode}</p>
        </div>
      </div>

      {!compact && (
        <div className="mt-3 space-y-2">
          {onRate && (
            <div className="rounded-md border p-2">
              <p className="mb-1 text-xs text-muted-foreground">Your Rating</p>
              <RatingStars value={passage.myRating ?? 0} onChange={(value) => void onRate(passage.id, value)} size="sm" />
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {onOpen && (
              <Button size="sm" onClick={() => onOpen(passage.id)}>
                Open
              </Button>
            )}
            {onBookmark && (
              <Button size="sm" variant="secondary" onClick={() => void onBookmark(passage.id)}>
                <Bookmark size={14} className="mr-1" />
                {passage.bookmarked ? "Bookmarked" : "Bookmark"}
              </Button>
            )}
            {onReport && (
              <Button size="sm" variant="ghost" onClick={() => void onReport(passage.id)}>
                <Flag size={14} className="mr-1" /> Report
              </Button>
            )}
          </div>
        </div>
      )}
    </article>
  );
}


