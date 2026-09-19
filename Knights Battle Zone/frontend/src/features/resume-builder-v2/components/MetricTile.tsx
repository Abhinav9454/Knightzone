type MetricTileProps = {
  label: string;
  value: string;
  tone?: "default" | "success" | "warning";
};

const toneClassMap: Record<NonNullable<MetricTileProps["tone"]>, string> = {
  default: "border-border/70 bg-card",
  success: "border-emerald-500/30 bg-emerald-500/10",
  warning: "border-amber-500/30 bg-amber-500/10",
};

export function MetricTile({ label, value, tone = "default" }: MetricTileProps) {
  return (
    <article className={`rounded-xl border p-4 ${toneClassMap[tone]}`}>
      <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </article>
  );
}
