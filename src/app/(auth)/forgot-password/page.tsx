import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/forms/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot Password",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      badge="Password recovery"
      title="Reset access without losing momentum."
      description="Recover access quickly with a clear, presentation-safe flow that keeps the demo moving."
      sideContent={
        <>
          <p className="text-xs uppercase tracking-[0.22em] text-primary-foreground/70">
            Reset flow
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-primary-foreground/80">
            <li>Prototype mode simulates the reset handoff cleanly</li>
            <li>No role or profile data is exposed during recovery</li>
            <li>Clear success and failure states keep the flow trustworthy</li>
          </ul>
        </>
      }
      footerLink={{
        href: "/login",
        label: "Back to sign in",
      }}
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
