import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  FileText,
  MapPin,
  MessageSquareQuote,
} from "lucide-react";

import { requireRole } from "@/lib/auth/session";
import { getCitizenCase } from "@/lib/demo-data";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { Timeline } from "@/components/common/timeline";

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
  const item = getCitizenCase(id, session.uid);

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
              {item.evidence.map((evidence) => (
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
                    {evidence.kind.replace("_", " ")} • {evidence.status}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="surface-panel p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
              Reminders
            </p>
            <div className="mt-4 space-y-3">
              {item.reminders.map((reminder) => (
                <div
                  key={reminder}
                  className="rounded-[22px] bg-muted/80 p-4 text-sm leading-7 text-muted-foreground"
                >
                  {reminder}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="surface-panel p-7">
        <p className="mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
          Timeline
        </p>
        <Timeline events={item.timeline} />
      </section>
    </div>
  );
}
