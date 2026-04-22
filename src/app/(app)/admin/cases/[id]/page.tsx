import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
  Layers3,
  MapPin,
  Sparkles,
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
  const reviewSignals = [
    missingDocumentsCount
      ? `${missingDocumentsCount} missing document item${missingDocumentsCount === 1 ? "" : "s"}`
      : "No missing document flags.",
    pendingFiles
      ? `${pendingFiles} file${pendingFiles === 1 ? "" : "s"} still need review.`
      : "All evidence states are current.",
    item.latestInternalNote ? "Internal note already exists." : "No internal note saved yet.",
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={item.reference}
        title="Admin review workspace"
        description="Read the case story quickly, review the file packet, and take the next decision from one clear workspace."
      />

      <section className="surface-panel p-6 sm:p-7">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.55fr)]">
          <div className="hero-gradient rounded-[32px] p-6 text-primary-foreground sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-4">
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
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-[24px] bg-muted/70 p-4">
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
                Open review items across files and missing documents.
              </p>
            </div>
            <div className="rounded-[24px] bg-emerald-50/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Accepted files
              </p>
              <p className="mt-3 text-2xl font-black tracking-tight text-emerald-900">
                {acceptedFiles}
              </p>
              <p className="mt-2 text-sm leading-6 text-emerald-900/80">
                Evidence already cleared for this case.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-12">
        <aside className="space-y-6 xl:col-span-4 2xl:col-span-3">
          <div className="surface-panel p-6">
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
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              {item.intake.citizenSummary}
            </p>
          </div>

          <div className="surface-panel p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
              Case facts
            </p>
            <div className="mt-4 space-y-3">
              {[
                { label: "Case ID", value: item.reference },
                { label: "Case type", value: item.type.replaceAll("_", " ") },
                { label: "Assigned desk", value: item.assignedUnit },
                { label: "Created", value: new Date(item.createdAt).toLocaleDateString("en-GB") },
                { label: "Updated", value: new Date(item.updatedAt).toLocaleDateString("en-GB") },
              ].map((entry) => (
                <div key={entry.label} className="rounded-[20px] bg-muted/80 p-4">
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

          <div className="surface-panel p-6">
            <div className="flex items-center gap-3">
              <Sparkles className="size-5 text-primary" />
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                Review signals
              </p>
            </div>
            <div className="mt-4 space-y-3">
              {reviewSignals.map((entry) => (
                <div
                  key={entry}
                  className="rounded-[22px] bg-muted/80 p-4 text-sm leading-6 text-muted-foreground"
                >
                  {entry}
                </div>
              ))}
            </div>
          </div>

          <LocationPreviewCard
            title="Operational map context"
            description="Validate routing and field assignment against the resolved location."
            location={item.locationMeta}
            compact
          />
        </aside>

        <div className="space-y-6 xl:col-span-8 2xl:col-span-6">
          <section className="surface-panel p-6">
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

            <div className="mt-5 grid gap-4 md:grid-cols-2 min-[1680px]:grid-cols-3">
              <div className="rounded-[22px] bg-muted/70 p-4">
                <div className="flex items-center gap-2 text-primary">
                  <Layers3 className="size-4" />
                  <span className="text-sm font-semibold">Category</span>
                </div>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {item.intake.category}
                </p>
              </div>
              <div className="rounded-[22px] bg-rose-50/70 p-4">
                <div className="flex items-center gap-2 text-rose-800">
                  <AlertTriangle className="size-4" />
                  <span className="text-sm font-semibold">Urgency</span>
                </div>
                <p className="mt-3 text-sm capitalize leading-7 text-rose-900/85">
                  {item.intake.urgency}
                </p>
              </div>
              <div className="rounded-[22px] bg-amber-50/80 p-4">
                <div className="flex items-center gap-2 text-amber-800">
                  <FileText className="size-4" />
                  <span className="text-sm font-semibold">Missing docs</span>
                </div>
                <p className="mt-3 text-sm leading-7 text-amber-900/85">
                  {item.intake.missingDocuments.length
                    ? item.intake.missingDocuments.join(", ")
                    : "No missing docs flagged"}
                </p>
              </div>
              <div className="rounded-[22px] bg-muted/70 p-4">
                <div className="flex items-center gap-2 text-primary">
                  <MapPin className="size-4" />
                  <span className="text-sm font-semibold">Location</span>
                </div>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.location}</p>
              </div>
              <div className="rounded-[22px] bg-muted/70 p-4">
                <div className="flex items-center gap-2 text-primary">
                  <Clock3 className="size-4" />
                  <span className="text-sm font-semibold">Timeline depth</span>
                </div>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {item.timeline.length} recorded events
                </p>
              </div>
              <div className="rounded-[22px] bg-emerald-50/80 p-4">
                <div className="flex items-center gap-2 text-emerald-800">
                  <CheckCircle2 className="size-4" />
                  <span className="text-sm font-semibold">Evidence cleared</span>
                </div>
                <p className="mt-3 text-sm leading-7 text-emerald-900/85">
                  {acceptedFiles} accepted file{acceptedFiles === 1 ? "" : "s"}
                </p>
              </div>
            </div>
          </section>

          <section className="surface-panel p-6">
            <div className="flex items-center gap-3">
              <Sparkles className="size-5 text-primary" />
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                AI decision support
              </p>
            </div>
            <div className="mt-4 grid gap-4 xl:grid-cols-3">
              <div className="rounded-[22px] bg-muted/75 p-4">
                <p className="text-sm font-semibold text-foreground">Issue summary</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {item.intake.adminSummary}
                </p>
              </div>
              <div className="rounded-[22px] bg-muted/75 p-4">
                <p className="text-sm font-semibold text-foreground">Document gap</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {item.intake.missingDocuments.length
                    ? `Ask for ${item.intake.missingDocuments[0]} first so the citizen sees one clear next step.`
                    : "No document gap is currently blocking review. Focus on routing and resolution."}
                </p>
              </div>
              <div className="rounded-[22px] bg-muted/75 p-4">
                <p className="text-sm font-semibold text-foreground">Next best action</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{nextAction}</p>
              </div>
            </div>
          </section>

          <EvidenceManager
            files={item.evidence}
            title="Evidence at a glance"
            description="Read the current file packet quickly before making review decisions."
            dense
          />

          <EvidenceReviewPanel caseId={item.id} files={item.evidence} />

          <div className="surface-panel p-7">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
              Activity timeline
            </p>
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

        <div
          id="decision-center"
          className="space-y-6 xl:col-span-12 2xl:col-span-3 2xl:sticky 2xl:top-6 2xl:self-start"
        >
          <AdminReviewPanel caseId={item.id} initialNote={item.latestInternalNote} />
        </div>
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
