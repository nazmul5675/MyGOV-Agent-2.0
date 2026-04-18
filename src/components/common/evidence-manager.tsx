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
  const needsAttention = files.filter((file) =>
    ["needs_replacement", "rejected"].includes(file.status)
  ).length;

  return (
    <section className="surface-panel p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
            {title}
          </p>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
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
          <span className="rounded-full bg-orange-100 px-3 py-2 text-orange-800">
            {needsAttention} need action
          </span>
        </div>
      </div>

      {files.length ? (
        <div className={cn("mt-5 grid gap-3", dense ? "lg:grid-cols-1" : "lg:grid-cols-2")}>
          {files.map((file) => (
            <article
              key={file.id}
              className="group rounded-[24px] border border-border/60 bg-white/75 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(15,23,42,0.10)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <p className="font-semibold text-foreground">{file.name}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>{file.kind.replace("_", " ")}</span>
                    <span>{file.sizeLabel}</span>
                    <span>{formatDate(file.uploadedAt)}</span>
                  </div>
                </div>
                <FileStatusBadge status={file.status} />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[18px] bg-muted/80 p-3">
                  <UploadCloud className="size-4 text-primary" />
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Upload state
                  </p>
                  <p className="mt-1 text-sm text-foreground">{file.status.replaceAll("_", " ")}</p>
                </div>
                <div className="rounded-[18px] bg-muted/80 p-3">
                  <FileStack className="size-4 text-primary" />
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Category
                  </p>
                  <p className="mt-1 text-sm text-foreground">{file.category || "Uncategorized"}</p>
                </div>
                <div className="rounded-[18px] bg-muted/80 p-3">
                  {file.status === "accepted" ? (
                    <FileCheck2 className="size-4 text-primary" />
                  ) : (
                    <FileWarning className="size-4 text-primary" />
                  )}
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Review note
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-foreground">
                    {file.notes || "Awaiting a reviewer note."}
                  </p>
                </div>
              </div>
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
