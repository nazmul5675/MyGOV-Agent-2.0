"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, LoaderCircle, SearchCheck, ShieldAlert, XCircle } from "lucide-react";
import { toast } from "sonner";

import { FileStatusBadge } from "@/components/common/file-status-badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateFileReviewAction } from "@/lib/actions/cases";
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

function getFileTone(status: EvidenceFile["status"]) {
  if (status === "accepted") return "border-emerald-200 bg-emerald-50/70";
  if (status === "needs_replacement" || status === "rejected") {
    return "border-rose-200 bg-rose-50/70";
  }
  if (status === "under_review") return "border-sky-200 bg-sky-50/70";
  return "border-border/60 bg-muted/45";
}

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
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Move through files quickly, keep notes concise, and leave each file in a clear review state.
          </p>
        </div>
        <div className="self-start rounded-full bg-muted px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {files.length} file reviews
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {files.map((file) => (
          <article
            key={file.id}
            className={`rounded-[22px] border p-4 transition-colors ${getFileTone(file.status)}`}
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="line-clamp-2 break-all font-semibold text-foreground">{file.name}</p>
                  <FileStatusBadge status={file.status} />
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  <span>{file.kind.replace("_", " ")}</span>
                  <span>{file.sizeLabel}</span>
                  <span>{file.category || "Uncategorized"}</span>
                </div>
              </div>
              {file.downloadUrl ? (
                <a
                  href={file.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
                >
                  Open preview
                </a>
              ) : null}
            </div>

            <Textarea
              rows={2}
              value={notes[file.id] ?? file.notes ?? ""}
              onChange={(event) =>
                setNotes((current) => ({ ...current, [file.id]: event.target.value }))
              }
              className="mt-3 rounded-[18px] bg-white/90"
              placeholder="Add a short review note or citizen-facing follow-up."
            />

            <div className="mt-3 flex flex-wrap gap-2">
              {reviewActions.map((action) => (
                <Button
                  key={action.value}
                  type="button"
                  variant={action.value === "accepted" ? "default" : "outline"}
                  className="h-10 justify-start rounded-full px-4 text-left whitespace-normal"
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
