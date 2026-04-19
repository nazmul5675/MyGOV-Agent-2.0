import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/forms/login-form";

export const metadata: Metadata = {
  title: "Login",
};

export default function LoginPage() {
  return (
    <AuthShell
      badge="Secure authentication"
      title="Sign in to your MyGOV workspace."
      description="Enter the citizen or admin workspace with a reliable session flow designed for smooth demo handoff and immediate protected routing."
      sideContent={
        <>
          <p className="text-xs uppercase tracking-[0.22em] text-primary-foreground/70">
            Included in this experience
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-primary-foreground/80">
            <li>Cookie-based sessions for server-side route protection</li>
            <li>Citizen and admin access driven by the same seeded role model used across the prototype</li>
            <li>Immediate handoff into the correct workspace after sign-in</li>
          </ul>
        </>
      }
    >
      <Suspense fallback={<div className="surface-panel h-[520px]" />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
