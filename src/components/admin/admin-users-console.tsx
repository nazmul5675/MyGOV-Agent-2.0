"use client";

import { useDeferredValue, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock3,
  Search,
  ShieldCheck,
  UserCog,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { updateAdminUserRole } from "@/lib/actions/users";
import type { AdminManagedUser } from "@/lib/types";
import { cn } from "@/lib/utils";

type RoleFilter = "all" | "citizen" | "admin";
type StatusFilter = "all" | "active" | "invited" | "disabled";
type UserSortKey =
  | "name"
  | "email"
  | "role"
  | "status"
  | "created"
  | "active"
  | "cases"
  | "openCases"
  | "profile";
type SortDirection = "asc" | "desc";
const USERS_PER_PAGE = 10;

function formatDate(value?: string) {
  if (!value) return "Not available";

  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return value;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(parsed));
}

function compareText(left: string, right: string, direction: SortDirection) {
  return direction === "asc" ? left.localeCompare(right) : right.localeCompare(left);
}

function compareNumber(left: number, right: number, direction: SortDirection) {
  return direction === "asc" ? left - right : right - left;
}

function roleChipTone(role: AdminManagedUser["role"]) {
  return role === "admin"
    ? "bg-primary/10 text-primary"
    : "bg-emerald-100 text-emerald-800";
}

function statusChipTone(status: NonNullable<AdminManagedUser["accountStatus"]>) {
  if (status === "disabled") return "bg-rose-100 text-rose-700";
  if (status === "invited") return "bg-amber-100 text-amber-800";
  return "bg-slate-100 text-slate-700";
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

export function AdminUsersConsole({ users }: { users: AdminManagedUser[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<UserSortKey>("created");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<AdminManagedUser | null>(null);
  const [pendingRoleTarget, setPendingRoleTarget] = useState<AdminManagedUser | null>(null);
  const [isPending, startTransition] = useTransition();
  const deferredQuery = useDeferredValue(query);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    return [...users]
      .filter((user) => {
        const matchesQuery = normalizedQuery
          ? [user.fullName, user.email, user.uid]
              .join(" ")
              .toLowerCase()
              .includes(normalizedQuery)
          : true;
        const matchesRole = roleFilter === "all" ? true : user.role === roleFilter;
        const matchesStatus =
          statusFilter === "all" ? true : (user.accountStatus || "active") === statusFilter;

        return matchesQuery && matchesRole && matchesStatus;
      })
      .sort((left, right) => {
        const leftStatus = left.accountStatus || "active";
        const rightStatus = right.accountStatus || "active";
        const leftActive = left.lastActiveAt || left.updatedAt || "";
        const rightActive = right.lastActiveAt || right.updatedAt || "";

        switch (sortKey) {
          case "name":
            return compareText(left.fullName, right.fullName, sortDirection);
          case "email":
            return compareText(left.email, right.email, sortDirection);
          case "role":
            return compareText(left.role, right.role, sortDirection);
          case "status":
            return compareText(leftStatus, rightStatus, sortDirection);
          case "active":
            return compareText(leftActive, rightActive, sortDirection);
          case "cases":
            return compareNumber(left.casesCount, right.casesCount, sortDirection);
          case "openCases":
            return compareNumber(left.openCasesCount, right.openCasesCount, sortDirection);
          case "profile":
            return compareNumber(left.profileCompleteness, right.profileCompleteness, sortDirection);
          case "created":
          default:
            return compareText(left.createdAt || "", right.createdAt || "", sortDirection);
        }
      });
  }, [deferredQuery, roleFilter, sortDirection, sortKey, statusFilter, users]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * USERS_PER_PAGE;
  const endIndex = Math.min(startIndex + USERS_PER_PAGE, filteredUsers.length);
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  const toggleSort = (nextKey: UserSortKey) => {
    if (sortKey === nextKey) {
      setCurrentPage(1);
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setCurrentPage(1);
    setSortKey(nextKey);
    setSortDirection(
      nextKey === "name" || nextKey === "email" || nextKey === "role" || nextKey === "status"
        ? "asc"
        : "desc"
    );
  };

  const runRoleUpdate = (user: AdminManagedUser) => {
    const nextRole = user.role === "admin" ? "citizen" : "admin";

    startTransition(async () => {
      try {
        await updateAdminUserRole({
          userId: user.uid,
          role: nextRole,
        });
        toast.success("Role updated", {
          description:
            nextRole === "admin"
              ? `${user.fullName} now has admin access.`
              : `${user.fullName} now has citizen access.`,
        });
        setPendingRoleTarget(null);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to update role.");
      }
    });
  };

  return (
    <>
      <div className="space-y-5">
        <section className="surface-panel p-5 sm:p-6">
          <div className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="font-heading text-2xl font-bold tracking-tight text-primary">
                    User directory
                  </h2>
                  <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {filteredUsers.length} visible
                  </span>
                  {filteredUsers.length ? (
                    <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Showing {startIndex + 1}-{endIndex}
                    </span>
                  ) : null}
                </div>
                <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                  Scan accounts in one practical management table, then open details or update roles
                  without leaving the control console.
                </p>
              </div>

              <div className="relative w-full max-w-xl">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => {
                    setCurrentPage(1);
                    setQuery(event.target.value);
                  }}
                  placeholder="Search users by name, email, or UID"
                  className="h-12 rounded-full pl-11"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap gap-2">
                {(["all", "citizen", "admin"] as const).map((item) => (
                  <button
                    key={`role-${item}`}
                    type="button"
                    onClick={() => {
                      setCurrentPage(1);
                      setRoleFilter(item);
                    }}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-semibold transition-all",
                      roleFilter === item
                        ? "bg-primary text-primary-foreground shadow-[0_14px_28px_rgba(0,30,64,0.18)]"
                        : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    {item === "all" ? "All roles" : item}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 xl:justify-end">
                {(["all", "active", "invited", "disabled"] as const).map((item) => (
                  <button
                    key={`status-${item}`}
                    type="button"
                    onClick={() => {
                      setCurrentPage(1);
                      setStatusFilter(item);
                    }}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-semibold transition-all",
                      statusFilter === item
                        ? "bg-primary text-primary-foreground shadow-[0_14px_28px_rgba(0,30,64,0.18)]"
                        : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    {item === "all" ? "All status" : item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {filteredUsers.length ? (
          <div className="overflow-x-auto rounded-[28px] border border-border/70 bg-background/90">
            <table className="min-w-[1260px] table-fixed border-separate border-spacing-0">
              <thead>
                <tr className="text-left">
                  {[
                    { label: "User", key: "name" as const, className: "w-[18%]" },
                    { label: "Email", key: "email" as const, className: "w-[18%]" },
                    { label: "Role", key: "role" as const, className: "w-[8%]" },
                    { label: "Status", key: "status" as const, className: "w-[9%]" },
                    { label: "Created", key: "created" as const, className: "w-[10%]" },
                    { label: "Last active", key: "active" as const, className: "w-[10%]" },
                    { label: "Cases", key: "cases" as const, className: "w-[7%]" },
                    { label: "Open", key: "openCases" as const, className: "w-[7%]" },
                    { label: "Profile", key: "profile" as const, className: "w-[8%]" },
                    { label: "Actions", key: "profile" as const, className: "w-[15%]" },
                  ].map((column, index) => (
                    <th
                      key={column.label}
                      className={cn(
                        "border-b border-border/70 bg-muted/40 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground",
                        column.className,
                        index === 0 ? "rounded-tl-[24px]" : "",
                        index === 9 ? "rounded-tr-[24px]" : ""
                      )}
                    >
                      {column.label === "Actions" ? (
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
                {paginatedUsers.map((user) => {
                  const accountStatus = user.accountStatus || "active";

                  return (
                    <tr key={user.uid} className="group bg-background align-top">
                      <td className="border-b border-border/60 px-4 py-4">
                        <div className="space-y-1">
                          <p className="font-semibold text-foreground group-hover:text-primary">
                            {user.fullName}
                          </p>
                          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                            {user.uid}
                          </p>
                        </div>
                      </td>
                      <td className="border-b border-border/60 px-4 py-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{user.email}</p>
                          <p className="mt-1 text-xs text-muted-foreground">Primary sign-in email</p>
                        </div>
                      </td>
                      <td className="border-b border-border/60 px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${roleChipTone(user.role)}`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="border-b border-border/60 px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${statusChipTone(accountStatus)}`}
                        >
                          {accountStatus}
                        </span>
                      </td>
                      <td className="border-b border-border/60 px-4 py-4 text-sm text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="border-b border-border/60 px-4 py-4 text-sm text-muted-foreground">
                        {formatDate(user.lastActiveAt || user.updatedAt)}
                      </td>
                      <td className="border-b border-border/60 px-4 py-4 text-sm font-semibold text-foreground">
                        {user.casesCount}
                      </td>
                      <td className="border-b border-border/60 px-4 py-4 text-sm font-semibold text-foreground">
                        {user.openCasesCount}
                      </td>
                      <td className="border-b border-border/60 px-4 py-4">
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-foreground">
                            {user.profileCompleteness}%
                          </p>
                          <div className="h-2 rounded-full bg-muted">
                            <div
                              className="h-2 rounded-full bg-primary"
                              style={{ width: `${Math.min(100, Math.max(0, user.profileCompleteness))}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="border-b border-border/60 px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full px-3"
                            onClick={() => setSelectedUser(user)}
                          >
                            <UserRound className="size-3.5" />
                            View
                          </Button>

                          <Button
                            variant={user.role === "admin" ? "outline" : "default"}
                            size="sm"
                            className="rounded-full px-3"
                            onClick={() => setPendingRoleTarget(user)}
                          >
                            <UserCog className="size-3.5" />
                            {user.role === "admin" ? "Demote" : "Promote"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredUsers.length > USERS_PER_PAGE ? (
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
                    {startIndex + 1}-{endIndex} of {filteredUsers.length}
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
            title="No users match the current filters"
            description="Try a broader search or switch back to all roles and status values."
          />
        )}
      </div>

      <Sheet open={Boolean(selectedUser)} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <SheetContent className="w-full sm:max-w-2xl">
          {selectedUser ? (
            <>
              <SheetHeader className="border-b border-border/70 px-6 py-5">
                <SheetTitle>User workspace</SheetTitle>
                <SheetDescription>
                  Inspect profile completeness, role, activity, and related case load before making access changes.
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-5 overflow-y-auto px-6 py-5">
                <section className="rounded-[24px] bg-muted/70 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <UserRound className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xl font-bold text-foreground">
                        {selectedUser.fullName}
                      </p>
                      <p className="break-words text-sm text-muted-foreground">
                        {selectedUser.email}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${roleChipTone(selectedUser.role)}`}
                    >
                      {selectedUser.role}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${statusChipTone(selectedUser.accountStatus || "active")}`}
                    >
                      {selectedUser.accountStatus || "active"}
                    </span>
                  </div>
                </section>

                <section className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[22px] border border-border/70 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Created
                    </p>
                    <p className="mt-2 font-semibold text-foreground">
                      {formatDate(selectedUser.createdAt)}
                    </p>
                  </div>

                  <div className="rounded-[22px] border border-border/70 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Last active
                    </p>
                    <p className="mt-2 font-semibold text-foreground">
                      {formatDate(selectedUser.lastActiveAt || selectedUser.updatedAt)}
                    </p>
                  </div>

                  <div className="rounded-[22px] border border-border/70 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Related cases
                    </p>
                    <p className="mt-2 font-semibold text-foreground">
                      {selectedUser.casesCount} total / {selectedUser.openCasesCount} open
                    </p>
                  </div>

                  <div className="rounded-[22px] border border-border/70 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Profile completeness
                    </p>
                    <p className="mt-2 font-semibold text-foreground">
                      {selectedUser.profileCompleteness}%
                    </p>
                  </div>
                </section>

                <section className="rounded-[24px] bg-primary/[0.04] p-5">
                  <div className="flex items-center gap-2 text-foreground">
                    <CheckCircle2 className="size-4 text-primary" />
                    <p className="font-semibold">Profile detail snapshot</p>
                  </div>

                  <div className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                    <p>Phone: {selectedUser.phoneNumber || "Not provided"}</p>
                    <p>Date of birth: {selectedUser.dateOfBirth || "Not provided"}</p>
                    <p>Address: {selectedUser.addressText || "Not provided"}</p>
                    <p>
                      Documents on file:{" "}
                      {selectedUser.documents?.length
                        ? selectedUser.documents.join(", ")
                        : "None yet"}
                    </p>
                  </div>
                </section>

                <section className="rounded-[24px] border border-border/70 p-5">
                  <div className="flex items-center gap-2 text-foreground">
                    <ShieldCheck className="size-4 text-primary" />
                    <p className="font-semibold">Role control</p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Promotions and demotions update the Mongo-backed profile and,
                    when Firebase Admin is configured, sync auth claims too.
                  </p>
                  <Button
                    className="mt-4 rounded-full px-4"
                    variant={selectedUser.role === "admin" ? "outline" : "default"}
                    onClick={() => setPendingRoleTarget(selectedUser)}
                  >
                    <UserCog className="size-4" />
                    {selectedUser.role === "admin" ? "Move to citizen" : "Promote to admin"}
                  </Button>
                </section>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <Dialog
        open={Boolean(pendingRoleTarget)}
        onOpenChange={(open) => !open && setPendingRoleTarget(null)}
      >
        <DialogContent className="max-w-md rounded-[28px] p-0">
          {pendingRoleTarget ? (
            <>
              <DialogHeader className="px-6 pt-6">
                <DialogTitle>Confirm role update</DialogTitle>
                <DialogDescription>
                  {pendingRoleTarget.role === "admin"
                    ? `Move ${pendingRoleTarget.fullName} back to citizen access?`
                    : `Promote ${pendingRoleTarget.fullName} to admin access?`}
                </DialogDescription>
              </DialogHeader>

              <div className="px-6 pb-6 text-sm leading-7 text-muted-foreground">
                This change updates the Mongo-backed user record immediately and
                writes an audit trail for the control console.
              </div>

              <DialogFooter className="rounded-b-[28px] px-6 pb-6">
                <Button
                  variant={pendingRoleTarget.role === "admin" ? "destructive" : "default"}
                  disabled={isPending}
                  onClick={() => runRoleUpdate(pendingRoleTarget)}
                >
                  {isPending ? (
                    <Clock3 className="size-4 animate-pulse" />
                  ) : (
                    <UserCog className="size-4" />
                  )}
                  {pendingRoleTarget.role === "admin"
                    ? "Confirm demotion"
                    : "Confirm promotion"}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
