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
    <ol className="space-y-3">
      {events.map((event) => {
        const Icon = iconMap[event.type];

        return (
          <li key={event.id} className="relative flex gap-3 pl-1">
            <div className="absolute left-4.5 top-10 h-[calc(100%+0.75rem)] w-px bg-gradient-to-b from-primary/22 via-primary/10 to-transparent last:hidden" />
            <div className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-[0_12px_26px_rgba(12,74,132,0.12)]">
              <Icon className="size-4" />
            </div>
            <div className="surface-panel min-w-0 flex-1 rounded-[24px] p-4 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2">
              <div className="min-w-0">
                <div className="flex flex-col gap-2">
                  <h4 className="font-semibold text-foreground">{event.title}</h4>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] uppercase tracking-[0.16em]">
                    <span className="text-muted-foreground">
                      {format(new Date(event.createdAt), "dd MMM yyyy")}
                    </span>
                    <span className="font-semibold text-primary/70">{event.actor}</span>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{event.description}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
