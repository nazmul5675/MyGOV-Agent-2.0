import type { Metadata } from "next";
import { ClipboardCheck, Clock3, ShieldCheck } from "lucide-react";

import { requireRole } from "@/lib/auth/session";
import { getAdminQueue, getAdminStats } from "@/lib/demo-data";
import { CaseCard } from "@/components/common/case-card";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";

export const metadata: Metadata = {
  title: "Admin Dashboard",
};

export default async function AdminDashboardPage() {
  await requireRole("admin");
  const stats = getAdminStats();
  const queue = getAdminQueue();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin dashboard"
        title="Review queue with cleaner context and faster decisions"
        description="Admins get a focused queue with evidence context, AI-ready summaries, missing document signals, and direct actions in one protected workspace."
      />

      <div className="grid gap-5 md:grid-cols-3">
        <StatCard {...stats[0]} icon={<ClipboardCheck className="size-5" />} />
        <StatCard {...stats[1]} icon={<ShieldCheck className="size-5" />} />
        <StatCard {...stats[2]} icon={<Clock3 className="size-5" />} />
      </div>

      <section className="space-y-5">
        <PageHeader
          title="Priority queue"
          description="This queue demonstrates the premium admin experience inspired by your officer review reference: evidence-first, summary-rich, and action-ready."
        />
        <div className="grid gap-5 xl:grid-cols-2">
          {queue.map((item) => (
            <CaseCard key={item.id} item={item} href={`/admin/cases/${item.id}`} />
          ))}
        </div>
      </section>
    </div>
  );
}
