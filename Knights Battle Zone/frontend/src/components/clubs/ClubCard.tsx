import { Button } from "@/components/ui/button";
import type { ClubSummary } from "@/lib/types";

interface ClubCardProps {
  club: ClubSummary;
  onOpen: (clubId: number) => void;
  onJoin: (clubId: number) => void;
  joining?: boolean;
}

export function ClubCard({ club, onOpen, onJoin, joining = false }: ClubCardProps) {
  return (
    <article className="rounded-xl border border-border/70 bg-card/70 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{club.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{club.description || "No description provided."}</p>
        </div>
        <span className="rounded-full border px-2 py-1 text-xs font-medium">
          {club.visibility}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
        <span>{club.memberCount} members</span>
        <span>{club.myRole ? `Role: ${club.myRole}` : "Not a member"}</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => onOpen(club.id)}>Open</Button>
        {!club.joined && (
          <Button size="sm" variant="secondary" disabled={joining} onClick={() => onJoin(club.id)}>
            {joining ? "Joining..." : "Join Club"}
          </Button>
        )}
      </div>
    </article>
  );
}
