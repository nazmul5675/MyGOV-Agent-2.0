import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  MapPin,
  MessageSquareQuote,
  Sparkles,
} from "lucide-react";

import { AssistantPanel } from "@/components/common/assistant-panel";
import { EvidenceManager } from "@/components/common/evidence-manager";
import { EmptyState } from "@/components/common/empty-state";
import { LiveDataState } from "@/components/common/live-data-state";
import { LocationPreviewCard } from "@/components/maps/location-preview-card";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { Timeline } from "@/components/common/timeline";
import { requireRole } from "@/lib/auth/session";
import {
  getCitizenCaseById,
  listCaseAssistantMessages,
} from "@/lib/repositories/cases";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Case Detail",
};

export default async function CitizenCaseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ submitted?: string }>;
}) {
  const session = await requireRole("citizen");
  const { id } = await params;
  const query = await searchParams;
  let item: Awaited<ReturnType<typeof getCitizenCaseById>> | null = null;
  let messages:
    | Awaited<ReturnType<typeof listCaseAssistantMessages>>
    | null = null;
  let errorMessage: string | null = null;

  try {
    item = await getCitizenCaseById(session.uid, id);
    if (item) {
      messages = await listCaseAssistantMessages(id);
    }
  } catch (error) {
    errorMessage =
      error instanceof Error
        ? error.message
        : "The case detail page could not load live Firebase data.";
  }

  if (errorMessage) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Case detail"
          title="Live case detail unavailable"
          description="This page reads directly from Firestore and the case events subcollection."
        />
        <LiveDataState
          tone="setup"
          title="This case could not be loaded"
          description={errorMessage}
          action={
            <Link
              href={`/cases/${id}`}
              className={cn(buttonVariants({ size: "default" }), "gap-2 px-5")}
            >
              <AlertTriangle className="size-4" />
              Retry case detail
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
        title={item.title}
        description="A premium citizen-facing workspace for updates, uploads, AI guidance, and next-step clarity."
      />

      {query.submitted === "1" ? (
        <div className="surface-panel flex items-start gap-4 border-[#d2ebdc] bg-[#f4fbf6] p-5">
          <div className="flex size-11 items-center justify-center rounded-full bg-[#dff3e7] text-[#1d7d49]">
            <CheckCircle2 className="size-5" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-foreground">Case submitted successfully</p>
            <p className="text-sm leading-7 text-muted-foreground">
              Your intake packet is live, your evidence is attached, and the first timeline event is already visible below.
            </p>
          </div>
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
        <div className="space-y-6">
          <div className="surface-panel p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-3">
                <StatusBadge status={item.status} />
                <p className="text-sm leading-7 text-muted-foreground">{item.summary}</p>
              </div>
              <div className="rounded-[24px] bg-muted/80 px-4 py-3 text-right">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Progress
                </p>
                <p className="font-heading text-3xl font-bold tracking-tight text-primary">
                  {item.progress}%
                </p>
              </div>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] bg-muted/80 p-5">
                <div className="flex items-center gap-2 text-primary">
                  <MapPin className="size-4" />
                  <span className="text-sm font-semibold">Location</span>
                </div>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.location}</p>
              </div>
              <div className="rounded-[24px] bg-muted/80 p-5">
                <div className="flex items-center gap-2 text-primary">
                  <FileText className="size-4" />
                  <span className="text-sm font-semibold">Missing documents</span>
                </div>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {item.intake.missingDocuments.length
                    ? item.intake.missingDocuments.join(", ")
                    : "No missing documents at this stage."}
                </p>
              </div>
            </div>
          </div>

          <EvidenceManager
            files={item.evidence}
            title="Uploaded files"
            description="Every file linked to this case stays visible here with a live review state, so document handling feels like a real workflow instead of hidden attachments."
          />

          <section className="grid gap-4 md:grid-cols-3">
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
                Timeline events
              </p>
              <p className="mt-2 text-3xl font-bold text-foreground">{item.timeline.length}</p>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <div className="hero-gradient rounded-[32px] p-7 text-primary-foreground">
            <div className="flex items-center gap-3">
              <MessageSquareQuote className="size-5" />
              <p className="text-xs uppercase tracking-[0.18em] text-primary-foreground/70">
                Citizen summary
              </p>
            </div>
            <p className="mt-4 text-sm leading-7 text-primary-foreground/82">
              {item.intake.citizenSummary}
            </p>
          </div>

          <div className="surface-panel p-6">
            <div className="flex items-center gap-3">
              <Sparkles className="size-5 text-primary" />
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                Next step guidance
              </p>
            </div>
            <div className="mt-4 space-y-3">
              {[
                item.intake.missingDocuments.length
                  ? `Prepare: ${item.intake.missingDocuments.join(", ")}`
                  : "No missing documents are flagged right now.",
                item.status === "need_more_docs"
                  ? "Upload the requested replacement or missing document before the case can move forward."
                  : "Keep checking the timeline for review updates and routed actions.",
                item.evidence.length
                  ? "Ask the assistant to summarize your uploads before responding to any follow-up."
                  : "Add at least one supporting file to strengthen the review context.",
              ].map((entry) => (
                <div
                  key={entry}
                  className="rounded-[22px] bg-muted/80 p-4 text-sm leading-7 text-muted-foreground"
                >
                  {entry}
                </div>
              ))}
            </div>
          </div>

          <div className="surface-panel p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
              Reminders
            </p>
            <div className="mt-4 space-y-3">
              {item.reminders.length ? (
                item.reminders.map((reminder) => (
                  <div
                    key={reminder}
                    className="rounded-[22px] bg-muted/80 p-4 text-sm leading-7 text-muted-foreground"
                  >
                    {reminder}
                  </div>
                ))
              ) : (
                <EmptyState
                  icon={<MessageSquareQuote className="size-5" />}
                  title="No reminders attached"
                  description="Live reminder messages will appear here when the case needs a citizen follow-up."
                />
              )}
            </div>
          </div>

          <LocationPreviewCard
            title="Location and service area"
            description="Use this map context to confirm the complaint or service location tied to this case."
            location={item.locationMeta}
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="surface-panel p-7">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
            Timeline
          </p>
          {item.timeline.length ? (
            <Timeline events={item.timeline} />
          ) : (
            <EmptyState
              icon={<CheckCircle2 className="size-5" />}
              title="No timeline events yet"
              description="Case events from cases/{caseId}/events will appear here as the live workflow progresses."
            />
          )}
        </div>

        <AssistantPanel
          caseId={item.id}
          initialMessages={messages || []}
          title="Contextual AI helper"
          subtitle="This assistant is tied to the live case record, so you can ask what the current status means, what documents still matter, or what you should do next."
          suggestedPrompts={[
            "What documents do I need?",
            "Help me explain my issue",
            "Summarize my uploaded files",
            "Why is my case still under review?",
          ]}
        />
      </section>
    </div>
  );
}
