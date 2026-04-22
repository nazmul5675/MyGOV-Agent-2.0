import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  ClipboardCheck,
  Clock3,
  FileSearch,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users2,
  Workflow,
} from "lucide-react";

import { EvidenceManager } from "@/components/common/evidence-manager";
import { EmptyState } from "@/components/common/empty-state";
import { LiveDataState } from "@/components/common/live-data-state";
import { PageHeader } from "@/components/common/page-header";
import { Reveal } from "@/components/common/reveal";
import { StatCard } from "@/components/common/stat-card";
import { Timeline } from "@/components/common/timeline";
import { requireRole } from "@/lib/auth/session";
import { getAdminDashboardData } from "@/lib/repositories/cases";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin Dashboard",
};

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
          title="Review queue with cleaner context and faster decisions"
          description="Admins get a focused queue with evidence context, AI-ready summaries, missing document signals, and direct actions in one protected workspace."
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
  const primaryStats = stats.slice(0, 6);
  const priorityQueue = queue.slice(0, 5);
  const evidencePending = filesNeedingReview.filter((file) =>
    ["uploaded", "under_review"].includes(file.status)
  ).length;
  const evidenceNeedsAction = filesNeedingReview.filter((file) =>
    ["needs_replacement", "rejected"].includes(file.status)
  ).length;

  const statIcons = [
    <ClipboardCheck className="size-5" key="total" />,
    <ShieldCheck className="size-5" key="review" />,
    <Clock3 className="size-5" key="waiting" />,
    <Clock3 className="size-5" key="progress" />,
    <ClipboardCheck className="size-5" key="resolved" />,
    <ShieldAlert className="size-5" key="urgent" />,
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin dashboard"
        title="Run the queue like a real operations control center"
        description="See what needs review now, what is blocked, and what should move next."
      />

      <Reveal>
        <section className="surface-panel p-5 sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                Operations pulse
              </p>
              <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight text-primary sm:text-3xl">
                Keep the workload moving from triage to review to resolution.
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Start with the queue, then use the right column only for the next supporting action.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/case-queue"
                className={cn(buttonVariants({ variant: "default" }), "rounded-full px-5")}
              >
                Open case queue
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/admin/users"
                className={cn(buttonVariants({ variant: "outline" }), "rounded-full px-5")}
              >
                Manage users
              </Link>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.03}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {primaryStats.map((stat, index) => (
            <StatCard key={stat.label} {...stat} icon={statIcons[index]} />
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.06}>
        <div className="space-y-6">
          <section
            id="queue"
            className="grid gap-6 xl:grid-cols-[minmax(0,1.32fr)_minmax(21rem,0.68fr)]"
          >
            <div className="space-y-5">
              <section className="surface-panel p-5 sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div className="max-w-3xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                      Primary workload
                    </p>
                    <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight text-primary">
                      Workload buckets
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      Start here. Open what is urgent, blocked on the citizen, or overdue for movement.
                    </p>
                  </div>
                  <Link
                    href="/admin/case-queue"
                    className={cn(buttonVariants({ variant: "outline" }), "rounded-full px-5")}
                  >
                    Open full queue
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </section>

              <div className="grid gap-4 2xl:grid-cols-2">
                {[
                  {
                    title: "Recent incoming",
                    description: "Fresh packets entering triage.",
                    tone: "bg-slate-50/80",
                    items: queueBuckets?.recentIncoming || [],
                  },
                  {
                    title: "Waiting on citizen",
                    description: "Blocked by missing documents or clarification.",
                    tone: "bg-amber-50/80",
                    items: queueBuckets?.needsCitizenResponse || [],
                  },
                  {
                    title: "Urgent cases",
                    description: "High-priority records to open early.",
                    tone: "bg-rose-50/80",
                    items: queueBuckets?.urgentCases || [],
                  },
                  {
                    title: "Stalled cases",
                    description: "Packets that may need intervention.",
                    tone: "bg-sky-50/80",
                    items: queueBuckets?.stalledCases || [],
                  },
                ].map((bucket) => (
                  <section key={bucket.title} className={`surface-panel p-5 ${bucket.tone}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{bucket.title}</p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {bucket.description}
                        </p>
                      </div>
                      <div className="rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        {bucket.items.length}
                      </div>
                    </div>
                    <div className="mt-4 space-y-3">
                      {bucket.items.length ? (
                        bucket.items.slice(0, 3).map((item) => (
                          <Link
                            key={item.id}
                            href={`/admin/cases/${item.id}`}
                            className="block rounded-[20px] bg-muted/75 p-4 transition-colors hover:bg-accent"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="line-clamp-2 font-semibold text-foreground">{item.title}</p>
                              <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                                {item.status.replaceAll("_", " ")}
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">
                              {item.reference} / {item.location}
                            </p>
                          </Link>
                        ))
                      ) : (
                        <div className="rounded-[20px] bg-muted/70 p-4 text-sm leading-6 text-muted-foreground">
                          No items in this workload bucket right now.
                        </div>
                      )}
                    </div>
                    <div className="mt-4">
                      <Link
                        href={bucket.items[0] ? `/admin/cases/${bucket.items[0].id}` : "/admin/case-queue"}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline"
                      >
                        {bucket.items[0] ? "Open next case" : "Open full queue"}
                        <ArrowRight className="size-4" />
                      </Link>
                    </div>
                  </section>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <section className="surface-panel p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <Sparkles className="size-5 text-primary" />
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                    Open next
                  </p>
                </div>
                <div className="mt-4 space-y-2">
                  {suggestedActions.map((action, index) => (
                    <div key={action} className="rounded-[22px] bg-muted/80 p-4">
                      <div className="flex items-start gap-3">
                        <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                          {index + 1}
                        </span>
                        <p className="text-sm leading-6 text-muted-foreground">{action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <EvidenceManager
                files={filesNeedingReview}
                title="Files needing review"
                description="Keep this list close to the queue so pending uploads and replacement requests are easy to act on."
                dense
              />
            </div>
          </section>

          <section className="surface-panel p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                  Queue priorities
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Latest live cases worth opening next.
                </p>
              </div>
              <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {priorityQueue.length} items
              </span>
            </div>
            <div className="mt-4 grid gap-3 xl:grid-cols-2">
              {priorityQueue.map((item) => (
                <Link
                  key={item.id}
                  href={`/admin/cases/${item.id}`}
                  className="block rounded-[22px] bg-muted/75 p-4 transition-colors hover:bg-accent"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{item.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.reference} / {item.citizenName}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                      {item.intake.urgency}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    <span>{item.status.replaceAll("_", " ")}</span>
                    <span>{item.evidence.length} files</span>
                    <span>Updated {new Date(item.updatedAt).toLocaleDateString("en-GB")}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <section
          id="activity"
          className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(21rem,0.92fr)]"
        >
          <div className="surface-panel p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <Workflow className="size-5 text-primary" />
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                  Recent operations activity
                </p>
            </div>
            <div className="mt-5">
              {recentActivity.length ? (
                <Timeline events={recentActivity} />
              ) : (
                <EmptyState
                  icon={<Workflow className="size-5" />}
                  title="No recent operations activity yet"
                  description="Once cases are submitted and reviewed, the latest workflow events will appear here."
                />
              )}
            </div>
          </div>

          <div className="space-y-6">
            <section className="surface-panel p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <Users2 className="size-5 text-primary" />
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                  Role and access activity
                </p>
              </div>
              <div className="mt-4 space-y-3">
                {roleActivity?.length ? (
                  roleActivity.slice(0, 4).map((item) => (
                    <div key={item.id} className="rounded-[22px] bg-muted/80 p-4">
                      <p className="font-semibold text-foreground">{item.title}</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {item.description}
                      </p>
                      <p className="mt-3 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        {item.actor} / {new Date(item.createdAt).toLocaleDateString("en-GB")}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[22px] bg-muted/75 p-4 text-sm leading-6 text-muted-foreground">
                    Role changes from the admin users screen will appear here.
                  </div>
                )}
              </div>
            </section>

            <section className="surface-panel p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <FileSearch className="size-5 text-primary" />
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                  Evidence workload snapshot
                </p>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[22px] bg-muted/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Pending review
                  </p>
                  <p className="mt-3 text-2xl font-black leading-none tracking-tight text-primary">
                    {evidencePending}
                  </p>
                  <p className="mt-2 text-sm leading-5 text-muted-foreground">
                    Files still waiting for a review decision.
                  </p>
                </div>
                <div className="rounded-[22px] bg-muted/80 p-4">
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
              <div className="mt-4 rounded-[22px] bg-primary/[0.04] p-4 text-sm leading-6 text-muted-foreground">
                {filesNeedingReview.length
                  ? `Latest evidence workload: ${filesNeedingReview
                      .slice(0, 3)
                      .map((file) => file.name)
                      .join(", ")}.`
                  : "No pending evidence workload right now."}
              </div>
            </section>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
