import { cva } from "class-variance-authority";

import { statusLabelMap } from "@/lib/constants";
import type { CaseStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const statusStyles = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-[0.18em] uppercase",
  {
    variants: {
      status: {
        submitted: "bg-accent text-accent-foreground",
        reviewing: "bg-primary/10 text-primary",
        need_more_docs: "bg-[#fff1d1] text-[#8d5e00]",
        routed: "bg-[#eaf0ff] text-[#355ca8]",
        in_progress: "bg-[#e6f6ec] text-[#1f6a41]",
        resolved: "bg-[#e5f8ee] text-[#1d7d49]",
        rejected: "bg-[#ffe2df] text-[#a33a2f]",
      },
    },
  }
);

export function StatusBadge({
  status,
  className,
}: {
  status: CaseStatus;
  className?: string;
}) {
  return (
    <span className={cn(statusStyles({ status }), className)}>
      {statusLabelMap[status]}
    </span>
  );
}
