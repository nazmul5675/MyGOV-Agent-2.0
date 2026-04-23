import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  MapPin,
  MessageSquareQuote,
  Sparkles,
} from "lucide-react";

import { AssistantPanel } from "@/components/common/assistant-panel";
import { EvidenceManager } from "@/components/common/evidence-manager";
import { EmptyState } from "@/components/common/empty-state";
import { LiveDataState } from "@/components/common/live-data-state";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { Timeline } from "@/components/common/timeline";
import { LocationPreviewCard } from "@/components/maps/location-preview-card";
import { buttonVariants } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/session";
import { getCitizenCaseById, listCaseAssistantMessages } from "@/lib/repositories/cases";
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
  let messages: Awaited<ReturnType<typeof listCaseAssistantMessages>> | null = null;
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
        : "The case detail page could not load application data.";
  }

  if (errorMessage) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Case detail"
          title="Live case detail unavailable"
          description="This page reads directly from the live case record and event history."
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
  const filesNeedAttention = item.evidence.filter((file) =>
    ["needs_replacement", "rejected"].includes(file.status)
  ).length;
  const filesInReview = item.evidence.filter((file) =>
    ["uploaded", "under_review"].includes(file.status)
  ).length;
  const missingDocuments = item.intake.missingDocuments;
  const needsCitizenAction =
    item.status === "need_more_docs" || missingDocuments.length > 0 || filesNeedAttention > 0;
  const nextStep =
    needsCitizenAction
      ? "Open the requested items below, replace anything flagged, and upload the missing proof first."
      : filesInReview > 0
        ? "Your files have been received and are being checked. You do not need to send anything else right now unless we ask."
        : "Your case is moving. Keep an eye on the timeline and notifications for the next update.";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={item.reference}
        title={item.title}
        description="See what this case means, what happens next, and whether you need to do anything right now."
      />

      {query.submitted === "1" ? (
        <div className="surface-panel flex items-start gap-4 border-[#d2ebdc] bg-[#f4fbf6] p-5">
          <div className="flex size-11 items-center justify-center rounded-full bg-[#dff3e7] text-[#1d7d49]">
            <CheckCircle2 className="size-5" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-foreground">Case submitted successfully</p>
            <p className="text-sm leading-7 text-muted-foreground">
              Your case is now live. The first update is already saved below, and you can return here any time to check progress.
            </p>
          </div>
        </div>
      ) : null}

      <section className="surface-panel p-6 sm:p-7">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.55fr)]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 space-y-3">
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

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[24px] bg-amber-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">
                  Need from you
                </p>
                <p className="mt-3 text-2xl font-black tracking-tight text-amber-950">
                  {missingDocuments.length + filesNeedAttention}
                </p>
                <p className="mt-2 text-sm leading-6 text-amber-950/80">
                  Missing or replacement items still blocking movement.
                </p>
              </div>
              <div className="rounded-[24px] bg-sky-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-800">
                  In review
                </p>
                <p className="mt-3 text-2xl font-black tracking-tight text-sky-950">
                  {filesInReview}
                </p>
                <p className="mt-2 text-sm leading-6 text-sky-950/80">
                  Files already received and waiting for review.
                </p>
              </div>
              <div className="rounded-[24px] bg-emerald-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
                  Accepted
                </p>
                <p className="mt-3 text-2xl font-black tracking-tight text-emerald-950">
                  {acceptedFiles}
                </p>
                <p className="mt-2 text-sm leading-6 text-emerald-950/80">
                  Files already accepted for this case.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div
              className={cn(
                "rounded-[28px] p-5",
                needsCitizenAction ? "bg-amber-50/90" : "bg-emerald-50/90"
              )}
            >
              <div className="flex items-center gap-3">
                {needsCitizenAction ? (
                  <CircleAlert className="size-5 text-amber-800" />
                ) : (
                  <CheckCircle2 className="size-5 text-emerald-800" />
                )}
                <p
                  className={cn(
                    "text-xs font-semibold uppercase tracking-[0.2em]",
                    needsCitizenAction ? "text-amber-800" : "text-emerald-800"
                  )}
                >
                  What happens next
                </p>
              </div>
              <p className="mt-4 text-sm leading-7 text-foreground">{nextStep}</p>
              <div className="mt-4">
                <Link
                  href={needsCitizenAction ? "#case-requests" : "#case-timeline"}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline"
                >
                  {needsCitizenAction ? "Go to requested items" : "Go to latest updates"}
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>

            <div className="rounded-[24px] bg-muted/75 p-4">
              <div className="flex items-center gap-2 text-primary">
                <MapPin className="size-4" />
                <span className="text-sm font-semibold">Service location</span>
              </div>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.location}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.95fr)]">
        <div className="space-y-6">
          <div className="hero-gradient rounded-[32px] p-6 text-primary-foreground sm:p-7">
            <div className="flex items-center gap-3">
              <MessageSquareQuote className="size-5" />
              <p className="text-xs uppercase tracking-[0.18em] text-primary-foreground/70">
                Your summary
              </p>
            </div>
            <p className="mt-4 text-sm leading-7 text-primary-foreground/82">
              {item.intake.citizenSummary}
            </p>
          </div>

          <section id="case-requests" className="surface-panel p-6">
            <div className="flex items-center gap-3">
              <Sparkles className="size-5 text-primary" />
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                Requested items and next steps
              </p>
            </div>
            <div className="mt-4 space-y-3">
              {missingDocuments.length ? (
                missingDocuments.map((entry) => (
                  <div
                    key={entry}
                    className="flex items-start gap-3 rounded-[22px] border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-950"
                  >
                    <CircleAlert className="mt-1 size-4 shrink-0" />
                    <p>{entry}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 p-4 text-sm leading-7 text-emerald-900">
                  No missing documents are flagged right now.
                </div>
              )}

              <div className="rounded-[22px] bg-muted/80 p-4 text-sm leading-7 text-muted-foreground">
                {item.status === "need_more_docs"
                  ? "Your case is waiting for the requested item above. Once you send it, the review can continue."
                  : filesInReview
                    ? "Your files have been received and are being reviewed. You only need to act if a replacement is requested."
                    : "There is no action required from you right now."}
              </div>

              {item.reminders.length ? (
                item.reminders.map((reminder) => (
                  <div
                    key={reminder}
                    className="rounded-[22px] bg-white/80 p-4 text-sm leading-7 text-muted-foreground"
                  >
                    {reminder}
                  </div>
                ))
              ) : null}
            </div>
          </section>

          <EvidenceManager
            files={item.evidence}
            title="Your uploaded files"
            description="Check each file status here so you can see what was accepted, what is still being reviewed, and what needs replacing."
          />
        </div>

        <div className="space-y-6">
          <LocationPreviewCard
            title="Location and service area"
            description="Check that the location linked to this case still looks right."
            location={item.locationMeta}
          />

          <section id="case-timeline" className="surface-panel p-7">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
              Latest updates
            </p>
            <div className="max-h-[22rem] overflow-y-auto pr-2">
              {item.timeline.length ? (
                <Timeline events={item.timeline} />
              ) : (
                <EmptyState
                  icon={<CheckCircle2 className="size-5" />}
                  title="No updates yet"
                  description="Updates will appear here as soon as your case moves forward."
                />
              )}
            </div>
          </section>
        </div>
      </section>

      <section>
        <AssistantPanel
          caseId={item.id}
          initialMessages={messages || []}
          title="Case help"
          subtitle="Ask what your status means, what file is still needed, or what to do next before you respond."
          suggestedPrompts={[
            "What do I need to do next?",
            "Which file is still missing?",
            "Summarize my uploaded files",
            "Why is my case still under review?",
          ]}
        />
      </section>
    </div>
  );
}
