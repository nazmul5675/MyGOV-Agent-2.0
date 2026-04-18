import type { Metadata } from "next";
import { BadgeCheck, FileCheck2, UserRound } from "lucide-react";

import { requireRole } from "@/lib/auth/session";
import { PageHeader } from "@/components/common/page-header";

export const metadata: Metadata = {
  title: "Profile",
};

export default async function ProfilePage() {
  const session = await requireRole("citizen");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Profile"
        title="Citizen profile and identity readiness"
        description="This optional page rounds out the demo with a calm profile surface for identity, stored document readiness, and future settings work."
      />

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="hero-gradient rounded-[32px] p-8 text-primary-foreground">
          <div className="flex items-center gap-4">
            <div className="flex size-16 items-center justify-center rounded-full bg-white/10">
              <UserRound className="size-7" />
            </div>
            <div>
              <p className="font-heading text-3xl font-bold tracking-tight">{session.name}</p>
              <p className="text-sm text-primary-foreground/75">{session.email}</p>
            </div>
          </div>
          <p className="mt-6 max-w-xl text-sm leading-7 text-primary-foreground/82">
            Profile-level data can support guardian reminders, saved evidence, and faster future submissions without making the product feel cluttered.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {[
            {
              icon: BadgeCheck,
              title: "Identity health",
              body: "Digital identity verified and ready for assisted service workflows.",
            },
            {
              icon: FileCheck2,
              title: "Stored documents",
              body: "MyKad, proof of address, and renewal references can be surfaced here later.",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="surface-panel p-6">
                <Icon className="size-5 text-primary" />
                <h2 className="mt-4 text-xl font-bold tracking-tight text-foreground">
                  {item.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.body}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
