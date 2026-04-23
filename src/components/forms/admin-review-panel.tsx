"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  LoaderCircle,
  Route,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { applyAdminAction } from "@/lib/actions/cases";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { CaseStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const actions = [
  {
    label: "Mark reviewing",
    value: "approve",
    group: "start",
    tone: "default" as const,
    icon: ShieldCheck,
    help: "Move this case into the formal review track.",
  },
  {
    label: "Reject",
    value: "reject",
    group: "close",
    tone: "outline" as const,
    icon: AlertTriangle,
    help: "Close the case and explain why it cannot proceed.",
  },
  {
    label: "Request more documents",
    value: "request_more_documents",
    group: "citizen",
    tone: "outline" as const,
    icon: AlertTriangle,
    help: "Ask the citizen for one clear follow-up item.",
  },
  {
    label: "Route or escalate",
    value: "route",
    group: "start",
    tone: "outline" as const,
    icon: Route,
    help: "Send the case to the right desk with routing context.",
  },
  {
    label: "Mark in progress",
    value: "mark_in_progress",
    group: "start",
    tone: "outline" as const,
    icon: ShieldCheck,
    help: "Signal that work is underway on this case.",
  },
  {
    label: "Resolve",
    value: "resolve",
    group: "close",
    tone: "default" as const,
    icon: CheckCircle2,
    help: "Mark the case complete and notify the citizen.",
  },
] as const;

type ActionValue = (typeof actions)[number]["value"];

function getDecisionPlan(input: {
  status: CaseStatus;
  missingDocumentsCount: number;
  pendingFiles: number;
  acceptedFiles: number;
}) {
  if (input.status === "submitted") {
    return {
      recommended: "approve" as ActionValue,
      reason: "This case is still waiting for first review.",
      supporting: ["route", "request_more_documents"] as ActionValue[],
      additional: ["mark_in_progress", "reject", "resolve"] as ActionValue[],
    };
  }

  if (input.status === "need_more_docs" || input.missingDocumentsCount > 0) {
    return {
      recommended: "request_more_documents" as ActionValue,
      reason: "Missing proof is still blocking a clean review decision.",
      supporting: input.acceptedFiles > 0
        ? (["approve", "route"] as ActionValue[])
        : (["approve", "mark_in_progress"] as ActionValue[]),
      additional: ["reject", "resolve"] as ActionValue[],
    };
  }

  if (input.status === "reviewing") {
    return {
      recommended:
        input.pendingFiles > 0 ? ("mark_in_progress" as ActionValue) : ("route" as ActionValue),
      reason:
        input.pendingFiles > 0
          ? "The case is in active review and needs a clear internal move next."
          : "The review is clear enough to route or escalate to the next desk.",
      supporting: ["request_more_documents", "route", "approve"] as ActionValue[],
      additional: ["resolve", "reject"] as ActionValue[],
    };
  }

  if (input.status === "routed") {
    return {
      recommended: "mark_in_progress" as ActionValue,
      reason: "Routing is complete. The next step is active work.",
      supporting: ["request_more_documents", "resolve"] as ActionValue[],
      additional: ["reject", "route"] as ActionValue[],
    };
  }

  if (input.status === "in_progress") {
    return {
      recommended: "resolve" as ActionValue,
      reason: "This case is already underway and should be closed when the outcome is ready.",
      supporting: ["request_more_documents", "route"] as ActionValue[],
      additional: ["reject", "mark_in_progress", "approve"] as ActionValue[],
    };
  }

  return {
    recommended: "resolve" as ActionValue,
    reason: "Use the final outcome that matches the current review state.",
    supporting: ["request_more_documents", "route"] as ActionValue[],
    additional: ["reject", "mark_in_progress", "approve"] as ActionValue[],
  };
}

export function AdminReviewPanel({
  caseId,
  initialNote,
  status,
  missingDocumentsCount,
  pendingFiles,
  acceptedFiles,
}: {
  caseId: string;
  initialNote?: string;
  status: CaseStatus;
  missingDocumentsCount: number;
  pendingFiles: number;
  acceptedFiles: number;
}) {
  const router = useRouter();
  const [note, setNote] = useState(
    initialNote ||
      "Review the file quality, confirm the category, and leave a clear next step for the citizen if more information is needed."
  );
  const [isPending, startTransition] = useTransition();
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const decisionPlan = getDecisionPlan({
    status,
    missingDocumentsCount,
    pendingFiles,
    acceptedFiles,
  });
  const recommendedAction = actions.find((action) => action.value === decisionPlan.recommended);
  const supportingActions = decisionPlan.supporting
    .map((value) => actions.find((action) => action.value === value))
    .filter((action): action is (typeof actions)[number] => Boolean(action));
  const additionalActions = decisionPlan.additional
    .map((value) => actions.find((action) => action.value === value))
    .filter((action): action is (typeof actions)[number] => Boolean(action));

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
      <CardHeader className="pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
          Decision center
        </p>
        <CardTitle className="font-heading text-xl font-bold tracking-tight text-primary">
          Take the next decision without scanning every option
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-[22px] bg-muted/80 p-4 text-sm leading-6 text-muted-foreground">
          Save a short operational note first, then use the recommended action for this case state.
        </div>
        <Textarea
          rows={4}
          className="rounded-3xl bg-white/70"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Leave the next operational step, decision reason, or clear citizen follow-up."
        />
        <Button
          variant="outline"
          className="h-11 w-full justify-start rounded-2xl px-4 text-left whitespace-normal"
          disabled={isPending}
          onClick={() => runAction("internal_note")}
        >
          {isPending && activeAction === "internal_note" ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : null}
          Save note only
        </Button>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Notes are required for rejection, routing, and document requests.
        </p>
        {recommendedAction ? (
          <section className="rounded-[22px] border border-primary/15 bg-primary/[0.04] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/70">
                  Recommended next action
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {decisionPlan.reason}
                </p>
              </div>
              <div className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                {status.replaceAll("_", " ")}
              </div>
            </div>
            <div className="mt-4 rounded-[20px] bg-white/80 p-3">
              <Button
                variant={
                  recommendedAction.value === "reject"
                    ? "destructive"
                    : recommendedAction.value === "resolve" || recommendedAction.value === "approve"
                      ? "default"
                      : recommendedAction.tone
                }
                size="default"
                className="h-11 w-full justify-start rounded-2xl px-4 text-left whitespace-normal"
                disabled={isPending}
                onClick={() => runAction(recommendedAction.value)}
              >
                {isPending && activeAction === recommendedAction.value ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <recommendedAction.icon className="size-4" />
                )}
                {recommendedAction.label}
              </Button>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                {recommendedAction.help}
              </p>
            </div>
          </section>
        ) : null}
        {supportingActions.length ? (
          <section className="rounded-[22px] bg-muted/60 p-3.5">
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/70">
                Also relevant here
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Keep these close if the recommended action is not the final fit.
              </p>
            </div>
            <div className="grid gap-3">
              {supportingActions.map((action) => (
                <div key={action.value} className="space-y-2 rounded-[20px] bg-white/75 p-3">
                  <Button
                    variant={
                      action.value === "reject"
                        ? "destructive"
                        : action.value === "resolve" || action.value === "approve"
                          ? "default"
                          : action.tone
                    }
                    size="default"
                    className="h-11 w-full justify-start rounded-2xl px-4 text-left whitespace-normal"
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
          </section>
        ) : null}
        {additionalActions.length ? (
          <details className="rounded-[22px] bg-muted/50 p-3.5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-foreground">
              <span>Other actions</span>
              <ChevronDown className="size-4 text-muted-foreground transition-transform details-open:rotate-180" />
            </summary>
            <div className="mt-3 grid gap-3">
              {additionalActions.map((action) => (
                <div key={action.value} className="space-y-2 rounded-[20px] bg-white/75 p-3">
                  <Button
                    variant={
                      action.value === "reject"
                        ? "destructive"
                        : action.value === "resolve" || action.value === "approve"
                          ? "default"
                          : action.tone
                    }
                    size="default"
                    className={cn(
                      "h-11 w-full justify-start rounded-2xl px-4 text-left whitespace-normal",
                      action.value === "reject" ? "border-destructive/20" : ""
                    )}
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
          </details>
        ) : null}
        {(missingDocumentsCount > 0 || pendingFiles > 0 || acceptedFiles > 0) ? (
          <div className="rounded-[22px] bg-white/70 p-4 text-sm leading-6 text-muted-foreground">
            Case signals:
            {missingDocumentsCount > 0
              ? ` ${missingDocumentsCount} missing document item${missingDocumentsCount === 1 ? "" : "s"}.`
              : " no missing document flags."}
            {pendingFiles > 0
              ? ` ${pendingFiles} file${pendingFiles === 1 ? "" : "s"} still need review.`
              : " No pending file review."}
            {acceptedFiles > 0
              ? ` ${acceptedFiles} file${acceptedFiles === 1 ? "" : "s"} already accepted.`
              : " No accepted files yet."}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
