import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  CircleAlert,
  Files,
  Sparkles,
  Workflow,
} from "lucide-react";

import { AssistantPanel } from "@/components/common/assistant-panel";
import { EvidenceManager } from "@/components/common/evidence-manager";
import { EmptyState } from "@/components/common/empty-state";
import { LiveDataState } from "@/components/common/live-data-state";
import { CitizenRecentCasesTable } from "@/components/cases/citizen-recent-cases-table";
import { PageHeader } from "@/components/common/page-header";
import { Reveal } from "@/components/common/reveal";
import { Timeline } from "@/components/common/timeline";
import { requireRole } from "@/lib/auth/session";
import { getCitizenDashboardData, listDashboardAssistantMessages } from "@/lib/repositories/cases";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Citizen Dashboard",
};

export default async function DashboardPage() {
  const session = await requireRole("citizen");
  let data: Awaited<ReturnType<typeof getCitizenDashboardData>> | null = null;
  let messages: Awaited<ReturnType<typeof listDashboardAssistantMessages>> | null = null;
  let errorMessage: string | null = null;

  try {
    data = await getCitizenDashboardData(session);
    messages = await listDashboardAssistantMessages(session.uid);
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "The dashboard could not load application data.";
  }

  if (errorMessage || !data) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Citizen dashboard"
          title={`Welcome back, ${session.name.split(" ")[0]}.`}
          description="Check your case progress, respond to requests, and stay confident about what to do next."
        />
        <LiveDataState
          tone="setup"
          title="Live dashboard data is unavailable"
          description={errorMessage || "The dashboard could not load application data."}
          action={
            <Link
              href="/dashboard"
              className={cn(buttonVariants({ size: "default" }), "gap-2 px-5")}
            >
              <AlertTriangle className="size-4" />
              Retry dashboard
            </Link>
          }
        />
      </div>
    );
  }

  const { stats, cases, reminders, activeCase, recentFiles, recentActivity, recommendedActions } = data;
  const activeCaseAcceptedFiles =
    activeCase?.evidence.filter((file) => file.status === "accepted").length || 0;
  const activeCasePendingFiles =
    activeCase?.evidence.filter((file) =>
      ["uploaded", "under_review", "needs_replacement"].includes(file.status)
    ).length || 0;
  const activeCaseNeedsAction = activeCase
    ? activeCase.status === "need_more_docs" ||
      activeCase.intake.missingDocuments.length > 0 ||
      activeCase.evidence.some((file) => ["needs_replacement", "rejected"].includes(file.status))
    : false;
  const topReminder = reminders.find((item) => !item.read) || reminders[0] || null;
  const actionStats = [
    {
      label: stats[0]?.label || "Total cases",
      value: stats[0]?.value || "0",
      note: "Visible in your tracking list",
      icon: <Files className="size-4" />,
    },
    {
      label: stats[1]?.label || "Active cases",
      value: stats[1]?.value || "0",
      note: "Still moving through review",
      icon: <BellRing className="size-4" />,
    },
    {
      label: stats[2]?.label || "Needs action",
      value: stats[2]?.value || "0",
      note: "Cases waiting on you",
      icon: <CircleAlert className="size-4" />,
    },
    {
      label: stats[3]?.label || "Resolved",
      value: stats[3]?.value || "0",
      note: "Completed and closed",
      icon: <CheckCircle2 className="size-4" />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Citizen dashboard"
        title={`Welcome back, ${session.name.split(" ")[0]}.`}
        description="Start with the one case that needs you, then use the table below to track the rest."
        actions={
          <>
            <Link
              href="/cases"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "rounded-full px-5"
              )}
            >
              View case list
            </Link>
            <Link
              href="/cases/new"
              className={cn(buttonVariants({ size: "lg" }), "rounded-full px-5")}
            >
              Create case
            </Link>
          </>
        }
      />

      <Reveal>
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.55fr)]">
          <div className="hero-gradient rounded-[32px] p-6 text-primary-foreground shadow-[0_24px_60px_rgba(0,30,64,0.28)] sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary-foreground/70">
              Your next step
            </p>
            <div className="mt-4 space-y-4">
              <h2 className="max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">
                {activeCase
                  ? activeCaseNeedsAction
                    ? "This case needs your attention now."
                    : "Your latest case is moving forward."
                  : "You are ready to submit your first case."}
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-primary-foreground/80">
                {activeCase
                  ? activeCaseNeedsAction
                    ? `Open ${activeCase.title} and send the missing or replacement item first.`
                    : `Open ${activeCase.title} to check progress, reviewed files, and the latest update.`
                  : "Start a case when you are ready. Your uploads, updates, and next steps will appear here right away."}
              </p>
            </div>

            {activeCase ? (
              <div className="mt-8 grid gap-4 rounded-[24px] bg-white/10 p-5 lg:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-primary-foreground/70">
                    Active case
                  </p>
                  <p className="mt-2 font-semibold">{activeCase.title}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-primary-foreground/70">
                    What to do
                  </p>
                  <p className="mt-2 font-semibold">
                    {activeCaseNeedsAction ? "Send requested item" : "Check latest update"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-primary-foreground/70">
                    File status
                  </p>
                  <p className="mt-2 font-semibold">
                    {activeCasePendingFiles} waiting / {activeCaseAcceptedFiles} accepted
                  </p>
                </div>
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={activeCase ? `/cases/${activeCase.id}` : "/cases/new"}
                className={cn(buttonVariants({ size: "default" }), "rounded-full px-5")}
              >
                {activeCase ? "Open case" : "Create your first case"}
              </Link>
              {topReminder?.actionHref ? (
                <Link
                  href={topReminder.actionHref}
                  className={cn(buttonVariants({ variant: "outline" }), "rounded-full border-white/25 bg-white/10 px-5 text-white hover:bg-white/20 hover:text-white")}
                >
                  Open reminder
                </Link>
              ) : null}
            </div>
          </div>

          <div className="space-y-4">
            <section
              className={cn(
                "surface-panel p-5 sm:p-6",
                activeCaseNeedsAction ? "border border-amber-200 bg-amber-50/80" : ""
              )}
            >
              <div className="flex items-center gap-3">
                {activeCaseNeedsAction ? (
                  <CircleAlert className="size-5 text-amber-800" />
                ) : (
                  <CheckCircle2 className="size-5 text-primary" />
                )}
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                  What happens next
                </p>
              </div>
              <div className="mt-4 space-y-3">
                {activeCase ? (
                  <>
                    <div className="rounded-[22px] bg-white/80 p-4 text-sm leading-6 text-muted-foreground">
                      {activeCaseNeedsAction
                        ? `${activeCase.intake.missingDocuments.length || activeCasePendingFiles} item(s) still need attention on ${activeCase.title}.`
                        : `${activeCase.title} is moving and does not need anything from you right now.`}
                    </div>
                    <div className="rounded-[22px] bg-white/80 p-4 text-sm leading-6 text-muted-foreground">
                      {recommendedActions[0] || "Open your latest case to check the next update."}
                    </div>
                  </>
                ) : (
                  <div className="rounded-[22px] bg-white/80 p-4 text-sm leading-6 text-muted-foreground">
                    No active case yet. Start a case when you are ready and this dashboard will guide the next step.
                  </div>
                )}
              </div>
            </section>

            <section className="surface-panel p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <BellRing className="size-5 text-primary" />
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                  Latest reminder
                </p>
              </div>
              <div className="mt-4">
                {topReminder ? (
                  <div className="rounded-[22px] bg-muted/80 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-semibold text-foreground">{topReminder.title}</p>
                      <span
                        className={cn(
                          "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
                          topReminder.read
                            ? "bg-slate-100 text-slate-700"
                            : "bg-primary text-primary-foreground"
                        )}
                      >
                        {topReminder.read ? "Viewed" : "Needs attention"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{topReminder.body}</p>
                  </div>
                ) : (
                  <EmptyState
                    icon={<BellRing className="size-5" />}
                    title="No reminders right now"
                    description="You are all caught up for now."
                  />
                )}
              </div>
            </section>
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.04}>
        <section className="grid gap-3 xl:grid-cols-4">
          {actionStats.map((stat) => (
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

      <Reveal delay={0.06}>
        <CitizenRecentCasesTable
          cases={cases.slice(0, 10)}
          totalVisibleCount={cases.length}
          description="Use this table to see which case needs you, which one is moving, and which one is done."
          emptyDescription="Submit a case and it will appear here for tracking."
        />
      </Reveal>

      <Reveal delay={0.08}>
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.28fr)_minmax(19rem,0.72fr)]">
          <div className="space-y-6">
            <EvidenceManager
              files={recentFiles}
              title="Pending files"
              description="Check what was received, what is still under review, and what still needs attention."
              dense
            />

            <section className="surface-panel p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <Workflow className="size-5 text-primary" />
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                  Recent updates
                </p>
              </div>
              <div className="mt-5 max-h-[28rem] overflow-y-auto pr-2">
                {recentActivity.length ? (
                  <Timeline events={recentActivity} />
                ) : (
                  <EmptyState
                    icon={<Workflow className="size-5" />}
                    title="No live activity yet"
                    description="Updates will appear here as soon as a case is created or reviewed."
                  />
                )}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="surface-panel p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <Sparkles className="size-5 text-primary" />
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                  Needs your action
                </p>
              </div>
              <div className="mt-4 space-y-3">
                {recommendedActions.slice(0, 3).map((action, index) => (
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
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.1}>
        <AssistantPanel
          initialMessages={messages || []}
          title="Need help?"
          subtitle="Ask what to upload, what your status means, or what to do next."
          suggestedPrompts={[
            "What should I do next?",
            "What documents do I need?",
            "Summarize my uploaded files",
            "Check if I missed anything",
          ]}
        />
      </Reveal>
    </div>
  );
}
