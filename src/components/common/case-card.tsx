import Link from "next/link";
import { ArrowUpRight, FileStack, MapPin } from "lucide-react";

import { caseTypeLabelMap } from "@/lib/constants";
import type { CaseItem } from "@/lib/types";
import { StatusBadge } from "@/components/common/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CaseCard({
  item,
  href,
}: {
  item: CaseItem;
  href: string;
}) {
  return (
    <article className="surface-panel flex h-full flex-col gap-5 p-6 transition-transform duration-300 hover:-translate-y-1">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="inline-flex rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {caseTypeLabelMap[item.type]}
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight text-foreground">{item.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{item.reference}</p>
          </div>
        </div>
        <StatusBadge status={item.status} />
      </div>
      <p className="text-sm leading-7 text-muted-foreground">{item.summary}</p>
      <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
        <div className="flex items-center gap-2">
          <MapPin className="size-4" />
          <span>{item.location}</span>
        </div>
        <div className="flex items-center gap-2">
          <FileStack className="size-4" />
          <span>{item.evidence.length} evidence items</span>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-semibold text-primary">{item.progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-primary transition-[width]"
            style={{ width: `${item.progress}%` }}
          />
        </div>
      </div>
      <Link
        href={href}
        className={cn(
          buttonVariants({ variant: "outline", size: "lg" }),
          "mt-auto justify-between rounded-2xl px-4"
        )}
      >
        Open case
        <ArrowUpRight className="size-4" />
      </Link>
    </article>
  );
}
