"use client";

import Link from "next/link";
import { useDeferredValue, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArchiveRestore,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  ExternalLink,
  LoaderCircle,
  Search,
} from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { PriorityBadge } from "@/components/common/priority-badge";
import { StatusBadge } from "@/components/common/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { updateCaseVisibilityAction } from "@/lib/actions/cases";
import type { CaseItem } from "@/lib/types";
import { cn } from "@/lib/utils";

type AdminSortKey =
  | "submitted"
  | "updated"
  | "title"
  | "citizen"
  | "status"
  | "priority";
type SortDirection = "asc" | "desc";
type VisibilityFilter = "visible" | "hidden" | "all";

const CASES_PER_PAGE = 5;

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

function isStalled(item: CaseItem) {
  if (["resolved", "rejected"].includes(item.status)) return false;
  const daysSinceUpdate =
    (Date.now() - new Date(item.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceUpdate >= 7;
}

function getRowTone(item: CaseItem) {
  if (item.isHidden) return "bg-muted/20 opacity-80";
  if (item.status === "need_more_docs") return "bg-amber-50/70";
  if (item.intake.urgency === "high") return "bg-rose-50/60";
  if (isStalled(item)) return "bg-sky-50/60";
  return "bg-background";
}

function getQueueSignals(item: CaseItem) {
  const signals: Array<{ label: string; className: string }> = [];

  if (item.intake.urgency === "high") {
    signals.push({ label: "Urgent", className: "bg-rose-100 text-rose-800" });
  }
  if (item.status === "need_more_docs") {
    signals.push({ label: "Waiting on citizen", className: "bg-amber-100 text-amber-800" });
  }
  if (isStalled(item)) {
    signals.push({ label: "Stalled", className: "bg-sky-100 text-sky-800" });
  }
  if (item.isHidden) {
    signals.push({ label: "Hidden", className: "bg-slate-200 text-slate-800" });
  }

  return signals;
}

function SortIcon({
  active,
  direction,
}: {
  active: boolean;
  direction: SortDirection;
}) {
  if (!active) return <ArrowUpDown className="size-3.5" />;
  return direction === "asc" ? (
    <ArrowUp className="size-3.5" />
  ) : (
    <ArrowDown className="size-3.5" />
  );
}

export function AdminCaseQueueTable({ cases }: { cases: CaseItem[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>("visible");
  const [sortKey, setSortKey] = useState<AdminSortKey>("submitted");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [isPending, startTransition] = useTransition();
  const deferredQuery = useDeferredValue(query);

  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const visibleCount = cases.filter((item) => !item.isHidden).length;
  const hiddenCount = cases.filter((item) => item.isHidden).length;
  const actionNeededCount = cases.filter(
    (item) =>
      !item.isHidden &&
      (item.intake.urgency === "high" ||
        item.status === "need_more_docs" ||
        item.status === "submitted" ||
        isStalled(item))
  ).length;

  const filteredCases = [...cases]
    .filter((item) => {
      const matchesVisibility =
        visibilityFilter === "all"
          ? true
          : visibilityFilter === "hidden"
            ? item.isHidden
            : !item.isHidden;

      if (!matchesVisibility) return false;
      if (!normalizedQuery) return true;

      return [
        item.reference,
        item.title,
        item.citizenName,
        item.location,
        item.status,
        item.intake.urgency,
        item.assignedUnit,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    })
    .sort((left, right) => {
      switch (sortKey) {
        case "title":
          return compareText(left.title, right.title, sortDirection);
        case "citizen":
          return compareText(left.citizenName, right.citizenName, sortDirection);
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

  const totalPages = Math.max(1, Math.ceil(filteredCases.length / CASES_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * CASES_PER_PAGE;
  const endIndex = Math.min(startIndex + CASES_PER_PAGE, filteredCases.length);
  const paginatedCases = filteredCases.slice(startIndex, endIndex);

  const toggleSort = (nextKey: AdminSortKey) => {
    if (sortKey === nextKey) {
      setCurrentPage(1);
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setCurrentPage(1);
    setSortKey(nextKey);
    setSortDirection(nextKey === "title" || nextKey === "citizen" || nextKey === "status" ? "asc" : "desc");
  };

  const confirmVisibilityChange = () => {
    if (!selectedCase) return;

    startTransition(async () => {
      try {
        const nextHiddenState = !selectedCase.isHidden;
        await updateCaseVisibilityAction(selectedCase.id, { isHidden: nextHiddenState });
        toast.success(nextHiddenState ? "Case hidden" : "Case restored", {
          description: nextHiddenState
            ? "The case is now removed from citizen and admin visible queues."
            : "The case is visible again in the citizen and admin queues.",
        });
        setSelectedCase(null);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to update case visibility");
      }
    });
  };

  return (
    <section className="space-y-5">
      <div className="surface-panel p-5 sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-heading text-2xl font-bold tracking-tight text-primary">
                Full case queue
              </h2>
              <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {cases.length} saved
              </span>
              <span className="rounded-full bg-rose-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-800">
                {actionNeededCount} need action
              </span>
            </div>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Use this table to scan what is urgent, blocked, stalled, or hidden, then open the next case without reading every row in full.
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Visible", value: "visible" as const, count: visibleCount },
                { label: "Hidden", value: "hidden" as const, count: hiddenCount },
                { label: "All saved", value: "all" as const, count: cases.length },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    setCurrentPage(1);
                    setVisibilityFilter(item.value);
                  }}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-semibold transition-all",
                    visibilityFilter === item.value
                      ? "bg-primary text-primary-foreground shadow-[0_14px_24px_rgba(0,30,64,0.18)]"
                      : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  {item.label} ({item.count})
                </button>
              ))}
            </div>
          </div>
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => {
                setCurrentPage(1);
                setQuery(event.target.value);
              }}
              placeholder="Search by case, citizen, desk, location, or state"
              className="h-12 rounded-full pl-11"
            />
          </div>
        </div>
      </div>

      {filteredCases.length ? (
        <div className="overflow-x-auto rounded-[28px] border border-border/70 bg-background/90">
          <table className="min-w-[1120px] table-fixed border-separate border-spacing-0">
            <thead>
              <tr className="text-left">
                {[
                  { label: "Case", key: "title" as const, className: "w-[31%]" },
                  { label: "Review state", key: "status" as const, className: "w-[20%]" },
                  { label: "Evidence and routing", key: "priority" as const, className: "w-[19%]" },
                  { label: "Updated", key: "updated" as const, className: "w-[12%]" },
                  { label: "Visibility", key: "priority" as const, className: "w-[8%]" },
                  { label: "Actions", key: "priority" as const, className: "w-[10%]" },
                ].map((column, index) => (
                  <th
                    key={column.label}
                    className={cn(
                      "border-b border-border/70 bg-muted/40 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground",
                      column.className,
                      index === 0 ? "rounded-tl-[24px]" : "",
                      index === 5 ? "rounded-tr-[24px]" : ""
                    )}
                  >
                    {column.label === "Visibility" || column.label === "Actions" ? (
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
              {paginatedCases.map((item) => {
                const signals = getQueueSignals(item);

                return (
                  <tr key={item.id} className={cn("group", getRowTone(item))}>
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
                        <div className="text-sm leading-6 text-muted-foreground">
                          <p className="font-medium text-foreground">{item.citizenName}</p>
                          <p>{item.location}</p>
                        </div>
                      </div>
                    </td>
                    <td className="border-b border-border/60 px-4 py-4 align-top">
                      <div className="space-y-3">
                        <StatusBadge status={item.status} />
                        <div className="flex flex-wrap gap-2">
                          {signals.length ? (
                            signals.map((signal) => (
                              <span
                                key={signal.label}
                                className={cn(
                                  "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
                                  signal.className
                                )}
                              >
                                {signal.label}
                              </span>
                            ))
                          ) : (
                            <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-800">
                              On track
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="border-b border-border/60 px-4 py-4 align-top">
                      <div className="space-y-2 text-sm">
                        <p className="font-semibold text-foreground">{item.assignedUnit}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
                          <span>{item.evidence.length} file{item.evidence.length === 1 ? "" : "s"}</span>
                          <span>
                            {item.intake.missingDocuments.length} missing doc
                            {item.intake.missingDocuments.length === 1 ? "" : "s"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="border-b border-border/60 px-4 py-4 align-top text-sm text-muted-foreground">
                      <div className="space-y-1">
                        <p>Updated {formatDate(item.updatedAt)}</p>
                        <p>Submitted {formatDate(item.createdAt)}</p>
                      </div>
                    </td>
                    <td className="border-b border-border/60 px-4 py-4 align-top">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
                          item.isHidden
                            ? "bg-slate-200 text-slate-800"
                            : "bg-emerald-100 text-emerald-900"
                        )}
                      >
                        {item.isHidden ? "Hidden" : "Visible"}
                      </span>
                    </td>
                    <td className="border-b border-border/60 px-4 py-4 align-top">
                      <div className="flex flex-col gap-2">
                        <Link
                          href={`/admin/cases/${item.id}`}
                          className={cn(
                            buttonVariants({ size: "sm" }),
                            "rounded-full px-3"
                          )}
                        >
                          <span>Open</span>
                          <ExternalLink className="size-3.5" />
                        </Link>
                        <Button
                          variant={item.isHidden ? "outline" : "destructive"}
                          size="sm"
                          className="rounded-full px-3"
                          onClick={() => setSelectedCase(item)}
                        >
                          {item.isHidden ? (
                            <ArchiveRestore className="size-3.5" />
                          ) : (
                            <EyeOff className="size-3.5" />
                          )}
                          {item.isHidden ? "Unhide" : "Hide"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredCases.length > CASES_PER_PAGE ? (
            <div className="flex flex-col gap-3 border-t border-border/60 bg-muted/20 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Page {safeCurrentPage} of {totalPages}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full px-3"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={safeCurrentPage === 1}
                >
                  <ChevronLeft className="size-3.5" />
                  Previous
                </Button>
                <div className="rounded-full bg-background px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {startIndex + 1}-{endIndex} of {filteredCases.length}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full px-3"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={safeCurrentPage === totalPages}
                >
                  Next
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <EmptyState
          icon={<Search className="size-5" />}
          title="No cases match this queue view"
          description="Adjust the visibility filter or search term to bring matching case records back into the queue."
        />
      )}

      <Dialog open={Boolean(selectedCase)} onOpenChange={(open) => (!open ? setSelectedCase(null) : null)}>
        <DialogContent className="rounded-[28px] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>
              {selectedCase?.isHidden ? "Restore this case?" : "Hide this case?"}
            </DialogTitle>
            <DialogDescription>
              {selectedCase?.isHidden
                ? "The case will return to the citizen dashboard and the admin visible queues, but it will remain in the full case queue either way."
                : "The case will disappear from the citizen dashboard and the admin visible queues, but the saved record will stay in the permanent case queue."}
            </DialogDescription>
          </DialogHeader>
          {selectedCase ? (
            <div className="px-6 pb-2">
              <div className="rounded-[22px] bg-muted/70 p-4">
                <p className="font-semibold text-foreground">{selectedCase.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedCase.reference} / {selectedCase.citizenName}
                </p>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedCase(null)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={confirmVisibilityChange} disabled={isPending}>
              {isPending ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : selectedCase?.isHidden ? (
                <Eye className="size-4" />
              ) : (
                <EyeOff className="size-4" />
              )}
              {selectedCase?.isHidden ? "Unhide case" : "Hide case"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
