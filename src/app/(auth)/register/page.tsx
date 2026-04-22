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
      description="Start with the essentials now, then complete the rest of your profile later. Public registration is for citizen accounts only."
      sideContent={
        <>
          <p className="text-xs uppercase tracking-[0.22em] text-primary-foreground/70">
            Before you continue
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-primary-foreground/80">
            <li>Public registration creates citizen accounts only</li>
            <li>Admin access is assigned separately and cannot be self-registered</li>
            <li>You can finish extra profile details after sign-up</li>
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
