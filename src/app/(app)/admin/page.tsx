import type { Metadata } from "next";
import { ClipboardCheck, Clock3, ShieldCheck } from "lucide-react";

import { requireRole } from "@/lib/auth/session";
import { getAdminDashboardData } from "@/lib/repositories/cases";
import { AdminQueueBoard } from "@/components/admin/admin-queue-board";
import { PageHeader } from "@/components/common/page-header";
import { Reveal } from "@/components/common/reveal";
import { StatCard } from "@/components/common/stat-card";

export const metadata: Metadata = {
  title: "Admin Dashboard",
};

export default async function AdminDashboardPage() {
  await requireRole("admin");
  const { stats, queue } = await getAdminDashboardData();

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
