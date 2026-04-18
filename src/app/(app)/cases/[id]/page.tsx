import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  MapPin,
  MessageSquareQuote,
} from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { LiveDataState } from "@/components/common/live-data-state";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { Timeline } from "@/components/common/timeline";
import { requireRole } from "@/lib/auth/session";
import { getCitizenCaseById } from "@/lib/repositories/cases";
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
  let errorMessage: string | null = null;

  try {
    item = await getCitizenCaseById(session.uid, id);
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

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={item.reference}
        title={item.title}
        description="A premium citizen-facing view of timeline updates, evidence, routing state, and next actions."
      />

      {query.submitted === "1" ? (
        <div className="surface-panel flex items-start gap-4 border-[#d2ebdc] bg-[#f4fbf6] p-5">
          <div className="flex size-11 items-center justify-center rounded-full bg-[#dff3e7] text-[#1d7d49]">
            <CheckCircle2 className="size-5" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-foreground">
              Case submitted successfully
            </p>
            <p className="text-sm leading-7 text-muted-foreground">
              Your intake packet is created, your evidence is attached, and the
              first timeline event is already visible below.
            </p>
          </div>
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
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
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
              Evidence preview
            </p>
            <div className="mt-5 grid gap-3">
              {item.evidence.length ? item.evidence.map((evidence) => (
                <div
                  key={evidence.id}
                  className="rounded-[24px] bg-muted/80 p-4 transition-colors hover:bg-accent/55"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-semibold text-foreground">{evidence.name}</p>
                    <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      {evidence.sizeLabel}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {evidence.kind.replace("_", " ")} - {evidence.status}
                  </p>
                </div>
              )) : (
                <EmptyState
                  icon={<FileText className="size-5" />}
                  title="No evidence uploaded yet"
                  description="This live case does not have any Storage-backed evidence records yet."
                />
              )}
            </div>
          </div>
          <div className="surface-panel p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
              Reminders
            </p>
            <div className="mt-4 space-y-3">
              {item.reminders.length ? item.reminders.map((reminder) => (
                <div
                  key={reminder}
                  className="rounded-[22px] bg-muted/80 p-4 text-sm leading-7 text-muted-foreground"
                >
                  {reminder}
                </div>
              )) : (
                <EmptyState
                  icon={<MessageSquareQuote className="size-5" />}
                  title="No reminders attached"
                  description="Live reminder messages will appear here when the case needs a citizen follow-up."
                />
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="surface-panel p-7">
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
      </section>
    </div>
  );
}
