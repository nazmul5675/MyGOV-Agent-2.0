import { format } from "date-fns";
import { ArrowRight, FileUp, NotebookPen, Sparkles } from "lucide-react";

import type { CaseEvent } from "@/lib/types";

const iconMap = {
  status: Sparkles,
  note: NotebookPen,
  upload: FileUp,
  routing: ArrowRight,
};

export function Timeline({ events }: { events: CaseEvent[] }) {
  return (
    <ol className="mx-auto max-w-4xl space-y-4">
      {events.map((event) => {
        const Icon = iconMap[event.type];

        return (
          <li key={event.id} className="relative flex gap-4 pl-1">
            <div className="absolute left-5 top-11 h-[calc(100%+0.75rem)] w-px bg-gradient-to-b from-primary/22 via-primary/10 to-transparent last:hidden" />
            <div className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-[0_12px_26px_rgba(12,74,132,0.12)]">
              <Icon className="size-4" />
            </div>
            <div className="surface-panel min-w-0 flex-1 p-5 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h4 className="font-semibold text-foreground">{event.title}</h4>
                <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {format(new Date(event.createdAt), "dd MMM yyyy")}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{event.description}</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-primary/70">
                {event.actor}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
