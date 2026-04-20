import { cn } from "@/lib/utils";
import type { EvidenceFile } from "@/lib/types";

const toneMap: Record<EvidenceFile["status"], string> = {
  uploaded: "bg-sky-100 text-sky-800",
  under_review: "bg-amber-100 text-amber-800",
  accepted: "bg-emerald-100 text-emerald-800",
  needs_replacement: "bg-orange-100 text-orange-800",
  rejected: "bg-rose-100 text-rose-800",
};

const labelMap: Record<EvidenceFile["status"], string> = {
  uploaded: "Uploaded",
  under_review: "Under review",
  accepted: "Accepted",
  needs_replacement: "Needs replacement",
  rejected: "Rejected",
};

export function FileStatusBadge({
  status,
  className,
}: {
  status: EvidenceFile["status"];
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
        toneMap[status],
        className
      )}
    >
      {labelMap[status]}
    </span>
  );
}
