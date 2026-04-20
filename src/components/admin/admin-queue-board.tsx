"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { ArrowRight, Search, ShieldAlert, Sparkles } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { StatusBadge } from "@/components/common/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CaseItem } from "@/lib/types";
import { cn } from "@/lib/utils";

type AdminQueueFilter = "all" | "needs_review" | "need_more_docs" | "in_progress" | "resolved";

const filters: Array<{ label: string; value: AdminQueueFilter }> = [
  { label: "All", value: "all" },
  { label: "Needs review", value: "needs_review" },
  { label: "Need docs", value: "need_more_docs" },
  { label: "In progress", value: "in_progress" },
  { label: "Resolved", value: "resolved" },
];

const filterCountsConfig = {
  all: 0,
  needs_review: 0,
  need_more_docs: 0,
  in_progress: 0,
  resolved: 0,
};

export function AdminQueueBoard({ cases }: { cases: CaseItem[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<AdminQueueFilter>("all");
  const deferredQuery = useDeferredValue(query);

  const filterCounts = useMemo(() => {
    return {
      ...filterCountsConfig,
      all: cases.length,
      needs_review: cases.filter((item) =>
        ["submitted", "reviewing", "need_more_docs"].includes(item.status)
      ).length,
      need_more_docs: cases.filter((item) => item.status === "need_more_docs").length,
      in_progress: cases.filter((item) => item.status === "in_progress").length,
      resolved: cases.filter((item) => item.status === "resolved").length,
    };
  }, [cases]);

  const filteredCases = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    return cases.filter((item) => {
      const matchesFilter =
        filter === "all"
          ? true
          : filter === "needs_review"
            ? ["submitted", "reviewing", "need_more_docs"].includes(item.status)
            : item.status === filter;
      const matchesQuery = normalizedQuery
        ? [item.title, item.reference, item.location, item.citizenName]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery)
        : true;

      return matchesFilter && matchesQuery;
    });
  }, [cases, deferredQuery, filter]);

  return (
    <div className="space-y-5">
      <div className="surface-panel p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by case, citizen, location, or reference"
              className="h-12 rounded-full pl-11"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                  filter === item.value
                    ? "bg-primary text-primary-foreground shadow-[0_14px_24px_rgba(0,30,64,0.18)]"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {item.label} ({filterCounts[item.value]})
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredCases.length ? (
        <div className="grid gap-5 xl:grid-cols-2">
          {filteredCases.map((item) => (
            <article
              key={item.id}
              className="surface-panel interactive-lift flex h-full flex-col gap-5 p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/70">
                    {item.reference}
                  </p>
                  <h3 className="mt-2 text-xl font-bold tracking-tight text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {item.citizenName} / {item.location}
                  </p>
                </div>
                <StatusBadge status={item.status} />
              </div>

              <p className="text-sm leading-7 text-muted-foreground">{item.intake.adminSummary}</p>

              <div className="rounded-[20px] border border-primary/10 bg-primary/[0.04] p-4 text-sm leading-7 text-muted-foreground">
                <div className="flex items-center gap-2 text-foreground">
                  <Sparkles className="size-4 text-primary" />
                  <span className="font-semibold">AI summary focus</span>
                </div>
                <p className="mt-2">
                  {item.intake.missingDocuments.length
                    ? `Prioritize ${item.intake.missingDocuments[0]} and check whether the current file packet already supports a citizen-facing follow-up.`
                    : "This packet looks structurally complete. Use the AI helper to draft an officer summary and route note before moving it forward."}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[20px] bg-muted/80 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Evidence
                  </p>
                  <p className="mt-2 font-semibold text-foreground">{item.evidence.length} files</p>
                </div>
                <div className="rounded-[20px] bg-muted/80 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Missing docs
                  </p>
                  <p className="mt-2 font-semibold text-foreground">
                    {item.intake.missingDocuments.length || 0}
                  </p>
                </div>
                <div className="rounded-[20px] bg-muted/80 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Urgency
                  </p>
                  <p className="mt-2 font-semibold capitalize text-foreground">
                    {item.intake.urgency}
                  </p>
                </div>
              </div>

              {item.evidence.some((file) =>
                ["uploaded", "needs_replacement", "under_review"].includes(file.status)
              ) ? (
                <div className="rounded-[20px] border border-orange-200 bg-orange-50 p-4 text-sm leading-6 text-orange-900">
                  <div className="flex items-center gap-2 font-semibold">
                    <ShieldAlert className="size-4" />
                    Files need operational review
                  </div>
                  <p className="mt-2">
                    Review uploaded evidence before routing or resolving this case.
                  </p>
                </div>
              ) : null}

              <Link
                href={`/admin/cases/${item.id}`}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "mt-auto justify-between px-4"
                )}
              >
                Open review workspace
                <ArrowRight className="size-4" />
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Search className="size-5" />}
          title="No cases match this filter"
          description="Try a different status view or a broader search term to bring cases back into the queue."
        />
      )}
    </div>
  );
}
