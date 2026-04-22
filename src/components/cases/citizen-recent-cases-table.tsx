"use client";

import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ExternalLink, Search } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { PriorityBadge } from "@/components/common/priority-badge";
import { StatusBadge } from "@/components/common/status-badge";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import type { CaseItem } from "@/lib/types";
import { cn } from "@/lib/utils";

type CitizenSortKey = "submitted" | "updated" | "title" | "status" | "priority";
type SortDirection = "asc" | "desc";

function compareText(left: string, right: string, direction: SortDirection) {
  return direction === "asc" ? left.localeCompare(right) : right.localeCompare(left);
}

function compareNumber(left: number, right: number, direction: SortDirection) {
  return direction === "asc" ? left - right : right - left;
}

function getPriorityRank(urgency: CaseItem["intake"]["urgency"]) {
  if (urgency === "high") return 3;
  if (urgency === "medium") return 2;
  return 1;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB");
}

function SortIcon({
  active,
  direction,
}: {
  active: boolean;
  direction: SortDirection;
}) {
  if (!active) return <ArrowUpDown className="size-3.5" />;
  return direction === "asc" ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />;
}

function getNextStep(item: CaseItem) {
  if (
    item.status === "need_more_docs" ||
    item.intake.missingDocuments.length ||
    item.evidence.some((file) => ["needs_replacement", "rejected"].includes(file.status))
  ) {
    return {
      label: "Needs your action",
      description: item.intake.missingDocuments.length
        ? "Send the requested file or missing document."
        : "Open the case and check the latest request.",
      tone: "bg-amber-100 text-amber-900",
      rowTone: "bg-amber-50/70",
    };
  }

  if (item.status === "resolved") {
    return {
      label: "Resolved",
      description: "No action needed right now.",
      tone: "bg-emerald-100 text-emerald-900",
      rowTone: "bg-emerald-50/55",
    };
  }

  return {
    label: "In progress",
    description: "Check updates while the review continues.",
    tone: "bg-sky-100 text-sky-900",
    rowTone: "bg-background",
  };
}

export function CitizenRecentCasesTable({
  cases,
  totalVisibleCount,
  title = "Recent cases",
  description = "Your latest visible cases stay in a calmer table so status checks are faster.",
  emptyTitle = "No recent cases",
  emptyDescription = "Visible cases will appear here once you submit them.",
}: {
  cases: CaseItem[];
  totalVisibleCount?: number;
  title?: string;
  description?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<CitizenSortKey>("submitted");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const deferredQuery = useDeferredValue(query);

  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const filteredCases = [...cases]
    .filter((item) => {
      if (!normalizedQuery) return true;

      return [
        item.reference,
        item.title,
        item.status,
        item.location,
        item.intake.urgency,
        item.intake.category,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    })
    .sort((left, right) => {
      switch (sortKey) {
        case "title":
          return compareText(left.title, right.title, sortDirection);
        case "status":
          return compareText(left.status, right.status, sortDirection);
        case "priority":
          return compareNumber(
            getPriorityRank(left.intake.urgency),
            getPriorityRank(right.intake.urgency),
            sortDirection
          );
        case "updated":
          return compareText(left.updatedAt, right.updatedAt, sortDirection);
        case "submitted":
        default:
          return compareText(left.createdAt, right.createdAt, sortDirection);
      }
    });

  const toggleSort = (nextKey: CitizenSortKey) => {
    if (sortKey === nextKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextKey);
    setSortDirection(nextKey === "title" || nextKey === "status" ? "asc" : "desc");
  };

  return (
    <section className="surface-panel p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-heading text-2xl font-bold tracking-tight text-primary">{title}</h2>
            <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Showing {cases.length}
              {totalVisibleCount && totalVisibleCount > cases.length ? ` of ${totalVisibleCount}` : ""}
            </span>
          </div>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search your cases"
            className="h-12 rounded-full pl-11"
          />
        </div>
      </div>

      {filteredCases.length ? (
        <div className="mt-5 overflow-x-auto rounded-[24px] border border-border/60 bg-background/80">
          <table className="min-w-[980px] table-fixed border-separate border-spacing-0">
            <thead>
              <tr className="text-left">
                {[
                  { label: "Case", key: "title" as const, className: "w-[34%]" },
                  { label: "Status", key: "status" as const, className: "w-[14%]" },
                  { label: "What happens next", key: "priority" as const, className: "w-[24%]" },
                  { label: "Updated", key: "updated" as const, className: "w-[12%]" },
                  { label: "Files", key: "priority" as const, className: "w-[6%]" },
                  { label: "Open", key: "priority" as const, className: "w-[10%]" },
                ].map((column, index) => (
                  <th
                    key={column.label}
                    className={cn(
                      "border-b border-border/70 bg-background/80 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground",
                      column.className,
                      index === 0 ? "rounded-tl-[18px]" : "",
                      index === 5 ? "rounded-tr-[18px]" : ""
                    )}
                  >
                    {column.label === "Files" || column.label === "Open" || column.label === "What happens next" ? (
                      column.label
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggleSort(column.key)}
                        className="inline-flex items-center gap-2 text-left transition-colors hover:text-foreground"
                      >
                        <span>{column.label}</span>
                        <SortIcon active={sortKey === column.key} direction={sortDirection} />
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredCases.map((item) => {
                const nextStep = getNextStep(item);

                return (
                  <tr key={item.id} className={cn("group", nextStep.rowTone)}>
                    <td className="border-b border-border/60 px-4 py-4 align-top">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground group-hover:text-primary">
                              {item.title}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {item.reference} / {item.type.replaceAll("_", " ")}
                            </p>
                          </div>
                          <PriorityBadge urgency={item.intake.urgency} />
                        </div>
                        <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
                          {item.location}
                        </p>
                      </div>
                    </td>
                    <td className="border-b border-border/60 px-4 py-4 align-top">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="border-b border-border/60 px-4 py-4 align-top">
                      <div className="space-y-2">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
                            nextStep.tone
                          )}
                        >
                          {nextStep.label}
                        </span>
                        <p className="text-sm leading-6 text-muted-foreground">{nextStep.description}</p>
                      </div>
                    </td>
                    <td className="border-b border-border/60 px-4 py-4 align-top text-sm text-muted-foreground">
                      <div className="space-y-1">
                        <p>{formatDate(item.updatedAt)}</p>
                        <p>Submitted {formatDate(item.createdAt)}</p>
                      </div>
                    </td>
                    <td className="border-b border-border/60 px-4 py-4 align-top text-sm font-semibold text-foreground">
                      {item.evidence.length}
                    </td>
                    <td className="border-b border-border/60 px-4 py-4 align-top">
                      <Link
                        href={`/cases/${item.id}`}
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full px-3")}
                      >
                        <span>Open</span>
                        <ExternalLink className="size-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-5">
          <EmptyState
            icon={<Search className="size-5" />}
            title={query ? "No cases match this search" : emptyTitle}
            description={
              query ? "Try a broader search term to bring matching cases back." : emptyDescription
            }
          />
        </div>
      )}
    </section>
  );
}
