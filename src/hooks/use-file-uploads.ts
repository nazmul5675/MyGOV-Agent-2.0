"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";

import { isPrototypeMode } from "@/lib/config/app-mode";
import type { EvidenceFile } from "@/lib/types";

interface UploadState {
  id: string;
  gridFsFileId?: string;
  name: string;
  kind: EvidenceFile["kind"];
  size: number;
  progress: number;
  status: "queued" | "uploading" | "uploaded" | "error";
  downloadUrl?: string;
  contentType?: string;
}

function inferKind(file: File): EvidenceFile["kind"] {
  if (file.type.startsWith("image/")) return "photo";
  if (file.type.startsWith("audio/")) return "voice_note";
  return "document";
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const maxUploadBytes = 10 * 1024 * 1024;

function isSupportedFile(file: File) {
  return (
    file.type.startsWith("image/") ||
    file.type === "application/pdf" ||
    file.type.startsWith("audio/")
  );
}

export function useFileUploads() {
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const queuedFilesRef = useRef<Record<string, File>>({});
  const objectUrlRef = useRef<Record<string, string>>({});

  const queueFiles = (files: FileList | null) => {
    if (!files) return [];

    const validFiles = Array.from(files).filter((file) => {
      if (!isSupportedFile(file)) {
        toast.error(`${file.name} is not a supported file type. Use image, PDF, or audio files.`);
        return false;
      }

      if (file.size > maxUploadBytes) {
        toast.error(`${file.name} is larger than 10 MB and cannot be uploaded.`);
        return false;
      }

      return true;
    });

    const queued = validFiles.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: file.name,
      kind: inferKind(file),
      size: file.size,
      progress: 0,
      status: "queued" as const,
      contentType: file.type,
      file,
    }));

    queued.forEach((item) => {
      queuedFilesRef.current[item.id] = item.file;
    });

    setUploads((current) => [
      ...current,
      ...queued.map((item) => ({
        id: item.id,
        name: item.name,
        kind: item.kind,
        size: item.size,
        progress: item.progress,
        status: item.status,
        contentType: item.contentType,
      })),
    ]);

    return queued;
  };

  const uploadForCase = async (
    caseId: string,
    userId: string,
    files?: FileList | null
  ) => {
    const queued = files
      ? queueFiles(files)
      : uploads.map((item) => ({
          ...item,
          file: queuedFilesRef.current[item.id],
        }));
    const results: EvidenceFile[] = [];

    if (isPrototypeMode()) {
      for (const entry of queued) {
        const file = "file" in entry && entry.file instanceof File ? entry.file : null;
        if (!file) continue;

        setUploads((current) =>
          current.map((item) =>
            item.id === entry.id ? { ...item, status: "uploading", progress: 15 } : item
          )
        );

        await new Promise((resolve) => setTimeout(resolve, 180));
        setUploads((current) =>
          current.map((item) =>
            item.id === entry.id ? { ...item, progress: 56 } : item
          )
        );
        await new Promise((resolve) => setTimeout(resolve, 220));

        const previewUrl = URL.createObjectURL(file);
        objectUrlRef.current[entry.id] = previewUrl;
        setUploads((current) =>
          current.map((item) =>
            item.id === entry.id
              ? {
                  ...item,
                  progress: 100,
                  status: "uploaded",
                  downloadUrl: previewUrl,
                }
              : item
          )
        );

        results.push({
          id: entry.id,
          name: entry.name,
          kind: entry.kind,
          sizeLabel: formatFileSize(entry.size),
          sizeBytes: entry.size,
          uploadedAt: new Date().toISOString(),
          status: "uploaded",
          downloadUrl: previewUrl,
          contentType: entry.contentType,
        });
      }

      return results;
    }

    for (const entry of queued) {
      const file = "file" in entry && entry.file instanceof File ? entry.file : null;
      if (!file) continue;

      setUploads((current) =>
        current.map((item) =>
          item.id === entry.id ? { ...item, status: "uploading", progress: 12 } : item
        )
      );

      const formData = new FormData();
      formData.append("caseId", caseId);
      formData.append("file", file, file.name);

      const response = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setUploads((current) =>
          current.map((item) => (item.id === entry.id ? { ...item, status: "error" } : item))
        );
        throw new Error(body?.error || `Upload failed for ${entry.name}.`);
      }

      const payload = (await response.json()) as { file: EvidenceFile };
      const result = payload.file;

      setUploads((current) =>
        current.map((item) =>
          item.id === entry.id
            ? {
                ...item,
                id: result.id,
                gridFsFileId: result.gridFsFileId,
                progress: 100,
                status: "uploaded",
                downloadUrl: result.downloadUrl,
                contentType: result.contentType,
              }
            : item
        )
      );

      results.push(result);
    }

    return results;
  };

  return {
    uploads,
    queueFiles,
    removeQueuedUpload: (uploadId: string) => {
      delete queuedFilesRef.current[uploadId];
      setUploads((current) => current.filter((item) => item.id !== uploadId));
    },
    uploadForCase,
    cleanupUploadedFiles: async (files: EvidenceFile[]) => {
      if (isPrototypeMode()) {
        files.forEach((file) => {
          if (file.id && objectUrlRef.current[file.id]) {
            URL.revokeObjectURL(objectUrlRef.current[file.id]);
            delete objectUrlRef.current[file.id];
          }
        });
        return;
      }

      const fileIds = files.map((file) => file.id).filter(Boolean);
      if (!fileIds.length) return;

      await fetch("/api/uploads", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds }),
      }).catch(() => undefined);
    },
    resetUploads: () => {
      Object.values(objectUrlRef.current).forEach((url) => URL.revokeObjectURL(url));
      objectUrlRef.current = {};
      queuedFilesRef.current = {};
      setUploads([]);
    },
  };
}
