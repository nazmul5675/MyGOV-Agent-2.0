import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileSearch,
  FileText,
  Layers3,
  MapPin,
  UserRound,
} from "lucide-react";

import { EvidenceReviewPanel } from "@/components/admin/evidence-review-panel";
import { AssistantPanel } from "@/components/common/assistant-panel";
import { EvidenceManager } from "@/components/common/evidence-manager";
import { EmptyState } from "@/components/common/empty-state";
import { LiveDataState } from "@/components/common/live-data-state";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { Timeline } from "@/components/common/timeline";
import { AdminReviewPanel } from "@/components/forms/admin-review-panel";
import { LocationPreviewCard } from "@/components/maps/location-preview-card";
import { buttonVariants } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/session";
import { getAdminCaseById, listCaseAssistantMessages } from "@/lib/repositories/cases";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin Case Review",
};

export default async function AdminCaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("admin");
  const { id } = await params;
  let item: Awaited<ReturnType<typeof getAdminCaseById>> | null = null;
  let messages: Awaited<ReturnType<typeof listCaseAssistantMessages>> | null = null;
  let errorMessage: string | null = null;

  try {
    item = await getAdminCaseById(id);
    if (item) {
      messages = await listCaseAssistantMessages(id);
    }
  } catch (error) {
    errorMessage =
      error instanceof Error
        ? error.message
        : "The admin case detail page could not load application data.";
  }

  if (errorMessage) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Admin review"
          title="Live case review unavailable"
          description="This page could not load the case story, evidence, and event history."
        />
        <LiveDataState
          tone="setup"
          title="This admin case could not be loaded"
          description={errorMessage}
          action={
            <Link
              href={`/admin/cases/${id}`}
              className={cn(buttonVariants({ size: "default" }), "gap-2 px-5")}
            >
              <AlertTriangle className="size-4" />
              Retry case review
            </Link>
          }
        />
      </div>
    );
  }

  if (!item) notFound();

  const acceptedFiles = item.evidence.filter((file) => file.status === "accepted").length;
  const pendingFiles = item.evidence.filter((file) =>
    ["uploaded", "under_review", "needs_replacement"].includes(file.status)
  ).length;
  const missingDocumentsCount = item.intake.missingDocuments.length;
  const nextAction =
    item.status === "need_more_docs"
      ? "Request the missing proof clearly, then wait for the replacement packet."
      : item.status === "submitted"
        ? "Move the case into review and start resolving the file packet."
        : item.status === "reviewing"
          ? "Finish evidence decisions, then route or resolve with one clear note."
          : item.status === "in_progress"
            ? "Leave the routing or resolution note that explains the next operational move."
            : "Check the latest timeline event before making another state change.";
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={item.reference}
        title="Admin review workspace"
        description="Read the case story quickly, review the file packet, and take the next decision from one clear workspace."
        actions={
          <>
            <Link
              href="/admin/case-queue"
              className={cn(buttonVariants({ variant: "outline" }), "rounded-full px-5")}
            >
              Back to queue
            </Link>
            <Link
              href="#decision-center"
              className={cn(buttonVariants({ variant: "default" }), "rounded-full px-5")}
            >
              Go to decision center
              <ArrowRight className="size-4" />
            </Link>
          </>
        }
      />

      <section className="surface-panel p-6 sm:p-7">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(20rem,0.7fr)]">
          <div className="hero-gradient rounded-[32px] p-6 text-primary-foreground sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.22em] text-primary-foreground/70">
                  Case packet
                </p>
                <h2 className="mt-2 text-balance font-heading text-3xl font-bold tracking-tight">
                  {item.title}
                </h2>
              </div>
              <StatusBadge status={item.status} className="bg-white/12 text-white" />
            </div>
            <p className="mt-4 text-sm leading-7 text-primary-foreground/82">
              {item.intake.adminSummary}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href="#review-brief"
                className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-white/18"
              >
                Review brief
              </Link>
              <Link
                href="#evidence-review"
                className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-white/18"
              >
                Evidence review
              </Link>
              <Link
                href="#decision-center"
                className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-white/18"
              >
                Decision center
              </Link>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-[24px] bg-primary/[0.04] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                What to do next
              </p>
              <p className="mt-3 text-sm leading-6 text-foreground">{nextAction}</p>
            </div>
            <div className="rounded-[24px] bg-rose-50/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">
                Needs attention
              </p>
              <p className="mt-3 text-2xl font-black tracking-tight text-rose-900">
                {pendingFiles + missingDocumentsCount}
              </p>
              <p className="mt-2 text-sm leading-6 text-rose-900/80">
                Review items still blocking a clean decision.
              </p>
            </div>
            <div className="rounded-[24px] bg-sky-50/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                Evidence state
              </p>
              <p className="mt-3 text-2xl font-black tracking-tight text-sky-900">
                {pendingFiles} / {acceptedFiles}
              </p>
              <p className="mt-2 text-sm leading-6 text-sky-900/80">
                Pending review vs accepted files in the packet.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.32fr)_minmax(21rem,0.68fr)] 2xl:items-stretch">
          <section id="review-brief" className="surface-panel h-full p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                  Review brief
                </p>
                <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight text-primary">
                  Case story and action context
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Review urgency, location, and document pressure together before moving to the decision lane.
                </p>
              </div>
              <Link
                href="#decision-center"
                className={cn(buttonVariants({ variant: "outline" }), "rounded-full px-5")}
              >
                Go to next action
                <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 md:items-stretch min-[1680px]:grid-cols-3">
              <div className="rounded-[24px] border border-border/60 bg-white/78 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)] h-full">
                <div className="flex items-center gap-2 text-primary">
                  <span className="flex size-8 items-center justify-center rounded-full bg-primary/10">
                    <Layers3 className="size-4" />
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.16em]">Category</span>
                </div>
                <p className="mt-4 text-sm font-semibold leading-7 text-foreground">
                  {item.intake.category}
                </p>
              </div>
              <div className="rounded-[24px] border border-rose-200 bg-rose-50/70 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)] h-full">
                <div className="flex items-center gap-2 text-rose-800">
                  <span className="flex size-8 items-center justify-center rounded-full bg-white/70">
                    <AlertTriangle className="size-4" />
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.16em]">Urgency</span>
                </div>
                <p className="mt-4 text-sm font-semibold capitalize leading-7 text-rose-900/85">
                  {item.intake.urgency}
                </p>
              </div>
              <div className="rounded-[24px] border border-amber-200 bg-amber-50/80 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)] h-full">
                <div className="flex items-center gap-2 text-amber-800">
                  <span className="flex size-8 items-center justify-center rounded-full bg-white/70">
                    <FileText className="size-4" />
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.16em]">Missing docs</span>
                </div>
                <p className="mt-4 text-sm font-semibold leading-7 text-amber-900/85">
                  {item.intake.missingDocuments.length
                    ? item.intake.missingDocuments.join(", ")
                    : "No missing docs flagged"}
                </p>
              </div>
              <div className="rounded-[24px] border border-border/60 bg-white/78 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)] h-full">
                <div className="flex items-center gap-2 text-primary">
                  <span className="flex size-8 items-center justify-center rounded-full bg-primary/10">
                    <MapPin className="size-4" />
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.16em]">Location</span>
                </div>
                <p className="mt-4 text-sm font-semibold leading-7 text-foreground">{item.location}</p>
              </div>
              <div className="rounded-[24px] border border-border/60 bg-white/78 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)] h-full">
                <div className="flex items-center gap-2 text-primary">
                  <span className="flex size-8 items-center justify-center rounded-full bg-primary/10">
                    <Clock3 className="size-4" />
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.16em]">Timeline depth</span>
                </div>
                <p className="mt-4 text-sm font-semibold leading-7 text-foreground">
                  {item.timeline.length} recorded events
                </p>
              </div>
              <div className="rounded-[24px] border border-emerald-200 bg-emerald-50/80 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)] h-full">
                <div className="flex items-center gap-2 text-emerald-800">
                  <span className="flex size-8 items-center justify-center rounded-full bg-white/70">
                    <CheckCircle2 className="size-4" />
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.16em]">Evidence cleared</span>
                </div>
                <p className="mt-4 text-sm font-semibold leading-7 text-emerald-900/85">
                  {acceptedFiles} accepted file{acceptedFiles === 1 ? "" : "s"}
                </p>
              </div>
            </div>
          </section>

          <div className="surface-panel h-full p-6">
            <div className="flex items-center gap-3">
              <UserRound className="size-5 text-primary" />
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                Citizen summary
              </p>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <UserRound className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground">{item.citizenName}</p>
                <p className="truncate text-sm text-muted-foreground">{item.location}</p>
              </div>
            </div>
            <div className="mt-4 rounded-[22px] bg-muted/70 p-4">
              <p className="text-sm leading-7 text-muted-foreground">{item.intake.citizenSummary}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.32fr)_minmax(21rem,0.68fr)] 2xl:items-stretch">
          <section className="surface-panel h-full p-6">
            <div className="flex items-center gap-3">
              <FileSearch className="size-5 text-primary" />
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                Decision support
              </p>
            </div>
            <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] xl:items-stretch">
              <div className="rounded-[24px] border border-border/60 bg-white/78 p-5 shadow-[0_10px_24px_rgba(15,23,42,0.05)] h-full">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/70">
                  Issue summary
                </p>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {item.intake.adminSummary}
                </p>
              </div>
              <div className="rounded-[24px] border border-primary/15 bg-primary/[0.04] p-5 shadow-[0_10px_24px_rgba(15,23,42,0.05)] h-full">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/70">
                  Next best action
                </p>
                <p className="mt-3 text-sm leading-7 text-foreground">{nextAction}</p>
              </div>
              <div className="rounded-[24px] border border-border/60 bg-white/78 p-5 shadow-[0_10px_24px_rgba(15,23,42,0.05)] xl:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/70">
                  Document gap
                </p>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {item.intake.missingDocuments.length
                    ? `Ask for ${item.intake.missingDocuments[0]} first so the citizen sees one clear next step.`
                    : "No document gap is currently blocking review. Focus on routing and resolution."}
                </p>
              </div>
            </div>
          </section>

          <div className="surface-panel h-full p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
              Case facts
            </p>
            <div className="mt-4 grid gap-3">
              {[
                { label: "Case ID", value: item.reference },
                { label: "Case type", value: item.type.replaceAll("_", " ") },
                { label: "Assigned desk", value: item.assignedUnit },
                { label: "Created", value: new Date(item.createdAt).toLocaleDateString("en-GB") },
                { label: "Updated", value: new Date(item.updatedAt).toLocaleDateString("en-GB") },
              ].map((entry) => (
                <div
                  key={entry.label}
                  className="rounded-[22px] border border-border/60 bg-white/78 p-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)]"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {entry.label}
                  </p>
                  <p className="mt-2 text-sm font-semibold capitalize text-foreground">
                    {entry.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <section id="evidence-review">
          <EvidenceReviewPanel caseId={item.id} files={item.evidence} />
        </section>
      </section>

      <section className="grid gap-6 xl:grid-cols-2 xl:items-start">
        <EvidenceManager
          files={item.evidence}
          title="Evidence at a glance"
          description="Read the current file packet quickly before making review decisions."
          dense
          className="min-h-[32rem]"
        />

        <div className="surface-panel p-7">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
            Activity timeline
          </p>
          <div className="max-h-[32rem] overflow-y-auto pr-2">
            {item.timeline.length ? (
              <Timeline events={item.timeline} />
            ) : (
              <EmptyState
                icon={<AlertTriangle className="size-5" />}
                title="No live events yet"
                description="Timeline updates will appear here as the review flow advances."
              />
            )}
          </div>
        </div>
      </section>

      <LocationPreviewCard
        title="Operational map context"
        description="Validate routing and field assignment against the resolved location."
        location={item.locationMeta}
      />

      <section id="decision-center">
        <AdminReviewPanel
          caseId={item.id}
          initialNote={item.latestInternalNote}
          status={item.status}
          missingDocumentsCount={missingDocumentsCount}
          pendingFiles={pendingFiles}
          acceptedFiles={acceptedFiles}
        />
      </section>

      <section className="surface-panel p-5 sm:p-6">
        <AssistantPanel
          caseId={item.id}
          initialMessages={messages || []}
          title="AI review helper"
          subtitle="Use AI after the case story and file packet are clear. Keep it for summary, gap-checking, and drafting a cleaner follow-up note."
          suggestedPrompts={[
            "Draft an officer summary for this case",
            "Summarize the uploaded files",
            "What documents are still missing?",
            "What should the admin do next?",
          ]}
        />
      </section>
    </div>
  );
}
