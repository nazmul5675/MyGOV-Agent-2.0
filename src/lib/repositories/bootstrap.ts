import "server-only";

import type { IndexDescription } from "mongodb";

import { getMongoDb } from "@/lib/mongodb";
import type {
  AdminNoteDocument,
  CaseDocument,
  CaseEventDocument,
  ChatMessageDocument,
  FileDocument,
  NotificationDocument,
  ReminderDocument,
  RoleAuditLogDocument,
  UserDocument,
} from "@/types/models";

type MutableGlobal = typeof globalThis & {
  __mygovMongoBootstrapPromise__?: Promise<void>;
};

type CollectionName =
  | "users"
  | "cases"
  | "case_events"
  | "files_metadata"
  | "notifications"
  | "reminders"
  | "chat_messages"
  | "admin_notes"
  | "role_audit_logs";

const collectionIndexes: Record<CollectionName, IndexDescription[]> = {
  users: [
    { key: { id: 1 }, unique: true },
    { key: { uid: 1 }, unique: true, sparse: true },
    { key: { firebaseUid: 1 }, unique: true, sparse: true },
    { key: { email: 1 }, unique: true },
    { key: { role: 1, updatedAt: -1 } },
  ],
  cases: [
    { key: { id: 1 }, unique: true },
    { key: { citizenUid: 1, updatedAt: -1 } },
    { key: { status: 1, updatedAt: -1 } },
    { key: { reference: 1 }, unique: true },
    { key: { isHidden: 1, updatedAt: -1 } },
  ],
  case_events: [
    { key: { id: 1 }, unique: true },
    { key: { caseId: 1, createdAt: 1 } },
    { key: { actorUid: 1, createdAt: -1 } },
  ],
  files_metadata: [
    { key: { id: 1 }, unique: true },
    { key: { fileId: 1 }, unique: true, sparse: true },
    { key: { gridFsFileId: 1 }, unique: true, sparse: true },
    { key: { caseId: 1, uploadedAt: -1 } },
    { key: { ownerUid: 1, uploadedAt: -1 } },
    { key: { reviewStatus: 1, uploadedAt: -1 } },
  ],
  notifications: [
    { key: { id: 1 }, unique: true },
    { key: { userUid: 1, createdAt: -1 } },
  ],
  reminders: [
    { key: { id: 1 }, unique: true },
    { key: { userUid: 1, createdAt: -1 } },
    { key: { caseId: 1, createdAt: -1 } },
  ],
  chat_messages: [
    { key: { id: 1 }, unique: true },
    { key: { userUid: 1, threadKey: 1, createdAt: 1 } },
    { key: { caseId: 1, createdAt: 1 } },
  ],
  admin_notes: [
    { key: { id: 1 }, unique: true },
    { key: { caseId: 1, createdAt: -1 } },
  ],
  role_audit_logs: [
    { key: { id: 1 }, unique: true },
    { key: { targetUserUid: 1, createdAt: -1 } },
    { key: { changedByUid: 1, createdAt: -1 } },
  ],
};

async function ensureIndexes() {
  const db = await getMongoDb();

  await Promise.all(
    (Object.entries(collectionIndexes) as Array<[CollectionName, IndexDescription[]]>).map(
      async ([name, indexes]) => {
        const collection = db.collection(name);
        await Promise.all(
          indexes.map(async (index) => {
            try {
              await collection.createIndex(index.key, index);
            } catch (error) {
              const codeName =
                error && typeof error === "object" && "codeName" in error
                  ? String(error.codeName)
                  : "";
              const message = error instanceof Error ? error.message : String(error);

              if (
                codeName === "IndexOptionsConflict" ||
                codeName === "IndexKeySpecsConflict" ||
                /existing index has the same name as the requested index/i.test(message)
              ) {
                return;
              }

              throw error;
            }
          })
        );
      }
    )
  );
}

async function ensureCaseVisibilityDefaults() {
  const db = await getMongoDb();
  await db
    .collection<CaseDocument>("cases")
    .updateMany({ isHidden: { $exists: false } }, { $set: { isHidden: false } });
}

async function bootstrapMongoCollections() {
  await ensureIndexes();
  await ensureCaseVisibilityDefaults();
}

export async function ensureMongoCollectionsReady() {
  const mutableGlobal = globalThis as MutableGlobal;

  if (!mutableGlobal.__mygovMongoBootstrapPromise__) {
    mutableGlobal.__mygovMongoBootstrapPromise__ = bootstrapMongoCollections().catch((error) => {
      delete mutableGlobal.__mygovMongoBootstrapPromise__;
      throw error;
    });
  }

  return mutableGlobal.__mygovMongoBootstrapPromise__;
}

export async function getMongoCollections() {
  await ensureMongoCollectionsReady();
  const db = await getMongoDb();

  return {
    users: db.collection<UserDocument>("users"),
    cases: db.collection<CaseDocument>("cases"),
    caseEvents: db.collection<CaseEventDocument>("case_events"),
    filesMetadata: db.collection<FileDocument>("files_metadata"),
    notifications: db.collection<NotificationDocument>("notifications"),
    reminders: db.collection<ReminderDocument>("reminders"),
    chatMessages: db.collection<ChatMessageDocument>("chat_messages"),
    adminNotes: db.collection<AdminNoteDocument>("admin_notes"),
    roleAuditLogs: db.collection<RoleAuditLogDocument>("role_audit_logs"),
  };
}
