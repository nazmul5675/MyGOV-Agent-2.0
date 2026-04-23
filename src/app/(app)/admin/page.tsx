import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Clock3,
  FileSearch,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users2,
  Workflow,
} from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { FileStatusBadge } from "@/components/common/file-status-badge";
import { LiveDataState } from "@/components/common/live-data-state";
import { PageHeader } from "@/components/common/page-header";
import { Reveal } from "@/components/common/reveal";
import { Timeline } from "@/components/common/timeline";
import { requireRole } from "@/lib/auth/session";
import { getAdminDashboardData } from "@/lib/repositories/cases";
import type { CaseItem } from "@/lib/types";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin Dashboard",
};

type QueueLane = {
  title: string;
  hint: string;
  countTone: string;
  surfaceTone: string;
  rowTone: string;
  actionLabel: string;
  items: CaseItem[];
};

function formatCompactDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function getRecommendedCase(
  urgentCases: CaseItem[],
  needsCitizenResponse: CaseItem[],
  recentIncoming: CaseItem[],
  stalledCases: CaseItem[],
  queue: CaseItem[]
) {
  return (
    urgentCases[0] ||
    needsCitizenResponse[0] ||
    recentIncoming[0] ||
    stalledCases[0] ||
    queue[0] ||
    null
  );
}

export default async function AdminDashboardPage() {
  await requireRole("admin");
  let data:
    | Awaited<ReturnType<typeof getAdminDashboardData>>
    | null = null;
  let errorMessage: string | null = null;

  try {
    data = await getAdminDashboardData();
  } catch (error) {
    errorMessage =
      error instanceof Error
        ? error.message
        : "The admin dashboard could not load application data.";
  }

  if (errorMessage || !data) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Admin dashboard"
          title="Queue overview unavailable"
          description="Retry the live dashboard to reopen the admin work queue."
        />
        <LiveDataState
          tone="setup"
          title="Live admin queue is unavailable"
          description={errorMessage || "The admin dashboard could not load application data."}
          action={
            <Link
              href="/admin"
              className={cn(buttonVariants({ size: "default" }), "gap-2 px-5")}
            >
              <AlertTriangle className="size-4" />
              Retry admin dashboard
            </Link>
          }
        />
      </div>
    );
  }

  const {
    stats,
    queue,
    filesNeedingReview,
    recentActivity,
    suggestedActions,
    queueBuckets,
    roleActivity,
  } = data;

  const urgentCases = queueBuckets?.urgentCases || [];
  const needsCitizenResponse = queueBuckets?.needsCitizenResponse || [];
  const recentIncoming = queueBuckets?.recentIncoming || [];
  const stalledCases = queueBuckets?.stalledCases || [];

  const evidencePending = filesNeedingReview.filter((file) =>
    ["uploaded", "under_review"].includes(file.status)
  ).length;
  const evidenceNeedsAction = filesNeedingReview.filter((file) =>
    ["needs_replacement", "rejected"].includes(file.status)
  ).length;

  const pressureStats = [
    {
      label: stats[1]?.label || "Needs review",
      value: stats[1]?.value || "0",
      note: "Waiting for first review",
      icon: <ShieldCheck className="size-4" />,
    },
    {
      label: stats[5]?.label || "Urgent items",
      value: stats[5]?.value || "0",
      note: "Handle before anything else",
      icon: <ShieldAlert className="size-4" />,
    },
    {
      label: stats[2]?.label || "Waiting on citizen",
      value: stats[2]?.value || "0",
      note: "Blocked by missing response",
      icon: <Clock3 className="size-4" />,
    },
    {
      label: "Files waiting",
      value: String(evidencePending + evidenceNeedsAction),
      note: "Evidence to review or resolve",
      icon: <FileSearch className="size-4" />,
    },
  ];

  const lanes: QueueLane[] = [
    {
      title: "Urgent first",
      hint: "Start here when cases need a fast decision.",
      countTone: "bg-rose-100 text-rose-800",
      surfaceTone: "bg-rose-50/75 ring-1 ring-rose-200/70",
      rowTone: "bg-white/90",
      actionLabel: "Open urgent queue",
      items: urgentCases,
    },
    {
      title: "Waiting on citizen",
      hint: "Unblock these with one clear next request.",
      countTone: "bg-amber-100 text-amber-800",
      surfaceTone: "bg-amber-50/70",
      rowTone: "bg-white/88",
      actionLabel: "Review blocked cases",
      items: needsCitizenResponse,
    },
    {
      title: "Fresh intake",
      hint: "New submissions ready for first review.",
      countTone: "bg-slate-200 text-slate-700",
      surfaceTone: "bg-slate-50/80",
      rowTone: "bg-white/88",
      actionLabel: "Check new intake",
      items: recentIncoming,
    },
    {
      title: "Stalled cases",
      hint: "Reopen work that has stopped moving.",
      countTone: "bg-sky-100 text-sky-800",
      surfaceTone: "bg-sky-50/75",
      rowTone: "bg-white/88",
      actionLabel: "Reopen stalled work",
      items: stalledCases,
    },
  ];

  const recommendedCase = getRecommendedCase(
    urgentCases,
    needsCitizenResponse,
    recentIncoming,
    stalledCases,
    queue
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin dashboard"
        title="Open the next case that needs a decision"
        description="Use the lanes below to triage urgent, blocked, and newly submitted work quickly."
        actions={
          <>
            <Link
              href="/admin/case-queue"
              className={cn(buttonVariants({ variant: "default" }), "rounded-full px-5")}
            >
              Open full case queue
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/admin/users"
              className={cn(buttonVariants({ variant: "outline" }), "rounded-full px-5")}
            >
              Manage users
            </Link>
          </>
        }
      />

      <Reveal>
        <section className="grid gap-3 xl:grid-cols-4">
          {pressureStats.map((stat) => (
            <div
              key={stat.label}
              className="surface-panel flex items-center justify-between gap-4 px-4 py-3.5"
            >
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {stat.label}
                </p>
                <p className="mt-1.5 text-2xl font-black leading-none tracking-tight text-primary">
                  {stat.value}
                </p>
                <p className="mt-1.5 text-sm leading-5 text-muted-foreground">{stat.note}</p>
              </div>
              <div className="flex size-10 shrink-0 items-center justify-center rounded-[16px] bg-accent text-accent-foreground">
                {stat.icon}
              </div>
            </div>
          ))}
        </section>
      </Reveal>

      <Reveal delay={0.04}>
        <section
          id="queue"
          className="grid gap-6 xl:grid-cols-[minmax(0,1.72fr)_minmax(17rem,0.48fr)]"
        >
          <section className="surface-panel p-4 sm:p-5">
            <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                  Triage lanes
                </p>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">
                  Pick a lane, open the next case, move on.
                </p>
              </div>
              <Link
                href="/admin/case-queue"
                className="hidden text-sm font-semibold text-primary underline-offset-4 hover:underline xl:inline-flex xl:items-center xl:gap-2"
              >
                Open full queue
                <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              {lanes.map((lane) => (
                <section
                  key={lane.title}
                  className={cn("rounded-[24px] p-4", lane.surfaceTone)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{lane.title}</p>
                      <p className="mt-1 text-sm leading-5 text-muted-foreground">
                        {lane.hint}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
                        lane.countTone
                      )}
                    >
                      {lane.items.length}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2.5">
                    {lane.items.length ? (
                      lane.items.slice(0, 3).map((item) => (
                        <Link
                          key={item.id}
                          href={`/admin/cases/${item.id}`}
                          className={cn(
                            "block rounded-[16px] border border-white/80 px-3 py-2.5 transition-colors hover:bg-accent",
                            lane.rowTone
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="line-clamp-1 font-semibold text-foreground">
                                {item.title}
                              </p>
                              <p className="mt-1 text-sm leading-5 text-muted-foreground">
                                {item.reference} / {item.citizenName}
                              </p>
                            </div>
                            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                              {item.status.replaceAll("_", " ")}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                            <span className="line-clamp-1 flex-1">{item.location}</span>
                            <span>{item.evidence.length} files</span>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="rounded-[16px] bg-white/75 px-4 py-3 text-sm leading-6 text-muted-foreground">
                        Nothing needs attention in this lane right now.
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <Link
                      href={lane.items[0] ? `/admin/cases/${lane.items[0].id}` : "/admin/case-queue"}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline"
                    >
                      {lane.items[0] ? "Open next case" : lane.actionLabel}
                      <ArrowRight className="size-4" />
                    </Link>
                  </div>
                </section>
              ))}
            </div>
          </section>

          <aside className="space-y-4">
            <section className="surface-panel p-4">
              <div className="flex items-center gap-3">
                <Sparkles className="size-5 text-primary" />
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                  AI operations brief
                </p>
              </div>

              {recommendedCase ? (
                <Link
                  href={`/admin/cases/${recommendedCase.id}`}
                  className="mt-4 block rounded-[20px] bg-primary px-4 py-4 text-primary-foreground transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-foreground/70">
                    Open first
                  </p>
                  <p className="mt-2 font-semibold">{recommendedCase.title}</p>
                  <p className="mt-1 text-sm text-primary-foreground/75">
                    {recommendedCase.reference} / {recommendedCase.citizenName}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs uppercase tracking-[0.16em] text-primary-foreground/70">
                    <span>{recommendedCase.status.replaceAll("_", " ")}</span>
                    <span>{recommendedCase.intake.urgency}</span>
                  </div>
                </Link>
              ) : (
                <div className="mt-4 rounded-[18px] bg-muted/75 p-4 text-sm leading-6 text-muted-foreground">
                  No case needs immediate action right now.
                </div>
              )}

              <div className="mt-4 space-y-2">
                {suggestedActions.slice(0, 2).map((action, index) => (
                  <div key={action} className="rounded-[18px] bg-muted/75 p-3">
                    <div className="flex items-start gap-3">
                      <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        {index + 1}
                      </span>
                      <p className="text-sm leading-6 text-muted-foreground">{action}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/admin/case-queue"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full px-3")}
                >
                  Open queue
                </Link>
                <Link
                  href="/admin/users"
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "rounded-full px-3")}
                >
                  Manage access
                </Link>
              </div>
            </section>

            <section className="surface-panel p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                  Files needing review
                </p>
                <span className="rounded-full bg-sky-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-800">
                  {filesNeedingReview.length}
                </span>
              </div>

              {filesNeedingReview.length ? (
                <div className="mt-4 space-y-2.5">
                  {filesNeedingReview.slice(0, 3).map((file) => {
                    const rowContent = (
                      <div className="rounded-[16px] border border-border/60 bg-white/78 p-3 transition-colors hover:bg-accent">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="line-clamp-1 text-sm font-semibold text-foreground">
                              {file.name}
                            </p>
                            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                              <span>{file.category || "Uncategorized"}</span>
                              <span>{formatCompactDate(file.uploadedAt)}</span>
                              <span>{file.sizeLabel}</span>
                            </div>
                          </div>
                          <div className="shrink-0">
                            <FileStatusBadge status={file.status} />
                          </div>
                        </div>
                      </div>
                    );

                    return file.caseId ? (
                      <Link key={file.id} href={`/admin/cases/${file.caseId}`} className="block">
                        {rowContent}
                      </Link>
                    ) : (
                      <div key={file.id}>{rowContent}</div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-4">
                  <EmptyState
                    icon={<FileSearch className="size-5" />}
                    title="No files waiting"
                    description="New uploads that need review will appear here."
                    className="px-5 py-7"
                  />
                </div>
              )}

              <div className="mt-4">
                <Link
                  href="/admin/case-queue"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline"
                >
                  Open cases with evidence
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </section>
          </aside>
        </section>
      </Reveal>

      <Reveal delay={0.08}>
        <section
          id="activity"
          className="grid gap-6 xl:grid-cols-[minmax(0,1.22fr)_minmax(18rem,0.78fr)]"
        >
          <div className="surface-panel p-4">
            <div className="flex items-center gap-3">
              <Workflow className="size-5 text-primary" />
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                Recent updates
              </p>
            </div>
            <div className="mt-5 max-h-[26rem] overflow-y-auto pr-2">
              {recentActivity.length ? (
                <Timeline events={recentActivity} />
              ) : (
                <EmptyState
                  icon={<Workflow className="size-5" />}
                  title="No recent operations activity yet"
                  description="Recent workflow activity will appear here once new cases are reviewed."
                />
              )}
            </div>
          </div>

          <div className="space-y-4">
            <section className="surface-panel p-4">
              <div className="flex items-center gap-3">
                <Users2 className="size-5 text-primary" />
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                  Access updates
                </p>
              </div>
              <div className="mt-4 space-y-2.5">
                {roleActivity?.length ? (
                  roleActivity.slice(0, 4).map((item) => (
                    <div key={item.id} className="rounded-[18px] bg-muted/70 p-3">
                      <p className="font-semibold text-foreground">{item.title}</p>
                      <p className="mt-1.5 text-sm leading-5 text-muted-foreground">
                        {item.description}
                      </p>
                      <p className="mt-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        {item.actor} / {new Date(item.createdAt).toLocaleDateString("en-GB")}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[18px] bg-muted/70 p-4 text-sm leading-6 text-muted-foreground">
                    Role changes from the admin users screen will appear here.
                  </div>
                )}
              </div>
            </section>

            <section className="surface-panel p-4">
              <div className="flex items-center gap-3">
                <FileSearch className="size-5 text-primary" />
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                  Evidence pressure
                </p>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[18px] bg-muted/75 p-3.5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Pending review
                  </p>
                  <p className="mt-3 text-2xl font-black leading-none tracking-tight text-primary">
                    {evidencePending}
                  </p>
                  <p className="mt-2 text-sm leading-5 text-muted-foreground">
                    Files still waiting for review.
                  </p>
                </div>
                <div className="rounded-[18px] bg-muted/75 p-3.5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Need action
                  </p>
                  <p className="mt-3 text-2xl font-black leading-none tracking-tight text-primary">
                    {evidenceNeedsAction}
                  </p>
                  <p className="mt-2 text-sm leading-5 text-muted-foreground">
                    Files blocked by replacement or rejection.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
