import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  BellRing,
  Files,
  ShieldEllipsis,
  Sparkles,
  Workflow,
} from "lucide-react";

import { AssistantPanel } from "@/components/common/assistant-panel";
import { CaseCard } from "@/components/common/case-card";
import { EvidenceManager } from "@/components/common/evidence-manager";
import { EmptyState } from "@/components/common/empty-state";
import { LiveDataState } from "@/components/common/live-data-state";
import { PageHeader } from "@/components/common/page-header";
import { Reveal } from "@/components/common/reveal";
import { StatCard } from "@/components/common/stat-card";
import { Timeline } from "@/components/common/timeline";
import { requireRole } from "@/lib/auth/session";
import {
  getCitizenDashboardData,
  listDashboardAssistantMessages,
} from "@/lib/repositories/cases";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Citizen Dashboard",
};

export default async function DashboardPage() {
  const session = await requireRole("citizen");
  let data:
    | Awaited<ReturnType<typeof getCitizenDashboardData>>
    | null = null;
  let messages:
    | Awaited<ReturnType<typeof listDashboardAssistantMessages>>
    | null = null;
  let errorMessage: string | null = null;

  try {
    data = await getCitizenDashboardData(session);
    messages = await listDashboardAssistantMessages(session.uid);
  } catch (error) {
    errorMessage =
      error instanceof Error
        ? error.message
        : "The dashboard could not load live Firebase data.";
  }

  if (errorMessage || !data) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Citizen dashboard"
          title={`Selamat datang, ${session.name.split(" ")[0]}.`}
          description="Track every case in one place, complete document requests quickly, and stay ahead of renewal reminders with a calmer citizen experience."
        />
        <LiveDataState
          tone="setup"
          title="Live dashboard data is unavailable"
          description={errorMessage || "The dashboard could not load live Firebase data."}
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

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Citizen dashboard"
        title={`Selamat datang, ${session.name.split(" ")[0]}.`}
        description="Track every case in one place, complete document requests quickly, and stay ahead of renewal reminders with a calmer citizen experience."
        actions={
          <Link
            href="/cases/new"
            className={cn(buttonVariants({ size: "lg" }), "rounded-full px-5")}
          >
            Create a new case
          </Link>
        }
      />

      <Reveal>
        <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="hero-gradient rounded-[32px] p-8 text-primary-foreground shadow-[0_24px_60px_rgba(0,30,64,0.28)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary-foreground/70">
              Guardian mode
            </p>
            <h2 className="mt-4 text-4xl font-black tracking-tight">
              One live place for cases, files, and guided next steps.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-primary-foreground/80">
              This command center keeps your active case, document trail, assistant guidance, and reminders aligned so you always know what to do next.
            </p>
            {activeCase ? (
              <div className="mt-6 grid gap-4 rounded-[24px] bg-white/10 p-5 md:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-primary-foreground/70">
                    Active case
                  </p>
                  <p className="mt-2 font-semibold">{activeCase.title}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-primary-foreground/70">
                    Status
                  </p>
                  <p className="mt-2 font-semibold">{activeCase.status.replaceAll("_", " ")}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-primary-foreground/70">
                    Uploaded files
                  </p>
                  <p className="mt-2 font-semibold">{activeCase.evidence.length}</p>
                </div>
              </div>
            ) : null}
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <StatCard {...stats[0]} icon={<Files className="size-5" />} />
            <StatCard {...stats[1]} icon={<BellRing className="size-5" />} />
            <StatCard {...stats[2]} icon={<ShieldEllipsis className="size-5" />} />
            <StatCard {...stats[3]} icon={<ShieldEllipsis className="size-5" />} />
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.06}>
        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5">
            <PageHeader
              title="Case command center"
              description="Recent cases stay actionable here, with the latest status, timeline signals, and evidence context."
            />
            {cases.length ? (
              <div className="grid gap-5 lg:grid-cols-2">
                {cases.slice(0, 2).map((item) => (
                  <CaseCard key={item.id} item={item} href={`/cases/${item.id}`} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Files className="size-5" />}
                title="No live cases yet"
                description="This account does not have any Firestore case records yet. Create your first live case to begin tracking updates."
                action={
                  <Link
                    href="/cases/new"
                    className={cn(buttonVariants({ size: "default" }), "px-5")}
                  >
                    Create case
                  </Link>
                }
              />
            )}
          </div>
          <div className="space-y-6">
            <div className="surface-panel p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                Reminders and notifications
              </p>
              <div className="mt-5 space-y-4">
                {reminders.length ? (
                  reminders.map((item) => (
                    <div key={item.id} className="rounded-[24px] bg-muted/80 p-5">
                      <div className="flex items-center justify-between gap-4">
                        <p className="font-semibold text-foreground">{item.title}</p>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                          {item.read ? "Viewed" : "Action"}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-muted-foreground">
                        {item.body}
                      </p>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    icon={<BellRing className="size-5" />}
                    title="No live reminders right now"
                    description="Notifications and status follow-ups will appear here as real Firestore updates are written for this account."
                  />
                )}
              </div>
            </div>

            <div className="surface-panel p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                Next best actions
              </p>
              <div className="mt-4 space-y-3">
                {recommendedActions.map((action) => (
                  <div
                    key={action}
                    className="flex items-start gap-3 rounded-[22px] bg-muted/80 p-4"
                  >
                    <Sparkles className="mt-0.5 size-4 text-primary" />
                    <p className="text-sm leading-7 text-muted-foreground">{action}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.1}>
        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <AssistantPanel
            initialMessages={messages || []}
            title="AI helping chat box"
            subtitle="Use the assistant to check required documents, clean up your explanation, understand a status, or verify whether your uploads are complete."
          />
          <div className="space-y-6">
            <EvidenceManager
              files={recentFiles}
              title="Uploaded files overview"
              description="Your most recent evidence stays visible here with live review states, so uploads feel like a managed workflow instead of hidden attachments."
              dense
            />
            <section className="surface-panel p-6">
              <div className="flex items-center gap-3">
                <Workflow className="size-5 text-primary" />
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                  Recent activity
                </p>
              </div>
              <div className="mt-5">
                {recentActivity.length ? (
                  <Timeline events={recentActivity} />
                ) : (
                  <EmptyState
                    icon={<Workflow className="size-5" />}
                    title="No live activity yet"
                    description="Timeline events will appear here as soon as a case is created or updated."
                  />
                )}
              </div>
            </section>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
