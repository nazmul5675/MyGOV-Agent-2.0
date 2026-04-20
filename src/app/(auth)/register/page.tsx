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
      description="Start with the essentials, then complete profile details after sign-up so the onboarding flow feels light, trustworthy, and fast. Public registration is for citizens only."
      sideContent={
        <>
          <p className="text-xs uppercase tracking-[0.22em] text-primary-foreground/70">
            Access rules
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-primary-foreground/80">
            <li>Public registration creates citizen accounts only</li>
            <li>Admin access is assigned separately and cannot be self-registered</li>
            <li>Admins must sign in through the shared login page with issued credentials</li>
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
