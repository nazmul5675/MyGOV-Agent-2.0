import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { LoginForm } from "@/components/forms/login-form";

export const metadata: Metadata = {
  title: "Login",
};

export default function LoginPage() {
  return (
    <div className="container-shell grid min-h-screen items-center gap-10 py-12 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="space-y-6">
        <div className="inline-flex rounded-full bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-accent-foreground">
          Secure authentication
        </div>
        <div className="space-y-4">
          <h1 className="text-balance text-5xl font-black tracking-tight text-primary">
            Sign in to the citizen or admin workspace.
          </h1>
          <p className="max-w-xl text-lg leading-8 text-muted-foreground">
            Firebase email/password auth is wired for production setup, and protected demo sessions are available right now so the hackathon flow can be shown end-to-end.
          </p>
        </div>
        <div className="hero-gradient rounded-[32px] p-8 text-primary-foreground">
          <p className="text-xs uppercase tracking-[0.22em] text-primary-foreground/70">
            Included in this scaffold
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-primary-foreground/80">
            <li>Secure cookie-based sessions for server-side checks</li>
            <li>Role-aware admin protection under `/admin`</li>
            <li>Clean Firebase Admin and client config boundaries</li>
          </ul>
        </div>
        <Link href="/" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
          Back to landing page
        </Link>
      </div>
      <Suspense fallback={<div className="surface-panel h-[520px]" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
