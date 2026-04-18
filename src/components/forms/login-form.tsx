"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { LoaderCircle, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";

import { firebaseAuth } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type RoleTab = "citizen" | "admin";

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
  const [email, setEmail] = useState("citizen@demo.mygov.my");
  const [password, setPassword] = useState("Demo123!");
  const [role, setRole] = useState<RoleTab>("citizen");
  const [isPending, startTransition] = useTransition();

  const nextPath = useMemo(() => searchParams.get("next"), [searchParams]);

  const handleDemoLogin = async (selectedRole: RoleTab) => {
    startTransition(async () => {
      try {
        await postJson("/api/auth/demo-login", {
          role: selectedRole,
          email:
            selectedRole === "admin"
              ? "admin@demo.mygov.my"
              : "citizen@demo.mygov.my",
        });
        toast.success(`${selectedRole === "admin" ? "Admin" : "Citizen"} demo ready`);
        router.push(nextPath || (selectedRole === "admin" ? "/admin" : "/dashboard"));
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to start demo");
      }
    });
  };

  const handleFirebaseLogin = async () => {
    const auth = firebaseAuth;

    if (!auth) {
      toast.message("Firebase is not configured yet. Use the demo sign-in for now.");
      return;
    }

    startTransition(async () => {
      try {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        const idToken = await credential.user.getIdToken(true);
        await postJson("/api/auth/login", { idToken });
        toast.success("Signed in successfully");
        router.push(nextPath || "/dashboard");
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
          Use Firebase email/password when configured, or start with a protected demo role.
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
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@gov.my"
                className="h-12 rounded-2xl border-white/40 bg-white/80"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                className="h-12 rounded-2xl border-white/40 bg-white/80"
              />
            </div>
          </TabsContent>
        </Tabs>
        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            size="lg"
            className="h-12 rounded-2xl"
            disabled={isPending}
            onClick={handleFirebaseLogin}
          >
            {isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
            Sign in with Firebase
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-12 rounded-2xl"
            disabled={isPending}
            onClick={() => handleDemoLogin(role)}
          >
            {isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
            Start demo as {role}
          </Button>
        </div>
        <div className="rounded-[24px] bg-muted/80 p-4 text-sm leading-6 text-muted-foreground">
          Demo credentials scaffold:
          <br />
          `citizen@demo.mygov.my`
          <br />
          `admin@demo.mygov.my`
        </div>
      </CardContent>
    </Card>
  );
}
