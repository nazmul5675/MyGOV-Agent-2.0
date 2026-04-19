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
        <section className="container-shell grid gap-10 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
          <Reveal>
            <div className="space-y-8">
              <div className="inline-flex rounded-full bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-accent-foreground">
                Premium civic-tech intake and tracking
              </div>
              <div className="space-y-5">
                <h1 className="text-balance max-w-3xl text-5xl font-black tracking-tight text-primary sm:text-6xl">
                  One trusted entry point for citizen cases, admin review, and proactive reminders.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                  MyGOV Agent 2.0 unifies multimodal case intake, structured summaries, evidence handling, and role-based review flows in a calm, polished experience built for public trust.
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
                  Proactive assistance
                </div>
                <div className="space-y-3">
                  <h2 className="font-heading text-3xl font-bold tracking-tight">
                    Your next government action is already clear.
                  </h2>
                  <p className="max-w-md text-sm leading-7 text-primary-foreground/78">
                    Citizens receive proactive reminders, while admins get cleaner packets and fewer fragmented follow-ups.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    ["Multimodal intake", "Text, photo, document, and voice note capture"],
                    ["Structured review", "Citizen summary, admin summary, and missing docs"],
                    ["Unified tracking", "Clear status timeline and evidence previews"],
                    ["Protected admin workflows", "Role-aware review pages and action controls"],
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
                  title: "Structure the intake instantly",
                  body: "The app structures intake into a reusable packet with summaries, urgency signals, and document gaps ready for smarter downstream review.",
                },
                {
                  icon: ShieldCheck,
                  title: "Review with confidence",
                  body: "Admins see a premium decision workspace with evidence previews, routing cues, notes, and status controls.",
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
                  Product positioning
                </p>
                <h2 className="mt-4 text-4xl font-black tracking-tight text-primary">
                  Calm confidence for citizens. Fast clarity for admins.
                </h2>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">
                  The visual system builds on your starter direction: deep sovereign blue, restrained gold highlights, editorial type hierarchy, soft lifted cards, and minimal borders guided by tonal depth.
                </p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                {[
                  { icon: Waves, title: "Flood relief", text: "High-confidence household intake with image and document support." },
                  { icon: FileStack, title: "Public complaint", text: "No-wrong-door routing with cleaner location and evidence capture." },
                  { icon: BellRing, title: "Reminder and renewal", text: "Proactive case starts for licenses, taxes, or benefit renewals." },
                  { icon: ArrowRight, title: "Scalable workflow", text: "Route handlers, session cookies, prototype data modules, and AI-ready service boundaries." },
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
                    Trust, policy, assistance
                  </p>
                  <h2 className="mt-4 text-4xl font-black tracking-tight">
                    Built to feel trustworthy enough for citizens and efficient enough for the back office.
                  </h2>
                </div>
                <div className="grid gap-4">
                  {[
                    "Protected routes and server-first session checks",
                    "Prototype data controls with a clean path back to live integrations later",
                    "Reusable UI system for dashboards, case tracking, and review flows",
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
