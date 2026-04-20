import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  FileText,
  Layers3,
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
        : "The admin case detail page could not load live Firebase data.";
  }

  if (errorMessage) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Admin review"
          title="Live case review unavailable"
          description="This page reads directly from Firestore for the case packet, evidence, and event history."
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

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={item.reference}
        title="Decision center"
        description="A live operations workspace for case review, evidence management, admin notes, and AI-ready guidance."
      />

      <section className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
        <aside className="space-y-6">
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
        </aside>

        <div className="space-y-6">
          <div className="hero-gradient rounded-[32px] p-7 text-primary-foreground">
            <div className="flex items-center justify-between gap-4">
              <div>
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

          <div className="grid gap-5 md:grid-cols-3">
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
          </div>

          <EvidenceManager
            files={item.evidence}
            title="Evidence workspace"
            description="Uploaded evidence stays grouped with live review states, making it easier to decide whether to accept, route, or request a better copy."
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
