"use client";

import { useMemo, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { FormMessage } from "@/components/auth/form-message";
import { SuccessBlock } from "@/components/auth/success-block";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { profileBasicsSchema } from "@/lib/validation/profile";

type ProfileBasicsValues = z.infer<typeof profileBasicsSchema>;

async function patchJson(path: string, payload: unknown) {
  const response = await fetch(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(body?.error || "Unable to update profile.");
  }

  return response.json().catch(() => null);
}

function computeAge(dateOfBirth?: string) {
  if (!dateOfBirth) return null;
  const birthDate = new Date(dateOfBirth);
  if (Number.isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthOffset = today.getMonth() - birthDate.getMonth();
  if (monthOffset < 0 || (monthOffset === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return age;
}

export function ProfileBasicsForm({
  defaultValues,
  showWelcome,
}: {
  defaultValues: ProfileBasicsValues;
  showWelcome?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<ProfileBasicsValues>({
    resolver: zodResolver(profileBasicsSchema),
    mode: "onChange",
    defaultValues,
  });

  const watchedDateOfBirth = useWatch({
    control: form.control,
    name: "dateOfBirth",
  });
  const liveAge = useMemo(() => computeAge(watchedDateOfBirth), [watchedDateOfBirth]);

  const onSubmit = (values: ProfileBasicsValues) => {
    startTransition(async () => {
      try {
        await patchJson("/api/profile", values);
        toast.success("Profile updated", {
          description: "Your profile details are saved to your live workspace.",
        });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to update profile.");
      }
    });
  };

  return (
    <Card className="surface-panel min-w-0">
      <CardHeader className="space-y-2">
        <CardTitle className="font-heading text-2xl font-bold tracking-tight text-primary">
          Profile basics
        </CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">
          We store `dateOfBirth` instead of raw age so your age can be derived
          when needed without becoming stale.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {showWelcome ? (
          <SuccessBlock
            title="Your account is ready"
            description="You can head straight to the dashboard, or complete a few profile details now for smoother case handling later."
          />
        ) : null}

        <form className="grid gap-5 md:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              className="h-12 rounded-2xl bg-white/70"
              {...form.register("fullName")}
            />
            <FormMessage message={form.formState.errors.fullName?.message} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="dateOfBirth">Date of birth</Label>
            <Input
              id="dateOfBirth"
              type="date"
              className="h-12 rounded-2xl bg-white/70"
              {...form.register("dateOfBirth")}
            />
            <FormMessage
              tone="muted"
              message={liveAge !== null ? `Computed age: ${liveAge}` : "Optional, but useful for age-aware assistance and service guidance."}
            />
            <FormMessage message={form.formState.errors.dateOfBirth?.message} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phoneNumber">Phone number</Label>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="+60 12-345 6789"
              className="h-12 rounded-2xl bg-white/70"
              {...form.register("phoneNumber")}
            />
            <FormMessage
              tone="muted"
              message="Optional. Helpful for follow-up calls or reminders."
            />
            <FormMessage message={form.formState.errors.phoneNumber?.message} />
          </div>

          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="addressText">Location or address note</Label>
            <Input
              id="addressText"
              placeholder="Petaling Jaya, Selangor"
              className="h-12 rounded-2xl bg-white/70"
              {...form.register("addressText")}
            />
            <FormMessage
              tone="muted"
              message="Optional. This remains lightweight so onboarding stays friendly."
            />
            <FormMessage message={form.formState.errors.addressText?.message} />
          </div>

          <div className="md:col-span-2">
            <Button
              type="submit"
              size="lg"
              className="h-12 rounded-2xl px-6"
              disabled={!form.formState.isValid || isPending}
            >
              {isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
              Save profile details
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
