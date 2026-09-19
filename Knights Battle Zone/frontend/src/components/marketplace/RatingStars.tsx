import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RatingStarsProps {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md";
}

export function RatingStars({ value, onChange, readOnly = false, size = "md" }: RatingStarsProps) {
  const iconSize = size === "sm" ? 14 : 18;
  const normalized = Math.max(0, Math.min(5, Math.round(value)));

  return (
    <div className="flex items-center gap-1" aria-label={`Rating ${normalized} out of 5`}>
      {[1, 2, 3, 4, 5].map((point) => {
        const active = point <= normalized;
        if (readOnly) {
          return (
            <Star
              key={point}
              size={iconSize}
              className={active ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}
            />
          );
        }
        return (
          <Button
            key={point}
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => onChange?.(point)}
            aria-label={`Rate ${point} star${point > 1 ? "s" : ""}`}
          >
            <Star size={iconSize} className={active ? "fill-amber-400 text-amber-400" : "text-muted-foreground/50"} />
          </Button>
        );
      })}
    </div>
  );
}

