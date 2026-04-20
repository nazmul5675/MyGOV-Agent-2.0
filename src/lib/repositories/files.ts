import "server-only";

import { getMongoCollections } from "@/lib/repositories/bootstrap";
import type { FileDocument } from "@/types/models";

export async function listFilesForCase(caseId: string) {
  const { files } = await getMongoCollections();
  return files.find({ caseId }).sort({ uploadedAt: -1 }).toArray();
}

export async function listFilesForCases(caseIds: string[]) {
  if (!caseIds.length) return [];
  const { files } = await getMongoCollections();
  return files.find({ caseId: { $in: caseIds } }).sort({ uploadedAt: -1 }).toArray();
}

export async function listFilesForUser(userId: string) {
  const { files } = await getMongoCollections();
  return files.find({ ownerUid: userId }).sort({ uploadedAt: -1 }).toArray();
}

export async function insertFiles(records: FileDocument[]) {
  if (!records.length) return;
  const { files } = await getMongoCollections();
  await files.insertMany(records, { ordered: false });
}

export async function updateFileById(
  fileId: string,
  update: Partial<FileDocument>
) {
  const { files } = await getMongoCollections();
  await files.updateOne({ id: fileId }, { $set: update });
}
