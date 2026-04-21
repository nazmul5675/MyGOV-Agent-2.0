import { cva } from "class-variance-authority";

import type { CaseItem } from "@/lib/types";
import { cn } from "@/lib/utils";

const urgencyStyles = cva(
  "inline-flex max-w-full items-center justify-center rounded-full px-3 py-1 text-center text-xs font-semibold uppercase tracking-[0.18em]",
  {
    variants: {
      urgency: {
        low: "bg-emerald-100 text-emerald-900",
        medium: "bg-amber-100 text-amber-900",
        high: "bg-rose-100 text-rose-900",
      },
    },
  }
);

const urgencyLabelMap: Record<CaseItem["intake"]["urgency"], string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export function PriorityBadge({
  urgency,
  className,
}: {
  urgency: CaseItem["intake"]["urgency"];
  className?: string;
}) {
  return <span className={cn(urgencyStyles({ urgency }), className)}>{urgencyLabelMap[urgency]}</span>;
}
