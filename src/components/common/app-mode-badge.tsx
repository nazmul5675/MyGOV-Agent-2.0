import { Layers3, Sparkles } from "lucide-react";

import { getAppMode } from "@/lib/config/app-mode";
import { cn } from "@/lib/utils";

export function AppModeBadge({
  className,
}: {
  className?: string;
}) {
  const mode = getAppMode();

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary",
        className
      )}
    >
      {mode === "prototype" ? <Sparkles className="size-3.5" /> : <Layers3 className="size-3.5" />}
      {mode === "prototype" ? "Prototype mode" : "Live mode"}
    </div>
  );
}
