import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock3, UserRound } from "lucide-react";

import { ProfileBasicsForm } from "@/components/forms/profile-basics-form";
import { LiveDataState } from "@/components/common/live-data-state";
import { PageHeader } from "@/components/common/page-header";
import { requireSession } from "@/lib/auth/session";
import { getProfileCards } from "@/lib/content/profile";
import { getUserProfile } from "@/lib/repositories/users";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Profile",
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams?: Promise<{ welcome?: string }>;
}) {
  const session = await requireSession();
  const query = searchParams ? await searchParams : undefined;
  let profile: Awaited<ReturnType<typeof getUserProfile>> | null = null;
  let errorMessage: string | null = null;

  try {
    profile = await getUserProfile(session);
  } catch (error) {
    errorMessage =
      error instanceof Error
        ? error.message
        : "The profile page could not load the user profile.";
  }

  if (errorMessage || !profile) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Profile"
          title="Citizen profile and identity readiness"
          description="Keep your identity, contact details, and supporting profile information ready for faster case handling."
        />
        <LiveDataState
          tone="setup"
          title="Live profile data is unavailable"
          description={errorMessage || "The profile page could not load the user profile."}
          action={
            <Link
              href="/profile"
              className={cn(buttonVariants({ size: "default" }), "gap-2 px-5")}
            >
              <AlertTriangle className="size-4" />
              Retry profile
            </Link>
          }
        />
      </div>
    );
  }

  const profileCards = getProfileCards({
    dateOfBirth: profile.dateOfBirth,
    phoneNumber: profile.phoneNumber,
    addressText: profile.addressText,
    documents: profile.documents ?? [],
  });
  const readinessChecks = [
    Boolean(profile.dateOfBirth),
    Boolean(profile.phoneNumber),
    Boolean(profile.addressText),
    Boolean(profile.documents?.length),
  ];
  const completedCount = readinessChecks.filter(Boolean).length;
  const needsAttentionCount = readinessChecks.length - completedCount;
  const readinessLabel =
    needsAttentionCount === 0
      ? "Ready for case updates"
      : needsAttentionCount === 1
        ? "One detail could help later"
        : `${needsAttentionCount} details could still help`;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Profile"
        title="Keep your profile ready for case updates"
        description="See what is complete, what can wait, and which details may help staff handle your next case faster."
      />

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="hero-gradient rounded-[32px] p-6 text-primary-foreground sm:p-8">
          <div className="flex items-center gap-4">
            <div className="flex size-16 items-center justify-center rounded-full bg-white/10">
              <UserRound className="size-7" />
            </div>
            <div className="min-w-0">
              <p className="break-words font-heading text-3xl font-bold tracking-tight">{profile.fullName}</p>
              <p className="break-all text-sm text-primary-foreground/75">{profile.email}</p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[24px] bg-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-primary-foreground/70">
                Profile complete
              </p>
              <p className="mt-2 text-2xl font-black tracking-tight">{completedCount}/4</p>
            </div>
            <div className="rounded-[24px] bg-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-primary-foreground/70">
                Needs attention
              </p>
              <p className="mt-2 text-2xl font-black tracking-tight">{needsAttentionCount}</p>
            </div>
            <div className="rounded-[24px] bg-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-primary-foreground/70">
                Status
              </p>
              <p className="mt-2 text-sm font-semibold leading-6">{readinessLabel}</p>
            </div>
          </div>
          <p className="mt-6 max-w-xl text-sm leading-7 text-primary-foreground/82">
            Keep the details you are comfortable sharing up to date here. The goal is simple:
            fewer follow-up questions when a case needs your attention.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {profileCards.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.title} className={`surface-panel p-6 ${item.tone}`}>
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

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="surface-panel p-5">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="size-5 text-primary" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/70">
              Update now
            </p>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Add anything missing that would help staff reach you or confirm your situation quickly.
          </p>
        </div>
        <div className="surface-panel p-5">
          <div className="flex items-center gap-3">
            <Clock3 className="size-5 text-primary" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/70">
              Can wait
            </p>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Optional details like address notes or profile documents can be added later if a case asks for them.
          </p>
        </div>
        <div className="surface-panel p-5">
          <div className="flex items-center gap-3">
            <UserRound className="size-5 text-primary" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/70">
              Why it helps
            </p>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            A more complete profile can reduce repeated questions and make status updates easier to trust.
          </p>
        </div>
      </section>

      <ProfileBasicsForm
        showWelcome={query?.welcome === "1"}
        defaultValues={{
          fullName: profile.fullName,
          dateOfBirth: profile.dateOfBirth || "",
          phoneNumber: profile.phoneNumber || "",
          addressText: profile.addressText || "",
        }}
      />
    </div>
  );
}
