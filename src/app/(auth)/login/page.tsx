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
      description="Access live case tracking, notifications, and protected admin review using Firebase authentication with secure server-side sessions."
      sideContent={
        <>
          <p className="text-xs uppercase tracking-[0.22em] text-primary-foreground/70">
            Included in this experience
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-primary-foreground/80">
            <li>Cookie-based sessions for server-side route protection</li>
            <li>Citizen and admin access driven by Firebase role resolution</li>
            <li>Trust-first onboarding that keeps profile data in Firestore</li>
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
