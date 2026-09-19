import type { ReactNode } from "react";

type SectionBlockProps = {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
};

export function SectionBlock({ title, description, children, className }: SectionBlockProps) {
  return (
    <section className={`rounded-2xl border border-border/70 bg-card/80 p-5 md:p-6 ${className ?? ""}`}>
      <div className="mb-4">
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}
