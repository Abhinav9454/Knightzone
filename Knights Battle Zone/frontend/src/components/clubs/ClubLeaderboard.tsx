import type { ClubRankingEntry } from "@/lib/types";

interface ClubLeaderboardProps {
  rows: ClubRankingEntry[];
}

export function ClubLeaderboard({ rows }: ClubLeaderboardProps) {
  return (
    <section className="rounded-xl border border-border/70 bg-card/70 p-4">
      <h2 className="text-lg font-semibold">Club Rankings</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="py-2 pr-2">#</th>
              <th className="py-2 pr-2">Member</th>
              <th className="py-2 pr-2 text-right">Points</th>
              <th className="py-2 pr-2 text-right">Best WPM</th>
              <th className="py-2 pr-2 text-right">Best Accuracy</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.userId} className="border-b border-border/50">
                <td className="py-2 pr-2 font-medium">{index + 1}</td>
                <td className="py-2 pr-2">{row.userName}</td>
                <td className="py-2 pr-2 text-right font-semibold">{row.totalPoints.toFixed(2)}</td>
                <td className="py-2 pr-2 text-right">{row.bestWpm.toFixed(1)}</td>
                <td className="py-2 pr-2 text-right">{row.bestAccuracy.toFixed(1)}%</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-muted-foreground">No rankings yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
