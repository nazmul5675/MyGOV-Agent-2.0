import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, UserRound } from "lucide-react";

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
        : "The profile page could not load the Firestore user document.";
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
          description={errorMessage || "The profile page could not load the Firestore user document."}
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
    role: profile.role,
    documents: profile.documents ?? [],
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Profile"
        title="Profile and identity readiness"
        description="Profile details beyond login credentials live in Firestore, so the product can stay simple at sign-up and still support richer citizen context later."
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
          <p className="mt-6 max-w-xl text-sm leading-7 text-primary-foreground/82">
            Full name is collected during registration. Date of birth, phone number,
            and location details are stored here in Firestore so onboarding stays
            lightweight while age-aware and contact-aware flows remain possible later.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {profileCards.map((item) => {
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
