"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, MailCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FormMessage } from "@/components/auth/form-message";
import { AppModeBadge } from "@/components/common/app-mode-badge";
import { SuccessBlock } from "@/components/auth/success-block";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isPrototypeMode } from "@/lib/config/app-mode";
import { firebaseAuth } from "@/lib/firebase/client";
import { forgotPasswordSchema } from "@/lib/validation/auth";

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [emailSentTo, setEmailSentTo] = useState<string | null>(null);
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (values: ForgotPasswordValues) => {
    startTransition(async () => {
      try {
        if (isPrototypeMode()) {
          setEmailSentTo(values.email);
          return;
        }

        const auth = firebaseAuth;

        if (!auth) {
          throw new Error("Firebase client config is incomplete for password reset.");
        }

        const { sendPasswordResetEmail } = await import("firebase/auth");
        await sendPasswordResetEmail(auth, values.email);
        setEmailSentTo(values.email);
      } catch (error) {
        form.setError("email", {
          type: "manual",
          message:
            error instanceof Error
              ? error.message
              : "Unable to send reset email right now.",
        });
      }
    });
  };

  return (
    <Card className="surface-panel min-w-0 border-white/50 bg-white/82">
      <CardHeader className="space-y-2">
        <AppModeBadge />
        <CardTitle className="font-heading text-2xl font-bold tracking-tight text-primary">
          Reset your password
        </CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">
          {isPrototypeMode()
            ? "Enter the email address linked to your demo account and we will simulate a reset handoff for the presentation flow."
            : "Enter the email address linked to your account and we will send a secure password reset link."}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {emailSentTo ? (
          <SuccessBlock
            title="Reset email sent"
            description={`A password reset link was sent to ${emailSentTo}. Check your inbox and spam folder, then return here to sign in.`}
            action={
              <Link
                href="/login"
                className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
              >
                Back to login
              </Link>
            }
          />
        ) : null}

        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
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

          <Button
            type="submit"
            size="lg"
            className="h-12 w-full rounded-2xl"
            disabled={!form.formState.isValid || isPending}
          >
            {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <MailCheck className="size-4" />}
            Send reset email
          </Button>
        </form>

        <p className="text-sm text-muted-foreground">
          Remembered your password?{" "}
          <Link
            href="/login"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Return to sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
