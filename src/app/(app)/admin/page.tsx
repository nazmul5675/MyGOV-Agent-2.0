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

import { AdminQueueBoard } from "@/components/admin/admin-queue-board";
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

  const { stats, queue, filesNeedingReview, recentActivity, suggestedActions, queueBuckets, roleActivity } =
    data;
  const aiFocusCases = queue.slice(0, 3);
  const statIcons = [
    <ClipboardCheck className="size-5" key="total" />,
    <ShieldCheck className="size-5" key="review" />,
    <Clock3 className="size-5" key="waiting" />,
    <Clock3 className="size-5" key="progress" />,
    <ClipboardCheck className="size-5" key="resolved" />,
    <ShieldAlert className="size-5" key="urgent" />,
    <Users2 className="size-5" key="users" />,
    <ShieldCheck className="size-5" key="admins" />,
    <Sparkles className="size-5" key="new-citizens" />,
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin dashboard"
        title="Run the queue like a real operations control center"
        description="Scan workload, review evidence, use AI-backed summaries, and keep citizen cases moving from triage to resolution without losing context."
      />

      <Reveal>
        <section className="surface-panel p-5 sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                Operations pulse
              </p>
              <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight text-primary sm:text-3xl">
                Review cases, evidence, and role-controlled access from one admin desk.
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                This console is tuned for queue movement: quick review counts, evidence pressure, AI-guided summaries, and cleaner access oversight.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin#queue"
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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          {stats.map((stat, index) => (
            <StatCard key={stat.label} {...stat} icon={statIcons[index]} />
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.06}>
        <section
          id="queue"
          className="grid gap-6 xl:grid-cols-[minmax(0,1.16fr)_minmax(22rem,0.84fr)]"
        >
          <div className="space-y-5">
            <div className="space-y-1">
              <h2 className="font-heading text-2xl font-bold tracking-tight text-primary">
                Workload buckets
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Start with the buckets that matter most: fresh intake, citizen follow-up, urgent packets, and cases that have quietly stalled.
              </p>
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              {[
                {
                  title: "Recent incoming",
                  description: "Fresh packets just entering triage.",
                  items: queueBuckets?.recentIncoming || [],
                },
                {
                  title: "Waiting on citizen",
                  description: "Cases blocked by missing documents or clarification.",
                  items: queueBuckets?.needsCitizenResponse || [],
                },
                {
                  title: "Urgent cases",
                  description: "High-priority records that should be reviewed early.",
                  items: queueBuckets?.urgentCases || [],
                },
                {
                  title: "Stalled cases",
                  description: "Packets that have not moved recently and may need intervention.",
                  items: queueBuckets?.stalledCases || [],
                },
              ].map((bucket) => (
                <section key={bucket.title} className="surface-panel p-5">
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
                            <p className="font-semibold text-foreground">{item.title}</p>
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
                </section>
              ))}
            </div>

            <div className="space-y-1">
              <h2 className="font-heading text-2xl font-bold tracking-tight text-primary">
                Case queue
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Use the full review queue when you need stronger search, denser case context, and direct entry into the review workspace.
              </p>
            </div>
            <AdminQueueBoard cases={queue} />
          </div>

          <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <section className="surface-panel p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <Sparkles className="size-5 text-primary" />
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                  AI operations brief
                </p>
              </div>
              <div className="mt-4 space-y-3">
                {suggestedActions.map((action) => (
                  <div key={action} className="rounded-[22px] bg-muted/80 p-4 text-sm leading-6 text-muted-foreground">
                    {action}
                  </div>
                ))}
              </div>
            </section>

            <EvidenceManager
              files={filesNeedingReview}
              title="Files needing review"
              description="This file manager turns uploads into a visible operational surface instead of buried attachments."
              dense
            />

            <section className="surface-panel p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <Sparkles className="size-5 text-primary" />
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                  AI review snapshots
                </p>
              </div>
              <div className="mt-4 space-y-3">
                {aiFocusCases.map((item) => (
                  <div key={item.id} className="rounded-[22px] bg-muted/80 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">{item.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {item.citizenName} / {item.assignedUnit}
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                        {item.intake.urgency}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {item.intake.adminSummary}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-foreground">
                      Suggested next move:{" "}
                      <span className="text-muted-foreground">
                        {item.intake.missingDocuments.length
                          ? `request ${item.intake.missingDocuments[0]} before routing.`
                          : `prepare the officer summary and assign it to ${item.assignedUnit}.`}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="surface-panel p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <Users2 className="size-5 text-primary" />
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                  Role and access activity
                </p>
              </div>
              <div className="mt-4 space-y-3">
                {roleActivity?.length ? (
                  roleActivity.map((item) => (
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
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.1}>
        <section id="activity" className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(21rem,0.92fr)]">
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

          <section className="surface-panel p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <FileSearch className="size-5 text-primary" />
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                Evidence workload snapshot
              </p>
            </div>
            <div className="mt-4 space-y-3">
              {filesNeedingReview.slice(0, 5).map((file) => (
                <div key={file.id} className="rounded-[22px] bg-muted/80 p-4">
                  <p className="font-semibold text-foreground">{file.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {file.category || file.kind} / {file.status.replaceAll("_", " ")}
                  </p>
                  <p className="mt-3 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Uploaded {new Date(file.uploadedAt).toLocaleDateString("en-GB")}
                  </p>
                </div>
              ))}
              {!filesNeedingReview.length ? (
                <EmptyState
                  icon={<FileSearch className="size-5" />}
                  title="No pending evidence workload"
                  description="When citizens upload new files or replacements, this review snapshot will populate automatically."
                />
              ) : null}
            </div>
          </section>
        </section>
      </Reveal>
    </div>
  );
}
