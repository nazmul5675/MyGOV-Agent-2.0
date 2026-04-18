"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, LoaderCircle, Route, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { applyAdminAction } from "@/lib/actions/cases";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

const actions = [
  {
    label: "Approve",
    value: "approve",
    tone: "default" as const,
    icon: ShieldCheck,
    help: "Move this case into the formal review track.",
  },
  {
    label: "Reject",
    value: "reject",
    tone: "outline" as const,
    icon: AlertTriangle,
    help: "Close the case and explain why it cannot proceed.",
  },
  {
    label: "Request more documents",
    value: "request_more_documents",
    tone: "outline" as const,
    icon: AlertTriangle,
    help: "Ask the citizen for one clear follow-up item.",
  },
  {
    label: "Route to specialist desk",
    value: "route",
    tone: "outline" as const,
    icon: Route,
    help: "Send the case to the right desk with routing context.",
  },
  {
    label: "Mark in progress",
    value: "mark_in_progress",
    tone: "outline" as const,
    icon: ShieldCheck,
    help: "Signal that work is underway on this case.",
  },
  {
    label: "Resolve",
    value: "resolve",
    tone: "default" as const,
    icon: CheckCircle2,
    help: "Mark the case complete and notify the citizen.",
  },
] as const;

export function AdminReviewPanel({
  caseId,
  initialNote,
}: {
  caseId: string;
  initialNote?: string;
}) {
  const router = useRouter();
  const [note, setNote] = useState(
    initialNote ||
      "Routing looks correct. A wider road photo will improve severity confidence before dispatch."
  );
  const [isPending, startTransition] = useTransition();
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const runAction = (action: (typeof actions)[number]["value"] | "internal_note") => {
    setActiveAction(action);
    startTransition(async () => {
      try {
        await applyAdminAction(caseId, {
          action,
          note,
        });
        toast.success("Case updated", {
          description: "The case record and timeline were updated successfully.",
        });
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to update case");
      } finally {
        setActiveAction(null);
      }
    });
  };

  return (
    <Card className="surface-panel top-6 xl:sticky">
      <CardHeader>
        <CardTitle className="font-heading text-xl font-bold tracking-tight text-primary">
          Decision center
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-[22px] bg-muted/80 p-4 text-sm leading-6 text-muted-foreground">
          Actions update Firestore, append case events, and keep citizen/admin
          views in sync.
        </div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Notes are required for rejections, routing, and document requests.
        </p>
        <Textarea
          rows={6}
          className="rounded-3xl bg-white/70"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
        <Button
          variant="outline"
          className="w-full justify-start"
          disabled={isPending}
          onClick={() => runAction("internal_note")}
        >
          {isPending && activeAction === "internal_note" ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : null}
          Save internal note
        </Button>
        <div className="grid gap-3">
          {actions.map((action) => (
            <div key={action.value} className="space-y-2 rounded-[22px] bg-muted/60 p-3">
              <Button
                variant={action.tone}
                size="default"
                className="w-full justify-start rounded-2xl"
                disabled={isPending}
                onClick={() => runAction(action.value)}
              >
                {isPending && activeAction === action.value ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <action.icon className="size-4" />
                )}
                {action.label}
              </Button>
              <p className="text-xs leading-6 text-muted-foreground">{action.help}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
