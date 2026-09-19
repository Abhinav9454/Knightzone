interface TagFilterProps {
  value: string;
  onChange: (value: string) => void;
  suggestions?: string[];
}

export function TagFilter({ value, onChange, suggestions = [] }: TagFilterProps) {
  const unique = Array.from(new Set(suggestions.map((item) => item.trim().toLowerCase()).filter(Boolean))).slice(0, 12);
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Tag Filter</label>
      <input
        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        placeholder="Filter by tag (e.g. javascript)"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {unique.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {unique.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`rounded-full border px-2 py-1 text-xs ${
                value.trim().toLowerCase() === tag ? "border-primary text-primary" : "text-muted-foreground"
              }`}
              onClick={() => onChange(tag)}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

