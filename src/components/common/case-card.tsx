import Link from "next/link";
import { ArrowUpRight, Clock3, FileStack, MapPin, Sparkles } from "lucide-react";

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
  const missingDocs = item.intake.missingDocuments.length;

  return (
    <article className="surface-panel interactive-lift flex h-full flex-col gap-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-3">
          <div className="inline-flex rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {caseTypeLabelMap[item.type]}
          </div>
          <div className="space-y-1.5">
            <h3 className="text-xl font-bold leading-8 tracking-tight text-foreground">{item.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{item.reference}</p>
          </div>
        </div>
        <StatusBadge status={item.status} />
      </div>
      <p className="text-sm leading-6 text-muted-foreground">{item.summary}</p>
      <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.16em]">
        <span className="rounded-full bg-accent px-3 py-1 text-accent-foreground">
          {item.evidence.length} file{item.evidence.length === 1 ? "" : "s"}
        </span>
        <span
          className={cn(
            "rounded-full px-3 py-1",
            missingDocs
              ? "bg-amber-100 text-amber-900"
              : "bg-emerald-100 text-emerald-900"
          )}
        >
          {missingDocs ? `${missingDocs} missing doc${missingDocs === 1 ? "" : "s"}` : "packet ready"}
        </span>
      </div>
      <div className="grid gap-x-4 gap-y-3 text-sm text-muted-foreground sm:grid-cols-2">
        <div className="flex min-w-0 items-start gap-2">
          <MapPin className="size-4" />
          <span className="min-w-0">{item.location}</span>
        </div>
        <div className="flex items-center gap-2">
          <FileStack className="size-4" />
          <span>{item.evidence.length} evidence items</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock3 className="size-4" />
          <span>Updated {new Date(item.updatedAt).toLocaleDateString("en-MY")}</span>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="size-4" />
          <span>{item.intake.category}</span>
        </div>
      </div>
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-semibold text-primary">{item.progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-primary transition-[width] duration-500 ease-out"
            style={{ width: `${item.progress}%` }}
          />
        </div>
      </div>
      <Link
        href={href}
        className={cn(
          buttonVariants({ variant: "outline", size: "default" }),
          "mt-auto w-full justify-between px-4"
        )}
      >
        Open case
        <ArrowUpRight className="size-4" />
      </Link>
    </article>
  );
}
