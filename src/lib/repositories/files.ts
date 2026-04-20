import "server-only";

import { getMongoCollections } from "@/lib/repositories/bootstrap";
import type { FileDocument } from "@/types/models";

function toPlainFile(record: FileDocument) {
  const plain = { ...(record as FileDocument & { _id?: unknown }) };
  delete plain._id;
  return plain as FileDocument;
}

export async function listFilesForCase(caseId: string) {
  const { files } = await getMongoCollections();
  const records = await files.find({ caseId }).sort({ uploadedAt: -1 }).toArray();
  return records.map(toPlainFile);
}

export async function listFilesForCases(caseIds: string[]) {
  if (!caseIds.length) return [];
  const { files } = await getMongoCollections();
  const records = await files.find({ caseId: { $in: caseIds } }).sort({ uploadedAt: -1 }).toArray();
  return records.map(toPlainFile);
}

export async function listFilesForUser(userId: string) {
  const { files } = await getMongoCollections();
  const records = await files.find({ ownerUid: userId }).sort({ uploadedAt: -1 }).toArray();
  return records.map(toPlainFile);
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
