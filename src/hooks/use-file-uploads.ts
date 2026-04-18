"use client";

import { useRef, useState } from "react";
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";

import { getMissingFirebaseClientVars } from "@/lib/firebase/config";
import { firebaseStorage } from "@/lib/firebase/client";
import type { EvidenceFile } from "@/lib/types";

interface UploadState {
  id: string;
  name: string;
  kind: EvidenceFile["kind"];
  size: number;
  progress: number;
  status: "queued" | "uploading" | "uploaded" | "error";
  downloadUrl?: string;
  storagePath?: string;
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

export function useFileUploads() {
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const queuedFilesRef = useRef<Record<string, File>>({});

  const queueFiles = (files: FileList | null) => {
    if (!files) return [];

    const queued = Array.from(files).map((file) => ({
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
    const storage = firebaseStorage;

    const results: EvidenceFile[] = [];

    if (!storage) {
      const missingVars = getMissingFirebaseClientVars();

      setUploads((current) =>
        current.map((item) => ({
          ...item,
          status: "error",
        }))
      );

      throw new Error(
        `Firebase Storage is not configured for live uploads. Missing client env vars: ${missingVars.join(", ")}`
      );
    }

    for (const entry of queued) {
      const file =
        "file" in entry && entry.file instanceof File ? entry.file : null;
      const storagePath = `cases/${userId}/${caseId}/${entry.id}-${entry.name}`;
      const storageRef = ref(storage, storagePath);
      if (!file) continue;
      const task = uploadBytesResumable(storageRef, file, {
        contentType: entry.contentType,
      });

      const result = await new Promise<EvidenceFile>((resolve, reject) => {
        task.on(
          "state_changed",
          (snapshot) => {
            const progress = Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            );
            setUploads((current) =>
              current.map((item) =>
                item.id === entry.id
                  ? { ...item, progress, status: "uploading", storagePath }
                  : item
              )
            );
          },
          () => {
            setUploads((current) =>
              current.map((item) =>
                item.id === entry.id ? { ...item, status: "error" } : item
              )
            );
            reject(new Error(`Upload failed for ${entry.name}`));
          },
          async () => {
            const downloadUrl = await getDownloadURL(task.snapshot.ref);
            setUploads((current) =>
              current.map((item) =>
                item.id === entry.id
                  ? {
                      ...item,
                      progress: 100,
                      status: "uploaded",
                      downloadUrl,
                      storagePath,
                    }
                  : item
              )
            );
            resolve({
              id: entry.id,
              name: entry.name,
              kind: entry.kind,
              sizeLabel: formatFileSize(entry.size),
              sizeBytes: entry.size,
              uploadedAt: new Date().toISOString(),
              status: "uploaded",
              downloadUrl,
              storagePath,
              contentType: entry.contentType,
            });
          }
        );
      });

      results.push(result);
    }

    return results;
  };

  return {
    uploads,
    queueFiles,
    uploadForCase,
    cleanupUploadedFiles: async (files: EvidenceFile[]) => {
      const storage = firebaseStorage;
      if (!storage) return;

      await Promise.all(
        files
          .map((file) => file.storagePath)
          .filter((path): path is string => Boolean(path))
          .map(async (path) => {
            await deleteObject(ref(storage, path)).catch(() => undefined);
          })
      );
    },
    resetUploads: () => {
      queuedFilesRef.current = {};
      setUploads([]);
    },
  };
}
