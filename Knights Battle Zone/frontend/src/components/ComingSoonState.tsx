import type { LucideIcon } from "lucide-react";
import { Clock3, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";

type ComingSoonStateProps = {
  title: string;
  description: string;
  note?: string;
  icon?: LucideIcon;
};

export function ComingSoonState({
  title,
  description,
  note = "This module is not active yet. Use the available sections for now.",
  icon: Icon = Sparkles,
}: ComingSoonStateProps) {
  return (
    <div className="page-shell mx-auto max-w-4xl space-y-6 animate-fade-in-up">
      <section className="dashboard-hero rounded-[1.75rem] border border-border/75 p-6 md:p-8">
        <Badge className="hero-chip gap-2">
          <Clock3 className="h-3.5 w-3.5" />
          Coming soon
        </Badge>
        <div className="mt-4 flex items-start gap-4">
          <div className="rounded-2xl bg-primary/10 p-3 text-primary">
            <Icon className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight text-foreground">{title}</h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
              {description}
            </p>
          </div>
        </div>
      </section>

      <section className="content-panel rounded-[1.5rem] p-6">
        <h2 className="text-lg font-semibold text-foreground">What to expect</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{note}</p>
      </section>
    </div>
  );
}
