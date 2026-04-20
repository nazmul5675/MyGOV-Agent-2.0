import type { Metadata } from "next";
import { ShieldCheck, Sparkles, UserCog, UserRound, Users2 } from "lucide-react";

import { AdminUsersConsole } from "@/components/admin/admin-users-console";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { Reveal } from "@/components/common/reveal";
import { StatCard } from "@/components/common/stat-card";
import { requireRole } from "@/lib/auth/session";
import { getAdminUsersDashboardData } from "@/lib/repositories/users";

export const metadata: Metadata = {
  title: "Admin User Management",
};

export default async function AdminUsersPage() {
  await requireRole("admin");
  const data = await getAdminUsersDashboardData();
  const statIcons = [
    <Users2 className="size-5" key="users" />,
    <UserRound className="size-5" key="citizens" />,
    <ShieldCheck className="size-5" key="admins" />,
    <Sparkles className="size-5" key="new" />,
    <UserCog className="size-5" key="profile" />,
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin users"
        title="Manage access, roles, and account readiness"
        description="Review every citizen and admin account from one operational screen, with safe role controls, profile context, and audit-ready change history."
      />

      <Reveal>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {data.stats.map((stat, index) => (
            <StatCard key={stat.label} {...stat} icon={statIcons[index]} />
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.16fr)_minmax(22rem,0.84fr)]">
          <AdminUsersConsole users={data.users} />

          <aside className="space-y-6">
            <section className="surface-panel p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <Sparkles className="size-5 text-primary" />
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                  Role audit activity
                </p>
              </div>
              <div className="mt-5 space-y-3">
                {data.recentRoleChanges.length ? (
                  data.recentRoleChanges.map((item) => (
                    <article key={item.id} className="rounded-[22px] bg-muted/75 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground">{item.title}</p>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        <span>{item.actor}</span>
                        <span>{new Date(item.createdAt).toLocaleDateString("en-GB")}</span>
                      </div>
                    </article>
                  ))
                ) : (
                  <EmptyState
                    icon={<ShieldCheck className="size-5" />}
                    title="No role changes recorded yet"
                    description="Promotions and demotions from this screen will appear here with audit-ready detail."
                  />
                )}
              </div>
            </section>

            <section className="surface-panel p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <UserCog className="size-5 text-primary" />
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                  Access rules
                </p>
              </div>
              <div className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
                <p>Public registration always creates a citizen account.</p>
                <p>Admins can only be promoted or demoted from this protected control console.</p>
                <p>Self-demotion and last-admin removal are blocked to preserve secure access continuity.</p>
              </div>
            </section>
          </aside>
        </section>
      </Reveal>
    </div>
  );
}
