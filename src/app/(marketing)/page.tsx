import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  FileStack,
  ShieldCheck,
  Sparkles,
  Waves,
} from "lucide-react";

import { Reveal } from "@/components/common/reveal";
import { Footer } from "@/components/layout/footer";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <MarketingHeader />
      <main>
        <section className="container-shell grid gap-8 py-14 lg:grid-cols-[1.12fr_0.88fr] lg:py-20">
          <Reveal>
            <div className="space-y-7">
              <div className="inline-flex rounded-full bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-accent-foreground">
                Live citizen service and case tracking
              </div>
              <div className="space-y-5">
                <h1 className="text-balance max-w-3xl text-5xl font-black tracking-tight text-primary sm:text-6xl">
                  One trusted place to submit a case, upload proof, and follow live updates.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                  MyGOV Agent 2.0 helps citizens explain an issue clearly, attach supporting files, and follow progress while admins review the same live case record.
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <Link href="/login" className={cn(buttonVariants({ size: "lg" }), "rounded-full px-6")}>
                  Launch secure workspace
                </Link>
                <Link href="#journey" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-full px-6")}>
                  Explore citizen journey
                </Link>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="hero-gradient relative overflow-hidden rounded-[36px] p-8 text-primary-foreground shadow-[0_28px_60px_rgba(0,30,64,0.28)]">
              <div className="absolute -right-10 top-0 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
              <div className="space-y-8">
                <div className="inline-flex rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary-foreground/80">
                  Guided service flow
                </div>
                <div className="space-y-3">
                  <h2 className="font-heading text-3xl font-bold tracking-tight">
                    Clear next steps for citizens and faster review for staff.
                  </h2>
                  <p className="max-w-md text-sm leading-7 text-primary-foreground/78">
                    Citizens get a calmer way to explain what happened. Admins get cleaner case packets and fewer back-and-forth requests.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    ["Case submission", "Start from text, photos, documents, or a voice note"],
                    ["Evidence upload", "Keep supporting files and the case story together"],
                    ["Live tracking", "Follow status changes, reminders, and file decisions in one place"],
                    ["Admin review", "Protected review pages help staff triage, request documents, and decide next steps"],
                  ].map(([title, description]) => (
                    <div key={title} className="rounded-[24px] border border-white/10 bg-white/8 p-4">
                      <p className="font-semibold">{title}</p>
                      <p className="mt-2 text-sm leading-6 text-primary-foreground/72">{description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        <section id="journey" className="container-shell py-10 lg:py-16">
          <Reveal>
            <div className="grid gap-5 md:grid-cols-3">
              {[
                {
                  icon: FileStack,
                  title: "Submit a case your way",
                  body: "Citizens can start from text, voice notes, photos, or documents without navigating agency silos.",
                },
                {
                  icon: Sparkles,
                  title: "Turn intake into a clear case",
                  body: "The app helps turn each submission into a case staff can understand, review, and act on more quickly.",
                },
                {
                  icon: ShieldCheck,
                  title: "Review with confidence",
                  body: "Admins see a clear review workspace with evidence, requested documents, notes, and next actions together.",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <article key={item.title} className="surface-panel p-7">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                      <Icon className="size-5" />
                    </div>
                    <h3 className="mt-5 text-2xl font-bold tracking-tight text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.body}</p>
                  </article>
                );
              })}
            </div>
          </Reveal>
        </section>

        <section id="features" className="container-shell py-10 lg:py-16">
          <Reveal>
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="surface-panel p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
                  Built for real case handling
                </p>
                <h2 className="mt-4 text-4xl font-black tracking-tight text-primary">
                  Calm confidence for citizens. Fast clarity for admins.
                </h2>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">
                  The product stays focused on the moments that matter most: describing an issue clearly, sharing proof, reviewing the case, and keeping status updates understandable.
                </p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                {[
                  { icon: Waves, title: "Flood relief", text: "High-confidence household intake with image and document support." },
                  { icon: FileStack, title: "Public complaint", text: "No-wrong-door routing with cleaner location and evidence capture." },
                  { icon: BellRing, title: "Reminder and renewal", text: "Proactive case starts for licenses, taxes, or benefit renewals." },
                  { icon: ArrowRight, title: "Track each update", text: "Stay informed as files are reviewed, documents are requested, and the case moves forward." },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="surface-panel p-6">
                      <Icon className="size-5 text-primary" />
                      <h3 className="mt-4 text-xl font-bold tracking-tight text-foreground">
                        {item.title}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </Reveal>
        </section>

        <section id="trust" className="container-shell py-10 pb-20 lg:py-16 lg:pb-24">
          <Reveal>
            <div className="hero-gradient rounded-[36px] p-10 text-primary-foreground">
              <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary-foreground/70">
                    Trust, protection, clarity
                  </p>
                  <h2 className="mt-4 text-4xl font-black tracking-tight">
                    Built to feel trustworthy for citizens and practical for the teams reviewing cases.
                  </h2>
                </div>
                <div className="grid gap-4">
                  {[
                    "Secure sign-in and protected access for citizen and admin workspaces",
                    "Live case records, file uploads, and status updates in one place",
                    "Clear review flows that reduce repeated questions and missed follow-ups",
                  ].map((item) => (
                    <div key={item} className="rounded-[24px] border border-white/10 bg-white/8 p-4 text-sm leading-7 text-primary-foreground/80">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      </main>
      <Footer />
    </div>
  );
}
