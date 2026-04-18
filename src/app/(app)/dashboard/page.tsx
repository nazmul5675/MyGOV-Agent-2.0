import type { Metadata } from "next";
import Link from "next/link";
import { BellRing, Files, ShieldEllipsis } from "lucide-react";

import { requireRole } from "@/lib/auth/session";
import { getCitizenDashboardData } from "@/lib/repositories/cases";
import { CaseCard } from "@/components/common/case-card";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { Reveal } from "@/components/common/reveal";
import { StatCard } from "@/components/common/stat-card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Citizen Dashboard",
};

export default async function DashboardPage() {
  const session = await requireRole("citizen");
  const { stats, cases, reminders } = await getCitizenDashboardData(session);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Citizen dashboard"
        title={`Selamat datang, ${session.name.split(" ")[0]}.`}
        description="Track every case in one place, complete document requests quickly, and stay ahead of renewal reminders with a calmer citizen experience."
        actions={
          <Link href="/cases/new" className={cn(buttonVariants({ size: "lg" }), "rounded-full px-5")}>
            Create a new case
          </Link>
        }
      />

      <Reveal>
        <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="hero-gradient rounded-[32px] p-8 text-primary-foreground shadow-[0_24px_60px_rgba(0,30,64,0.28)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary-foreground/70">
            Guardian mode
          </p>
          <h2 className="mt-4 text-4xl font-black tracking-tight">
            Your road tax renewal can be completed in one guided flow.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-primary-foreground/80">
            Proactive reminders turn routine services into ready-to-finish case packets so citizens do not need to start from scratch.
          </p>
        </div>
          <div className="grid gap-5 md:grid-cols-2">
            <StatCard {...stats[0]} icon={<Files className="size-5" />} />
            <StatCard {...stats[1]} icon={<BellRing className="size-5" />} />
            <StatCard {...stats[2]} icon={<ShieldEllipsis className="size-5" />} />
            <StatCard {...stats[3]} icon={<ShieldEllipsis className="size-5" />} />
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.06}>
        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5">
          <PageHeader
            title="Recent cases"
            description="Clean summaries, visible progress, and evidence context help citizens understand what is happening without admin jargon."
          />
          {cases.length ? (
            <div className="grid gap-5 lg:grid-cols-2">
              {cases.slice(0, 2).map((item) => (
                <CaseCard key={item.id} item={item} href={`/cases/${item.id}`} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Files className="size-5" />}
              title="No cases yet"
              description="Create your first case to start tracking updates, reminders, and evidence in one place."
              action={
                <Link
                  href="/cases/new"
                  className={cn(buttonVariants({ size: "default" }), "px-5")}
                >
                  Create case
                </Link>
              }
            />
          )}
        </div>
        <div className="surface-panel p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
            Reminders and notifications
          </p>
          <div className="mt-5 space-y-4">
            {reminders.length ? (
              reminders.map((item) => (
                <div key={item.id} className="rounded-[24px] bg-muted/80 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-semibold text-foreground">{item.title}</p>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                      {item.read ? "Viewed" : "Action"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {item.body}
                  </p>
                </div>
              ))
            ) : (
              <EmptyState
                icon={<BellRing className="size-5" />}
                title="No reminders right now"
                description="Notifications and status follow-ups will appear here when your cases need attention."
              />
            )}
          </div>
        </div>
      </section>
      </Reveal>
    </div>
  );
}
