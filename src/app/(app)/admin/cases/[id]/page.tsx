import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
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
import { LocationPreviewCard } from "@/components/maps/location-preview-card";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { Timeline } from "@/components/common/timeline";
import { AdminReviewPanel } from "@/components/forms/admin-review-panel";
import { requireRole } from "@/lib/auth/session";
import {
  getAdminCaseById,
  listCaseAssistantMessages,
} from "@/lib/repositories/cases";
import { buttonVariants } from "@/components/ui/button";
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
  let messages:
    | Awaited<ReturnType<typeof listCaseAssistantMessages>>
    | null = null;
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
          description="This page reads directly from MongoDB for the case packet, evidence, and event history."
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

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={item.reference}
        title="Admin review workspace"
        description="Review the citizen packet, manage evidence, log internal notes, and make the next decision from one protected control surface."
      />

      <section className="grid gap-6 xl:grid-cols-[312px_minmax(0,1fr)_360px]">
        <aside className="space-y-6">
          <div className="surface-panel p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
              Case overview
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
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
              Citizen summary
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <UserRound className="size-4" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{item.citizenName}</p>
                <p className="text-sm text-muted-foreground">{item.location}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              {item.intake.citizenSummary}
            </p>
          </div>

          <div className="surface-panel p-6">
            <div className="flex items-center gap-3">
              <Sparkles className="size-5 text-primary" />
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                Review signals
              </p>
            </div>
            <div className="mt-4 space-y-3">
              {[
                item.intake.missingDocuments.length
                  ? `Missing docs: ${item.intake.missingDocuments.join(", ")}`
                  : "No missing document signals are flagged right now.",
                item.evidence.some((file) =>
                  ["uploaded", "under_review", "needs_replacement"].includes(file.status)
                )
                  ? "At least one file still needs explicit review."
                  : "Evidence states are up to date for the current file set.",
                item.latestInternalNote
                  ? `Latest internal note: ${item.latestInternalNote}`
                  : "No internal note has been saved yet.",
              ].map((entry) => (
                <div key={entry} className="rounded-[22px] bg-muted/80 p-4 text-sm leading-7 text-muted-foreground">
                  {entry}
                </div>
              ))}
            </div>
          </div>

          <LocationPreviewCard
            title="Operational map context"
            description="Use the resolved location, coordinates, and landmark detail to validate routing and field assignment."
            location={item.locationMeta}
            compact
          />
        </aside>

        <div className="space-y-6">
          <div className="hero-gradient rounded-[32px] p-6 text-primary-foreground sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.22em] text-primary-foreground/70">
                  Case packet
                </p>
                <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight">
                  {item.title}
                </h2>
              </div>
              <StatusBadge status={item.status} className="bg-white/12 text-white" />
            </div>
            <p className="mt-4 text-sm leading-7 text-primary-foreground/82">
              {item.intake.adminSummary}
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <div className="surface-panel p-5">
              <div className="flex items-center gap-2 text-primary">
                <UserRound className="size-4" />
                <span className="text-sm font-semibold">Citizen</span>
              </div>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.citizenName}</p>
            </div>
            <div className="surface-panel p-5">
              <div className="flex items-center gap-2 text-primary">
                <Layers3 className="size-4" />
                <span className="text-sm font-semibold">Category</span>
              </div>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {item.intake.category}
              </p>
            </div>
            <div className="surface-panel p-5">
              <div className="flex items-center gap-2 text-primary">
                <AlertTriangle className="size-4" />
                <span className="text-sm font-semibold">Urgency</span>
              </div>
              <p className="mt-3 text-sm capitalize leading-7 text-muted-foreground">
                {item.intake.urgency}
              </p>
            </div>
            <div className="surface-panel p-5">
              <div className="flex items-center gap-2 text-primary">
                <FileText className="size-4" />
                <span className="text-sm font-semibold">Missing docs</span>
              </div>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {item.intake.missingDocuments.length
                  ? item.intake.missingDocuments.join(", ")
                  : "No missing docs flagged"}
              </p>
            </div>
            <div className="surface-panel p-5">
              <div className="flex items-center gap-2 text-primary">
                <MapPin className="size-4" />
                <span className="text-sm font-semibold">Location</span>
              </div>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.location}</p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div className="surface-panel p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Accepted files
              </p>
              <p className="mt-2 text-3xl font-bold text-foreground">{acceptedFiles}</p>
            </div>
            <div className="surface-panel p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Pending review
              </p>
              <p className="mt-2 text-3xl font-bold text-foreground">{pendingFiles}</p>
            </div>
            <div className="surface-panel p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Timeline depth
              </p>
              <p className="mt-2 text-3xl font-bold text-foreground">{item.timeline.length}</p>
            </div>
          </div>

          <div className="surface-panel p-6">
            <div className="flex items-center gap-3">
              <Sparkles className="size-5 text-primary" />
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                AI decision support
              </p>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <div className="rounded-[22px] bg-muted/75 p-4">
                <p className="text-sm font-semibold text-foreground">Issue summary</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {item.intake.adminSummary}
                </p>
              </div>
              <div className="rounded-[22px] bg-muted/75 p-4">
                <p className="text-sm font-semibold text-foreground">Missing doc suggestion</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {item.intake.missingDocuments.length
                    ? `Ask for ${item.intake.missingDocuments[0]} first so the citizen sees one clear next step.`
                    : "No document gap is currently blocking review. Focus on routing and resolution language."}
                </p>
              </div>
              <div className="rounded-[22px] bg-muted/75 p-4">
                <p className="text-sm font-semibold text-foreground">Next best action</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {item.status === "need_more_docs"
                    ? "Keep the citizen-facing follow-up concise, then wait for the replacement evidence packet."
                    : item.status === "submitted"
                      ? "Mark the case for review and confirm whether the current evidence supports assignment."
                      : "Prepare the routing or resolution note so the timeline stays operationally clear."}
                </p>
              </div>
            </div>
          </div>

          <EvidenceManager
            files={item.evidence}
            title="Evidence workspace"
            description="Uploaded evidence stays grouped with current review states, making it easier to decide whether to accept, route, or request a better copy."
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
                description="Admin timeline entries from the case events subcollection will appear here as the review flow advances."
              />
            )}
          </div>
        </div>

        <div className="space-y-6">
          <AdminReviewPanel caseId={item.id} initialNote={item.latestInternalNote} />
          <AssistantPanel
            caseId={item.id}
            initialMessages={messages || []}
            title="AI review helper"
            subtitle="Use the assistant to summarize the packet, check for missing documents, and prepare a clearer citizen-facing follow-up note."
            suggestedPrompts={[
              "Draft an officer summary for this case",
              "Summarize the uploaded files",
              "What documents are still missing?",
              "What should the admin do next?",
            ]}
          />
        </div>
      </section>
    </div>
  );
}
