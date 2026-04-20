"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, LoaderCircle, SearchCheck, ShieldAlert, XCircle } from "lucide-react";
import { toast } from "sonner";

import { updateFileReviewAction } from "@/lib/actions/cases";
import { FileStatusBadge } from "@/components/common/file-status-badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { EvidenceFile } from "@/lib/types";

const reviewActions = [
  {
    label: "Mark under review",
    value: "under_review",
    icon: SearchCheck,
  },
  {
    label: "Accept file",
    value: "accepted",
    icon: CheckCircle2,
  },
  {
    label: "Needs better copy",
    value: "needs_replacement",
    icon: ShieldAlert,
  },
  {
    label: "Reject file",
    value: "rejected",
    icon: XCircle,
  },
] as const;

export function EvidenceReviewPanel({
  caseId,
  files,
}: {
  caseId: string;
  files: EvidenceFile[];
}) {
  const router = useRouter();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const runReviewAction = (
    fileId: string,
    status: (typeof reviewActions)[number]["value"]
  ) => {
    const note = notes[fileId] || "";
    setActiveKey(`${fileId}:${status}`);
    startTransition(async () => {
      try {
        await updateFileReviewAction(caseId, {
          fileId,
          status,
          note,
        });
        router.refresh();
        toast.success("File review updated", {
          description: "The evidence record and case timeline are now in sync.",
        });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to update file review.");
      } finally {
        setActiveKey(null);
      }
    });
  };

  if (!files.length) return null;

  return (
    <section className="surface-panel p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
            Evidence review tools
          </p>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            Review files one by one, record a note for the citizen, and update the live case timeline from the same control surface.
          </p>
        </div>
        <div className="self-start rounded-full bg-muted px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {files.length} file reviews
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {files.map((file) => (
          <article key={file.id} className="rounded-[24px] bg-muted/70 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="break-all font-semibold text-foreground">{file.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {file.kind.replace("_", " ")} · {file.sizeLabel}
                </p>
              </div>
              <FileStatusBadge status={file.status} />
            </div>

            <Textarea
              rows={3}
              value={notes[file.id] ?? file.notes ?? ""}
              onChange={(event) =>
                setNotes((current) => ({ ...current, [file.id]: event.target.value }))
              }
              className="mt-4 rounded-[22px] bg-white/85"
              placeholder="Add a review note or citizen-facing follow-up."
            />

            <div className="mt-4 grid gap-2 lg:grid-cols-2">
              {reviewActions.map((action) => (
                <Button
                  key={action.value}
                  type="button"
                  variant={action.value === "accepted" ? "default" : "outline"}
                  className="h-auto justify-start rounded-2xl py-3 text-left whitespace-normal"
                  disabled={isPending}
                  onClick={() => runReviewAction(file.id, action.value)}
                >
                  {isPending && activeKey === `${file.id}:${action.value}` ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <action.icon className="size-4" />
                  )}
                  {action.label}
                </Button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
