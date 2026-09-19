import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ClubChallenge } from "@/lib/types";

interface ClubChallengeCardProps {
  challenge: ClubChallenge;
  onSubmitAttempt: (challengeId: number, payload: { wpm: number; accuracy: number }) => Promise<void>;
}

export function ClubChallengeCard({ challenge, onSubmitAttempt }: ClubChallengeCardProps) {
  const [wpm, setWpm] = useState<number>(70);
  const [accuracy, setAccuracy] = useState<number>(95);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await onSubmitAttempt(challenge.id, { wpm, accuracy });
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="rounded-xl border border-border/70 bg-card/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold">{challenge.title}</h3>
        <span className="rounded-full border px-2 py-1 text-xs">{challenge.frequency}</span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{challenge.description || "Typing challenge"}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {new Date(challenge.startsAt).toLocaleString()} - {new Date(challenge.endsAt).toLocaleString()}
      </p>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <label className="text-sm">
          WPM
          <input
            type="number"
            min={1}
            max={400}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
            value={wpm}
            onChange={(e) => setWpm(Number(e.target.value))}
          />
        </label>
        <label className="text-sm">
          Accuracy
          <input
            type="number"
            min={1}
            max={100}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
            value={accuracy}
            onChange={(e) => setAccuracy(Number(e.target.value))}
          />
        </label>
      </div>

      <Button size="sm" className="mt-3" disabled={saving} onClick={() => void submit()}>
        {saving ? "Submitting..." : "Submit Attempt"}
      </Button>
    </article>
  );
}
