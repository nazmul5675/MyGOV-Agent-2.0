import "server-only";

import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";
import { GridFSBucket, ObjectId } from "mongodb";

import { getMongoDb } from "@/lib/mongodb";
import { badRequest, notFoundError } from "@/lib/security/api";
import type { EvidenceFile } from "@/lib/types";

type MutableGlobal = typeof globalThis & {
  __mygovGridFsBucketPromise__?: Promise<GridFSBucket>;
};

const maxUploadBytes = 10 * 1024 * 1024;

function getGridFsBucketName() {
  return process.env.GRIDFS_BUCKET_NAME?.trim() || "evidence";
}

function isAllowedMimeType(contentType: string) {
  return (
    contentType.startsWith("image/") ||
    contentType === "application/pdf" ||
    contentType.startsWith("audio/")
  );
}

function inferEvidenceKind(contentType: string): EvidenceFile["kind"] {
  if (contentType.startsWith("image/")) return "photo";
  if (contentType.startsWith("audio/")) return "voice_note";
  return "document";
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function getGridFsBucket() {
  const mutableGlobal = globalThis as MutableGlobal;
  if (!mutableGlobal.__mygovGridFsBucketPromise__) {
    mutableGlobal.__mygovGridFsBucketPromise__ = (async () => {
      const db = await getMongoDb();
      return new GridFSBucket(db, { bucketName: getGridFsBucketName() });
    })();
  }

  return mutableGlobal.__mygovGridFsBucketPromise__;
}

async function findGridFsFileByAppFileId(fileId: string, ownerUid?: string) {
  const db = await getMongoDb();
  const filesCollection = db.collection(`${getGridFsBucketName()}.files`);
  return filesCollection.findOne<{ _id: ObjectId; filename: string; metadata?: Record<string, unknown> }>({
    "metadata.appFileId": fileId,
    ...(ownerUid ? { "metadata.ownerUid": ownerUid } : {}),
  });
}

export async function uploadEvidenceBlob(input: {
  file: File;
  caseId: string;
  userUid: string;
}) {
  const { file, caseId, userUid } = input;
  const contentType = file.type || "application/octet-stream";

  if (!file.size) {
    throw badRequest("The selected file is empty.");
  }

  if (file.size > maxUploadBytes) {
    throw badRequest(`${file.name} is larger than 10 MB and cannot be uploaded.`);
  }

  if (!isAllowedMimeType(contentType)) {
    throw badRequest(`${file.name} is not a supported file type. Use image, PDF, or audio files.`);
  }

  const bucket = await getGridFsBucket();
  const appFileId = randomUUID();
  const buffer = Buffer.from(await file.arrayBuffer());
  const uploadStream = bucket.openUploadStream(file.name, {
    metadata: {
      appFileId,
      ownerUid: userUid,
      caseId,
      uploadedAt: new Date().toISOString(),
      contentType,
    },
  });

  await new Promise<void>((resolve, reject) => {
    Readable.from(buffer)
      .pipe(uploadStream)
      .on("error", reject)
      .on("finish", () => resolve());
  }).catch(async (error) => {
    if (uploadStream.id) {
      await bucket.delete(uploadStream.id as ObjectId).catch(() => undefined);
    }
    throw error;
  });

  return {
    id: appFileId,
    gridFsFileId: String(uploadStream.id),
    name: file.name,
    kind: inferEvidenceKind(contentType),
    sizeLabel: formatFileSize(file.size),
    sizeBytes: file.size,
    uploadedAt: new Date().toISOString(),
    status: "uploaded" as const,
    downloadUrl: `/api/files/${appFileId}`,
    contentType,
  };
}

export async function deleteUploadedEvidenceBlobs(fileIds: string[], ownerUid?: string) {
  if (!fileIds.length) return;

  const bucket = await getGridFsBucket();
  const gridFsFiles = await Promise.all(
    fileIds.map((fileId) => findGridFsFileByAppFileId(fileId, ownerUid))
  );

  await Promise.all(
    gridFsFiles
      .filter((record): record is NonNullable<typeof record> => Boolean(record?._id))
      .map(async (record) => {
        await bucket.delete(record._id).catch(() => undefined);
      })
  );
}

export async function openEvidenceDownloadStreamByGridFsId(gridFsFileId: string) {
  const bucket = await getGridFsBucket();
  let objectId: ObjectId;

  try {
    objectId = new ObjectId(gridFsFileId);
  } catch {
    throw notFoundError("File blob not found.");
  }

  return bucket.openDownloadStream(objectId);
}
