import { FileCheck2, FileStack, FileWarning, UploadCloud } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { FileStatusBadge } from "@/components/common/file-status-badge";
import type { EvidenceFile } from "@/lib/types";
import { cn } from "@/lib/utils";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function EvidenceManager({
  files,
  title = "Files and evidence",
  description,
  dense = false,
}: {
  files: EvidenceFile[];
  title?: string;
  description?: string;
  dense?: boolean;
}) {
  const accepted = files.filter((file) => file.status === "accepted").length;
  const pendingReview = files.filter((file) =>
    ["uploaded", "under_review"].includes(file.status)
  ).length;
  const needsAttention = files.filter((file) =>
    ["needs_replacement", "rejected"].includes(file.status)
  ).length;

  return (
    <section className="surface-panel p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
            {title}
          </p>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.18em]">
          <span className="rounded-full bg-muted px-3 py-2 text-muted-foreground">
            {files.length} files
          </span>
          <span className="rounded-full bg-emerald-100 px-3 py-2 text-emerald-800">
            {accepted} accepted
          </span>
          <span className="rounded-full bg-sky-100 px-3 py-2 text-sky-800">
            {pendingReview} pending review
          </span>
          <span className="rounded-full bg-orange-100 px-3 py-2 text-orange-800">
            {needsAttention} need action
          </span>
        </div>
      </div>

      {files.length ? (
        <div className={cn("mt-5", dense ? "space-y-3" : "grid gap-4 2xl:grid-cols-1")}>
          {files.map((file) => (
            <article
              key={file.id}
              className={cn(
                "group min-w-0 border border-border/60 bg-white/78 transition-all duration-200",
                dense
                  ? "rounded-[22px] px-4 py-3 shadow-[0_8px_22px_rgba(15,23,42,0.05)]"
                  : "rounded-[24px] p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(15,23,42,0.10)] sm:p-5"
              )}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-2">
                  <p
                    className={cn(
                      "line-clamp-2 font-semibold leading-6 text-foreground",
                      dense ? "text-sm" : "text-[15px]"
                    )}
                  >
                    <span className="break-words">{file.name}</span>
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="whitespace-nowrap rounded-full bg-muted/70 px-2.5 py-1 capitalize">
                      {file.kind.replace("_", " ")}
                    </span>
                    <span className="whitespace-nowrap rounded-full bg-muted/70 px-2.5 py-1">{file.sizeLabel}</span>
                    <span className="whitespace-nowrap rounded-full bg-muted/70 px-2.5 py-1">
                      {formatDate(file.uploadedAt)}
                    </span>
                    <span className="whitespace-nowrap rounded-full bg-accent/75 px-2.5 py-1 text-accent-foreground">
                      {file.category || "Uncategorized"}
                    </span>
                  </div>
                </div>
                <div className="shrink-0">
                  <FileStatusBadge status={file.status} />
                </div>
              </div>

              {dense ? (
                <div className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <span className="inline-flex items-center gap-1.5">
                      <UploadCloud className="size-3.5 text-primary" />
                      {file.status.replaceAll("_", " ")}
                    </span>
                    {file.reviewedBy ? (
                      <span className="inline-flex items-center gap-1.5">
                        <FileCheck2 className="size-3.5 text-primary" />
                        reviewed
                      </span>
                    ) : null}
                  </div>
                  {file.downloadUrl ? (
                    <a
                      href={file.downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline"
                    >
                      Open file preview
                    </a>
                  ) : null}
                </div>
              ) : (
                <>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.16em]">
                    {file.reviewedBy ? (
                      <span className="whitespace-nowrap rounded-full bg-muted px-3 py-1.5 text-muted-foreground">
                        reviewed
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[18px] bg-muted/60 p-3">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        <UploadCloud className="size-4 text-primary" />
                        Upload state
                      </div>
                      <p className="mt-2 text-sm capitalize text-foreground">
                        {file.status.replaceAll("_", " ")}
                      </p>
                    </div>
                    <div className="rounded-[18px] bg-muted/60 p-3">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        <FileStack className="size-4 text-primary" />
                        Category
                      </div>
                      <p className="mt-2 text-sm text-foreground">{file.category || "Uncategorized"}</p>
                    </div>
                    <div className="rounded-[20px] bg-muted/75 p-4 sm:col-span-2">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        {file.status === "accepted" ? (
                          <FileCheck2 className="size-4 text-primary" />
                        ) : (
                          <FileWarning className="size-4 text-primary" />
                        )}
                        Review note
                      </div>
                      <p className="mt-2 line-clamp-4 text-sm leading-6 text-muted-foreground">
                        {file.notes || "Awaiting a reviewer note."}
                      </p>
                    </div>
                  </div>

                  {file.downloadUrl ? (
                    <a
                      href={file.downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline"
                    >
                      Open file preview
                    </a>
                  ) : null}
                </>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-5">
          <EmptyState
            icon={<FileStack className="size-5" />}
            title="No files linked yet"
            description="Upload evidence to create a real document trail for citizens, admins, and future AI-assisted summaries."
          />
        </div>
      )}
    </section>
  );
}
