import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/forms/register-form";

export const metadata: Metadata = {
  title: "Register",
};

export default function RegisterPage() {
  return (
    <AuthShell
      badge="Citizen onboarding"
      title="Create your secure citizen account."
      description="Start with the essentials, then complete profile details after sign-up so the onboarding flow feels light, trustworthy, and fast."
      sideContent={
        <>
          <p className="text-xs uppercase tracking-[0.22em] text-primary-foreground/70">
            Why this stays lightweight
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-primary-foreground/80">
            <li>Full name is collected at sign-up for real account identity</li>
            <li>Date of birth and contact details can be completed later on profile</li>
            <li>Admin access is managed separately and cannot be self-selected</li>
          </ul>
        </>
      }
      footerLink={{
        href: "/login",
        label: "Already have an account? Sign in",
      }}
    >
      <RegisterForm />
    </AuthShell>
  );
}
