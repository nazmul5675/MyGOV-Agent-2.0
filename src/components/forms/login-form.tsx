"use client";

import Link from "next/link";
import { useMemo, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, LockKeyhole } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { FormMessage } from "@/components/auth/form-message";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { firebaseAuth } from "@/lib/firebase/client";
import { getMissingFirebaseClientVars } from "@/lib/firebase/config";
import { loginSchema } from "@/lib/validation/auth";

type LoginValues = z.infer<typeof loginSchema>;

async function postJson(path: string, payload: unknown) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(body?.error || "Authentication failed.");
  }

  return response.json().catch(() => null);
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const missingClientVars = getMissingFirebaseClientVars();
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const nextPath = useMemo(() => searchParams.get("next"), [searchParams]);

  const handleLogin = async (values: LoginValues) => {
    startTransition(async () => {
      try {
        const auth = firebaseAuth;

        if (!auth) {
          throw new Error(
            `Firebase client config is incomplete. Missing: ${missingClientVars.join(", ")}`
          );
        }

        const { signInWithEmailAndPassword } = await import("firebase/auth");
        const credential = await signInWithEmailAndPassword(
          auth,
          values.email,
          values.password
        );
        const idToken = await credential.user.getIdToken(true);
        const response = (await postJson("/api/auth/login", {
          idToken,
        })) as {
          role?: "citizen" | "admin";
          redirectTo?: string;
        } | null;

        const resolvedRole = response?.role;
        const destination =
          nextPath ||
          response?.redirectTo ||
          (resolvedRole === "admin"
            ? "/admin"
            : resolvedRole === "citizen"
              ? "/dashboard"
              : null);

        if (!destination) {
          throw new Error(
            "Your account signed in, but no workspace could be resolved. Check the account role configuration."
          );
        }

        toast.success("Signed in successfully", {
          description: "Your secure workspace is ready.",
        });
        window.location.replace(destination);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Unable to sign in right now.",
          {
            description: "Double-check your email, password, Firebase setup, and role assignment.",
          }
        );
      }
    });
  };

  return (
      <Card className="surface-panel min-w-0 border-white/50 bg-white/82">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full border border-primary/15 bg-white/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            Secure access
          </span>
          {nextPath ? (
            <span className="rounded-full bg-accent px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-foreground">
              Secure redirect ready
            </span>
          ) : null}
        </div>
        <CardTitle className="font-heading text-2xl font-bold tracking-tight text-primary">
          Sign in securely
        </CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">
          Use your Firebase account to enter the citizen or admin workspace with a server-issued session cookie and Mongo-backed application data.
        </p>
        {nextPath ? (
          <p className="text-xs leading-6 text-muted-foreground">
            After sign-in, you will continue to <span className="font-semibold text-foreground">{nextPath}</span>.
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-6">
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(handleLogin)}
        >
          <div className="grid gap-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@gov.my"
              autoComplete="email"
              className="h-12 rounded-2xl border-white/40 bg-white/80"
              {...form.register("email")}
            />
            <FormMessage message={form.formState.errors.email?.message} />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              id="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              {...form.register("password")}
            />
            <FormMessage message={form.formState.errors.password?.message} />
          </div>

          <Button
            type="submit"
            size="lg"
            className="h-12 w-full rounded-2xl"
            disabled={!form.formState.isValid || isPending}
          >
            {isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
            Sign in
          </Button>
        </form>

        <div className="rounded-[24px] border border-border/60 bg-muted/80 p-4 text-sm leading-6 text-muted-foreground">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <LockKeyhole className="size-4 text-primary" />
            Firebase sign-in
          </div>
          <p className="mt-2">
            Identity comes from Firebase Auth, while role-aware profile and case data are read from MongoDB. Admin access is never self-selected.
          </p>
          {missingClientVars.length ? (
            <FormMessage
              message={`Missing client env vars: ${missingClientVars.join(", ")}`}
            />
          ) : null}
        </div>

        <p className="text-sm text-muted-foreground">
          New to MyGOV Agent 2.0?{" "}
          <Link
            href="/register"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Create a citizen account
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
