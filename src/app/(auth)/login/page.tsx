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
      description="Sign in once and we will take you to the right protected workspace."
      sideContent={
        <>
          <p className="text-xs uppercase tracking-[0.22em] text-primary-foreground/70">
            What to expect
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-primary-foreground/80">
            <li>Secure sign-in for citizen and admin accounts</li>
            <li>Protected routing into the correct workspace right after sign-in</li>
            <li>One shared login page for both roles</li>
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
