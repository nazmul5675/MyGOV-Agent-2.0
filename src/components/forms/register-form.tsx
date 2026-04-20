"use client";

import Link from "next/link";
import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, ShieldCheck } from "lucide-react";
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
import { registerSchema } from "@/lib/validation/auth";

type RegisterValues = z.infer<typeof registerSchema>;

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
    throw new Error(body?.error || "Unable to create account.");
  }

  return response.json().catch(() => null);
}

export function RegisterForm() {
  const [isPending, startTransition] = useTransition();
  const missingClientVars = getMissingFirebaseClientVars();
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (values: RegisterValues) => {
    startTransition(async () => {
      try {
        let result:
          | {
              ok?: boolean;
              role?: "citizen" | "admin";
              profileCreated?: boolean;
              warning?: string;
            }
          | null = null;

        if (isPrototypeMode()) {
          result = (await postJson("/api/auth/register", values)) as {
            ok?: boolean;
            role?: "citizen" | "admin";
            profileCreated?: boolean;
            warning?: string;
          } | null;
        } else {
          const auth = firebaseAuth;

          if (!auth) {
            throw new Error(
              `Firebase client config is incomplete. Missing: ${missingClientVars.join(", ")}`
            );
          }

          const { createUserWithEmailAndPassword, deleteUser, signOut } =
            await import("firebase/auth");
          let createdUser:
            | Awaited<ReturnType<typeof createUserWithEmailAndPassword>>
            | undefined;

          try {
            createdUser = await createUserWithEmailAndPassword(
              auth,
              values.email,
              values.password
            );

            const idToken = await createdUser.user.getIdToken(true);
            result = (await postJson("/api/auth/register", {
              idToken,
              fullName: values.fullName,
            })) as {
              ok?: boolean;
              role?: "citizen" | "admin";
              profileCreated?: boolean;
              warning?: string;
            } | null;
          } catch (error) {
            if (createdUser?.user) {
              await deleteUser(createdUser.user).catch(() => undefined);
            }
            await signOut(auth).catch(() => undefined);
            throw error;
          }
        }

        if (result?.profileCreated === false) {
          toast.warning("Account created, but profile sync is pending", {
            description:
              result.warning ||
              "The account was created, but profile setup still needs attention.",
          });
        } else {
          toast.success("Account created", {
            description: "Your citizen workspace is ready. You can complete your profile next.",
          });
        }
        window.location.assign("/profile?welcome=1");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to create your account.");
      }
    });
  };

  return (
    <Card className="surface-panel border-white/50 bg-white/82">
      <CardHeader className="space-y-2">
        <AppModeBadge />
        <CardTitle className="font-heading text-2xl font-bold tracking-tight text-primary">
          Create your citizen account
        </CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">
          Start with the essentials. We collect your full name now, then let you
          complete profile details next so sign-up stays friendly and fast.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              placeholder="Nur Aisyah Rahman"
              autoComplete="name"
              className="h-12 rounded-2xl border-white/40 bg-white/80"
              {...form.register("fullName")}
            />
            <FormMessage message={form.formState.errors.fullName?.message} />
          </div>

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
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              placeholder="Create a password"
              autoComplete="new-password"
              {...form.register("password")}
            />
            <FormMessage message={form.formState.errors.password?.message} />
            <FormMessage
              tone="muted"
              message="Use at least 8 characters, including one letter and one number."
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <PasswordInput
              id="confirmPassword"
              placeholder="Re-enter your password"
              autoComplete="new-password"
              {...form.register("confirmPassword")}
            />
            <FormMessage message={form.formState.errors.confirmPassword?.message} />
          </div>

          <Button
            type="submit"
            size="lg"
            className="h-12 w-full rounded-2xl"
            disabled={!form.formState.isValid || isPending}
          >
            {isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
            Create account
          </Button>
        </form>

        <div className="rounded-[24px] border border-border/60 bg-muted/80 p-4 text-sm leading-6 text-muted-foreground">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <ShieldCheck className="size-4 text-primary" />
            {isPrototypeMode() ? "Prototype profile setup" : "Profile data stays in Firestore"}
          </div>
          <p className="mt-2">
            {isPrototypeMode()
              ? "In prototype mode, registration creates a seeded citizen account in the in-memory demo store so the dashboard flow stays immediate and stable."
              : "We store `fullName`, `dateOfBirth`, `phoneNumber`, and `addressText` in the Firestore profile document. Firebase Auth is used only for authentication credentials."}
          </p>
        </div>

        <p className="text-sm text-muted-foreground">
          Already registered?{" "}
          <Link
            href="/login"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Sign in here
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
