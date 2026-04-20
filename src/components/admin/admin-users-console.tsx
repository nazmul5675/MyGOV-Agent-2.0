"use client";

import { useDeferredValue, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock3,
  Mail,
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

type RoleFilter = "all" | "citizen" | "admin";
type StatusFilter = "all" | "active" | "invited" | "disabled";

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

export function AdminUsersConsole({ users }: { users: AdminManagedUser[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedUser, setSelectedUser] = useState<AdminManagedUser | null>(null);
  const [pendingRoleTarget, setPendingRoleTarget] = useState<AdminManagedUser | null>(null);
  const [isPending, startTransition] = useTransition();
  const deferredQuery = useDeferredValue(query);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    return users.filter((user) => {
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
    });
  }, [deferredQuery, roleFilter, statusFilter, users]);

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
            <div className="space-y-1">
              <h2 className="font-heading text-2xl font-bold tracking-tight text-primary">
                User directory
              </h2>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                Search across citizen and admin accounts, then inspect readiness,
                case load, and access level before making role changes.
              </p>
            </div>

            <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_auto] 2xl:items-center">
              <div className="relative w-full max-w-xl">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search users by name, email, or UID"
                  className="h-12 rounded-full pl-11"
                />
              </div>

              <div className="flex flex-col gap-2 xl:items-end">
                <div className="flex flex-wrap gap-2">
                  {(["all", "citizen", "admin"] as const).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setRoleFilter(item)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${roleFilter === item
                        ? "bg-primary text-primary-foreground shadow-[0_14px_28px_rgba(0,30,64,0.18)]"
                        : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        }`}
                    >
                      {item === "all" ? "All roles" : item}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  {(["all", "active", "invited", "disabled"] as const).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setStatusFilter(item)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${statusFilter === item
                        ? "bg-primary text-primary-foreground shadow-[0_14px_28px_rgba(0,30,64,0.18)]"
                        : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        }`}
                    >
                      {item === "all" ? "All status" : item}
                      {item !== "all" ? "" : ""}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {filteredUsers.length ? (
          <div className="space-y-4">
            {filteredUsers.map((user) => {
              const accountStatus = user.accountStatus || "active";

              return (
                <article
                  key={user.uid}
                  className="surface-panel interactive-lift min-w-0 p-5 sm:p-6"
                >
                  <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_220px] xl:items-start">
                    {/* LEFT CONTENT */}
                    <div className="min-w-0 space-y-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-xl font-bold tracking-tight text-foreground">
                            {user.fullName}
                          </h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {user.email}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2 sm:justify-end">
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${roleChipTone(user.role)}`}
                          >
                            {user.role}
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${statusChipTone(accountStatus)}`}
                          >
                            {accountStatus}
                          </span>
                        </div>
                      </div>

                      <div className="rounded-[22px] border border-primary/8 bg-primary/[0.04] p-4 text-sm">
                        <div className="flex items-center gap-2 text-foreground">
                          <Mail className="size-4 shrink-0 text-primary" />
                          <span className="font-semibold">Account summary</span>
                        </div>

                        <div className="mt-3 grid gap-3 text-muted-foreground sm:grid-cols-2">
                          <p>Created: {formatDate(user.createdAt)}</p>
                          <p>Last active: {formatDate(user.lastActiveAt || user.updatedAt)}</p>
                        </div>
                      </div>

                      <div className="grid gap-16 sm:grid-cols-3">
                        <div className="rounded-[20px] w-24 bg-muted/75 p-4">
                          <p className="text-xs uppercase tracking-[.18em] text-muted-foreground">
                            Related cases
                          </p>
                          <p className="mt-2 text-xl font-bold text-foreground">
                            {user.casesCount}
                          </p>
                        </div>

                        <div className="rounded-[20px] w-24  bg-muted/75 p-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                            Open cases
                          </p>
                          <p className="mt-2 text-xl font-bold text-foreground">
                            {user.openCasesCount}
                          </p>
                        </div>

                        <div className="rounded-[20px] w-24 bg-muted/75 p-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                            Profile score
                          </p>
                          <p className="mt-2 text-xl font-bold text-foreground">
                            {user.profileCompleteness}%
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT ACTIONS */}
                    <div className="flex flex-wrap gap-2 xl:flex-col xl:items-stretch">
                      <Button
                        variant="outline"
                        className="rounded-full px-4 xl:w-full"
                        onClick={() => setSelectedUser(user)}
                      >
                        <UserRound className="size-4" />
                        View details
                      </Button>

                      <Button
                        variant={user.role === "admin" ? "outline" : "default"}
                        className="rounded-full px-4 xl:w-full"
                        onClick={() => setPendingRoleTarget(user)}
                      >
                        <UserCog className="size-4" />
                        {user.role === "admin" ? "Move to citizen" : "Promote to admin"}
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
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