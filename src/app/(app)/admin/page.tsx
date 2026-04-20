import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ClipboardCheck,
  Clock3,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
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
        : "The admin dashboard could not load live Firebase data.";
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
          description={errorMessage || "The admin dashboard could not load live Firebase data."}
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

  const { stats, queue, filesNeedingReview, recentActivity, suggestedActions } = data;
  const aiFocusCases = queue.slice(0, 3);
  const statIcons = [
    <ClipboardCheck className="size-5" key="total" />,
    <ShieldCheck className="size-5" key="review" />,
    <Clock3 className="size-5" key="progress" />,
    <ClipboardCheck className="size-5" key="resolved" />,
    <ShieldAlert className="size-5" key="urgent" />,
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin dashboard"
        title="Review queue with cleaner context and faster decisions"
        description="Admins get a focused queue with evidence context, AI-ready summaries, missing document signals, and direct actions in one protected workspace."
      />

      <Reveal>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-12">
          {stats.map((stat, index) => (
            <div key={stat.label} className="xl:col-span-4 2xl:col-span-12 2xl:[&:nth-child(1)]:col-span-3 2xl:[&:nth-child(2)]:col-span-3 2xl:[&:nth-child(3)]:col-span-2 2xl:[&:nth-child(4)]:col-span-2 2xl:[&:nth-child(5)]:col-span-2">
              <StatCard {...stat} icon={statIcons[index]} />
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.06}>
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.14fr)_minmax(21rem,0.86fr)] 2xl:grid-cols-[minmax(0,1.18fr)_minmax(24rem,0.82fr)]">
          <div className="space-y-5">
            <PageHeader
              title="Priority queue"
              description="This queue stays evidence-first, summary-rich, and action-ready so the operations team can move fast without losing context."
            />
            <AdminQueueBoard cases={queue} />
          </div>

          <div className="space-y-6">
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
                  AI-ready guidance
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

            <section className="surface-panel p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <Sparkles className="size-5 text-primary" />
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                  AI summary cards
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
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.1}>
        <section className="surface-panel p-5 sm:p-6">
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
        </section>
      </Reveal>
    </div>
  );
}
