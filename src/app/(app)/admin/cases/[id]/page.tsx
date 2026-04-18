import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlertTriangle, FileText, Layers3, UserRound } from "lucide-react";

import { requireRole } from "@/lib/auth/session";
import { getAdminCaseById } from "@/lib/repositories/cases";
import { AdminReviewPanel } from "@/components/forms/admin-review-panel";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { Timeline } from "@/components/common/timeline";

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
  const item = await getAdminCaseById(id);

  if (!item) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={item.reference}
        title="Decision center"
        description="A protected admin review surface with evidence signals, citizen context, structured intake, timeline, and action controls."
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
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
              Evidence
            </p>
            <div className="mt-4 space-y-3">
              {item.evidence.map((evidence) => (
                <div
                  key={evidence.id}
                  className="rounded-[22px] bg-muted/80 p-4 transition-colors hover:bg-accent/55"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-semibold text-foreground">{evidence.name}</p>
                    <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                      {evidence.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {evidence.kind.replace("_", " ")} • {evidence.sizeLabel}
                  </p>
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
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
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

          <div className="surface-panel p-7">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
              Activity timeline
            </p>
            <Timeline events={item.timeline} />
          </div>
        </div>

        <AdminReviewPanel caseId={item.id} initialNote={item.latestInternalNote} />
      </section>
    </div>
  );
}
