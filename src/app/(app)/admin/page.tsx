import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ClipboardCheck, Clock3, ShieldCheck } from "lucide-react";

import { AdminQueueBoard } from "@/components/admin/admin-queue-board";
import { LiveDataState } from "@/components/common/live-data-state";
import { PageHeader } from "@/components/common/page-header";
import { Reveal } from "@/components/common/reveal";
import { StatCard } from "@/components/common/stat-card";
import { requireRole } from "@/lib/auth/session";
import { getAdminDashboardData } from "@/lib/repositories/cases";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin Dashboard",
};

export default async function AdminDashboardPage() {
  await requireRole("admin");
  let data:
    | Awaited<ReturnType<typeof getAdminDashboardData>>
    | null = null;
  let errorMessage: string | null = null;

  try {
    data = await getAdminDashboardData();
  } catch (error) {
    errorMessage =
      error instanceof Error
        ? error.message
        : "The admin dashboard could not load live Firebase data.";
  }

  if (errorMessage || !data) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Admin dashboard"
          title="Review queue with cleaner context and faster decisions"
          description="Admins get a focused queue with evidence context, AI-ready summaries, missing document signals, and direct actions in one protected workspace."
        />
        <LiveDataState
          tone="setup"
          title="Live admin queue is unavailable"
          description={errorMessage || "The admin dashboard could not load live Firebase data."}
          action={
            <Link
              href="/admin"
              className={cn(buttonVariants({ size: "default" }), "gap-2 px-5")}
            >
              <AlertTriangle className="size-4" />
              Retry admin dashboard
            </Link>
          }
        />
      </div>
    );
  }

  const { stats, queue } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin dashboard"
        title="Review queue with cleaner context and faster decisions"
        description="Admins get a focused queue with evidence context, AI-ready summaries, missing document signals, and direct actions in one protected workspace."
      />

      <Reveal>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatCard {...stats[0]} icon={<ClipboardCheck className="size-5" />} />
          <StatCard {...stats[1]} icon={<ShieldCheck className="size-5" />} />
          <StatCard {...stats[2]} icon={<Clock3 className="size-5" />} />
          <StatCard {...stats[3]} icon={<Clock3 className="size-5" />} />
        </div>
      </Reveal>

      <Reveal delay={0.06}>
        <section className="space-y-5">
          <PageHeader
            title="Priority queue"
            description="This queue demonstrates the premium admin experience inspired by your officer review reference: evidence-first, summary-rich, and action-ready."
          />
          <AdminQueueBoard cases={queue} />
        </section>
      </Reveal>
    </div>
  );
}
