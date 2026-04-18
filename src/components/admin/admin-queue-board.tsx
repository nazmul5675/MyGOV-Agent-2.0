"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Search } from "lucide-react";

import type { CaseItem } from "@/lib/types";
import { CaseCard } from "@/components/common/case-card";
import { EmptyState } from "@/components/common/empty-state";
import { Input } from "@/components/ui/input";

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
            <CaseCard key={item.id} item={item} href={`/admin/cases/${item.id}`} />
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
