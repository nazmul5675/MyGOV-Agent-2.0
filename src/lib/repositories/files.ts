import "server-only";

import { getMongoCollections } from "@/lib/repositories/bootstrap";
import type { FileDocument } from "@/types/models";

function toPlainFile(record: FileDocument) {
  const plain = { ...(record as FileDocument & { _id?: unknown }) };
  delete plain._id;
  return plain as FileDocument;
}

export async function listFilesForCase(caseId: string) {
  const { filesMetadata } = await getMongoCollections();
  const records = await filesMetadata.find({ caseId }).sort({ uploadedAt: -1 }).toArray();
  return records.map(toPlainFile);
}

export async function listFilesForCases(caseIds: string[]) {
  if (!caseIds.length) return [];
  const { filesMetadata } = await getMongoCollections();
  const records = await filesMetadata.find({ caseId: { $in: caseIds } }).sort({ uploadedAt: -1 }).toArray();
  return records.map(toPlainFile);
}

export async function listFilesForUser(userUid: string) {
  const { filesMetadata } = await getMongoCollections();
  const records = await filesMetadata.find({ ownerUid: userUid }).sort({ uploadedAt: -1 }).toArray();
  return records.map(toPlainFile);
}

export async function getFileById(fileId: string) {
  const { filesMetadata } = await getMongoCollections();
  const record = await filesMetadata.findOne({ id: fileId });
  return record ? toPlainFile(record) : null;
}

export async function insertFiles(records: FileDocument[]) {
  if (!records.length) return;
  const { filesMetadata } = await getMongoCollections();
  await filesMetadata.insertMany(records, { ordered: false });
}

export async function updateFileById(fileId: string, update: Partial<FileDocument>) {
  const { filesMetadata } = await getMongoCollections();
  await filesMetadata.updateOne({ id: fileId }, { $set: update });
}
