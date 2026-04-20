"use client";

import Link from "next/link";
import { useMemo, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, LoaderCircle, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { FormMessage } from "@/components/auth/form-message";
import { AppModeBadge } from "@/components/common/app-mode-badge";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isPrototypeMode } from "@/lib/config/app-mode";
import { firebaseAuth } from "@/lib/firebase/client";
import { getMissingFirebaseClientVars } from "@/lib/firebase/config";
import { loginSchema } from "@/lib/validation/auth";

type LoginValues = z.infer<typeof loginSchema>;

const demoAccounts = [
  {
    role: "Citizen",
    icon: UserRound,
    email: "aisyah.rahman@mygov-demo.my",
    password: "DemoCitizen123",
  },
  {
    role: "Admin",
    icon: ShieldCheck,
    email: "amir.fauzi@mygov-demo.my",
    password: "DemoAdmin123",
  },
] as const;

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

  const fillDemoCredentials = (email: string, password: string) => {
    form.setValue("email", email, { shouldDirty: true, shouldValidate: true });
    form.setValue("password", password, { shouldDirty: true, shouldValidate: true });
    toast.success("Demo credentials loaded", {
      description: "You can sign in immediately with the seeded account.",
    });
  };

  const copyDemoCredentials = async (email: string, password: string) => {
    try {
      await navigator.clipboard.writeText(`Email: ${email}\nPassword: ${password}`);
      toast.success("Demo credentials copied", {
        description: "Paste them into the login form for the live demo.",
      });
    } catch {
      toast.error("Unable to copy credentials right now.");
    }
  };

  const handleLogin = async (values: LoginValues) => {
    startTransition(async () => {
      try {
        let response:
          | {
              role?: "citizen" | "admin";
              redirectTo?: string;
            }
          | null = null;

        if (isPrototypeMode()) {
          response = (await postJson("/api/auth/login", {
            email: values.email,
            password: values.password,
          })) as {
            role?: "citizen" | "admin";
            redirectTo?: string;
          } | null;
        } else {
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
          response = (await postJson("/api/auth/login", {
            idToken,
          })) as {
            role?: "citizen" | "admin";
            redirectTo?: string;
          } | null;
        }

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
            description:
              isPrototypeMode()
                ? "Use one of the seeded demo accounts or create a new citizen account."
                : "Double-check your email, password, and Firebase account role setup.",
          }
        );
      }
    });
  };

  return (
    <Card className="surface-panel min-w-0 border-white/50 bg-white/82">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <AppModeBadge />
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
          {isPrototypeMode()
            ? "Use a seeded demo account or a newly registered citizen account to enter the workspace instantly."
            : "Use your Firebase account to enter the citizen or admin workspace with a server-issued session cookie."}
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
            {isPrototypeMode() ? "Prototype demo login" : "Firebase-only login"}
          </div>
          <p className="mt-2">
            {isPrototypeMode()
              ? "Use the seeded demo credentials to enter the citizen or admin workspace instantly with a stable prototype session."
              : "Role access comes from Firebase custom claims or the Firestore `users/{uid}.role` field. Admin access is never self-selected."}
          </p>
          {missingClientVars.length && !isPrototypeMode() ? (
            <FormMessage
              message={`Missing client env vars: ${missingClientVars.join(", ")}`}
            />
          ) : null}
        </div>

        {isPrototypeMode() ? (
          <div className="rounded-[28px] border border-primary/12 bg-white/80 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Demo credentials</p>
                <p className="text-xs leading-6 text-muted-foreground">
                  Use these seeded accounts so judges can copy, paste, and enter the workspace without setup friction.
                </p>
              </div>
              <span className="rounded-full bg-accent px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-foreground">
                Ready
              </span>
            </div>

            <div className="mt-4 grid gap-3">
              {demoAccounts.map((account) => {
                const Icon = account.icon;

                return (
                  <div
                    key={account.email}
                    className="rounded-[24px] border border-border/60 bg-muted/55 p-4"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Icon className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground">{account.role}</p>
                          <p className="mt-1 break-all text-sm text-muted-foreground">{account.email}</p>
                          <p className="text-sm text-muted-foreground">{account.password}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 sm:justify-end">
                        <button
                          type="button"
                          onClick={() => fillDemoCredentials(account.email, account.password)}
                          className="rounded-full bg-primary px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary-foreground transition-transform hover:-translate-y-0.5"
                        >
                          Use
                        </button>
                        <button
                          type="button"
                          onClick={() => void copyDemoCredentials(account.email, account.password)}
                          className="rounded-full border border-border/70 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-foreground transition-transform hover:-translate-y-0.5"
                          aria-label={`Copy ${account.role} demo credentials`}
                        >
                          <Copy className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

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
