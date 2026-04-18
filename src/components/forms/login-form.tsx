"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInWithEmailAndPassword } from "firebase/auth";
import {
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { firebaseAuth } from "@/lib/firebase/client";
import { getMissingFirebaseClientVars } from "@/lib/firebase/config";
import { loginSchema } from "@/lib/validation/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type RoleTab = "citizen" | "admin";
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [role, setRole] = useState<RoleTab>("citizen");
  const [isPending, startTransition] = useTransition();
  const missingClientVars = getMissingFirebaseClientVars();
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const nextPath = useMemo(() => searchParams.get("next"), [searchParams]);

  const handleFirebaseLogin = async (values: LoginValues) => {
    const auth = firebaseAuth;

    if (!auth) {
      toast.error("Firebase client config is incomplete.", {
        description: missingClientVars.join(", "),
      });
      return;
    }

    startTransition(async () => {
      try {
        const credential = await signInWithEmailAndPassword(
          auth,
          values.email,
          values.password
        );
        const idToken = await credential.user.getIdToken(true);
        const response = (await postJson("/api/auth/login", {
          idToken,
        })) as { role?: RoleTab } | null;
        const resolvedRole = response?.role === "admin" ? "admin" : "citizen";

        toast.success("Signed in successfully");
        router.push(nextPath || (resolvedRole === "admin" ? "/admin" : "/dashboard"));
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to sign in");
      }
    });
  };

  return (
    <Card className="surface-panel border-white/50 bg-white/82">
      <CardHeader className="space-y-2">
        <CardTitle className="font-heading text-2xl font-bold tracking-tight text-primary">
          Sign in securely
        </CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">
          Use Firebase email and password authentication with a server-issued
          session cookie.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={role} onValueChange={(value) => setRole(value as RoleTab)}>
          <TabsList className="grid w-full grid-cols-2 rounded-full bg-muted p-1">
            <TabsTrigger value="citizen" className="rounded-full">
              <UserRound className="mr-2 size-4" />
              Citizen
            </TabsTrigger>
            <TabsTrigger value="admin" className="rounded-full">
              <ShieldCheck className="mr-2 size-4" />
              Admin
            </TabsTrigger>
          </TabsList>
          <TabsContent value={role} className="mt-6 space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@gov.my"
                className="h-12 rounded-2xl border-white/40 bg-white/80"
                {...form.register("email")}
              />
              <p className="text-sm text-destructive">
                {form.formState.errors.email?.message}
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Password"
                className="h-12 rounded-2xl border-white/40 bg-white/80"
                {...form.register("password")}
              />
              <p className="text-sm text-destructive">
                {form.formState.errors.password?.message}
              </p>
            </div>
          </TabsContent>
        </Tabs>
        <Button
          size="lg"
          className="h-12 w-full rounded-2xl"
          disabled={isPending}
          onClick={form.handleSubmit(handleFirebaseLogin)}
        >
          {isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
          Sign in with Firebase
        </Button>
        <div className="rounded-[24px] border border-border/60 bg-muted/80 p-4 text-sm leading-6 text-muted-foreground">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <LockKeyhole className="size-4 text-primary" />
            Firebase-only login
          </div>
          <p className="mt-2">
            Role access comes from Firebase custom claims or the Firestore
            `users/{'{uid}'}.role` field.
          </p>
          {missingClientVars.length ? (
            <p className="mt-3 text-xs leading-6 text-destructive">
              Missing client env vars: {missingClientVars.join(", ")}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
