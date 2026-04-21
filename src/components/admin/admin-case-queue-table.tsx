"use client";

import Link from "next/link";
import { useDeferredValue, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArchiveRestore,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
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
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [isPending, startTransition] = useTransition();
  const deferredQuery = useDeferredValue(query);

  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const visibleCount = cases.filter((item) => !item.isHidden).length;
  const hiddenCount = cases.filter((item) => item.isHidden).length;

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

  const toggleSort = (nextKey: AdminSortKey) => {
    if (sortKey === nextKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

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
            </div>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              This is the persistent admin source of truth. Every submitted case stays here, even after it is hidden from citizen and visible admin dashboards.
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Visible", value: "visible" as const, count: visibleCount },
                { label: "Hidden", value: "hidden" as const, count: hiddenCount },
                { label: "All", value: "all" as const, count: cases.length },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setVisibilityFilter(item.value)}
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
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by case, citizen, status, location, or desk"
              className="h-12 rounded-full pl-11"
            />
          </div>
        </div>
      </div>

      {filteredCases.length ? (
        <div className="overflow-x-auto rounded-[28px] border border-border/70 bg-background/90">
          <table className="min-w-[1180px] table-fixed border-separate border-spacing-0">
            <thead>
              <tr className="text-left">
                {[
                  { label: "Case ID", key: "submitted" as const, className: "w-[12%]" },
                  { label: "Title / Subject", key: "title" as const, className: "w-[22%]" },
                  { label: "Citizen", key: "citizen" as const, className: "w-[14%]" },
                  { label: "Submitted", key: "submitted" as const, className: "w-[10%]" },
                  { label: "Updated", key: "updated" as const, className: "w-[10%]" },
                  { label: "Status", key: "status" as const, className: "w-[11%]" },
                  { label: "Priority", key: "priority" as const, className: "w-[8%]" },
                  { label: "Visibility", key: "priority" as const, className: "w-[8%]" },
                  { label: "Actions", key: "priority" as const, className: "w-[15%]" },
                ].map((column, index) => (
                  <th
                    key={column.label}
                    className={cn(
                      "border-b border-border/70 bg-muted/40 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground",
                      column.className,
                      index === 0 ? "rounded-tl-[24px]" : "",
                      index === 8 ? "rounded-tr-[24px]" : ""
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
              {filteredCases.map((item) => (
                <tr
                  key={item.id}
                  className={cn(
                    "group",
                    item.isHidden ? "bg-muted/25 opacity-75" : "bg-background"
                  )}
                >
                  <td className="border-b border-border/60 px-4 py-4 align-top text-sm font-semibold text-foreground">
                    <div className="space-y-1">
                      <p>{item.reference}</p>
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                        {item.type.replaceAll("_", " ")}
                      </p>
                    </div>
                  </td>
                  <td className="border-b border-border/60 px-4 py-4 align-top">
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground group-hover:text-primary">{item.title}</p>
                      <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
                        {item.location}
                      </p>
                    </div>
                  </td>
                  <td className="border-b border-border/60 px-4 py-4 align-top">
                    <div className="space-y-1 text-sm">
                      <p className="font-semibold text-foreground">{item.citizenName}</p>
                      <p className="text-muted-foreground">{item.assignedUnit}</p>
                    </div>
                  </td>
                  <td className="border-b border-border/60 px-4 py-4 align-top text-sm text-muted-foreground">
                    {formatDate(item.createdAt)}
                  </td>
                  <td className="border-b border-border/60 px-4 py-4 align-top text-sm text-muted-foreground">
                    {formatDate(item.updatedAt)}
                  </td>
                  <td className="border-b border-border/60 px-4 py-4 align-top">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="border-b border-border/60 px-4 py-4 align-top">
                    <PriorityBadge urgency={item.intake.urgency} />
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
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/cases/${item.id}`}
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full px-3")}
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
                        {item.isHidden ? <ArchiveRestore className="size-3.5" /> : <EyeOff className="size-3.5" />}
                        {item.isHidden ? "Unhide" : "Hide"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
              {isPending ? <LoaderCircle className="size-4 animate-spin" /> : selectedCase?.isHidden ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
              {selectedCase?.isHidden ? "Unhide case" : "Hide case"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
