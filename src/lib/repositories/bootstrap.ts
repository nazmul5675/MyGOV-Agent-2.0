import "server-only";

import type { IndexDescription } from "mongodb";

import { getMongoDb } from "@/lib/mongodb";
import { getPrototypeStore } from "@/lib/prototype/store";
import type {
  AdminNoteDocument,
  CaseDocument,
  CaseEventDocument,
  ChatMessageDocument,
  FileDocument,
  NotificationDocument,
  ReminderDocument,
  UserDocument,
} from "@/types/models";

type MutableGlobal = typeof globalThis & {
  __mygovMongoBootstrapPromise__?: Promise<void>;
};

type CollectionName =
  | "users"
  | "cases"
  | "case_events"
  | "files"
  | "notifications"
  | "reminders"
  | "chat_messages"
  | "admin_notes";

const collectionIndexes: Record<CollectionName, IndexDescription[]> = {
  users: [{ key: { uid: 1 }, unique: true }, { key: { email: 1 }, unique: true }],
  cases: [
    { key: { id: 1 }, unique: true },
    { key: { citizenId: 1, updatedAt: -1 } },
    { key: { status: 1, updatedAt: -1 } },
  ],
  case_events: [{ key: { id: 1 }, unique: true }, { key: { caseId: 1, createdAt: 1 } }],
  files: [
    { key: { id: 1 }, unique: true },
    { key: { caseId: 1, uploadedAt: -1 } },
    { key: { ownerUid: 1, uploadedAt: -1 } },
  ],
  notifications: [{ key: { id: 1 }, unique: true }, { key: { userId: 1, createdAt: -1 } }],
  reminders: [
    { key: { id: 1 }, unique: true },
    { key: { userId: 1, createdAt: -1 } },
    { key: { caseId: 1, createdAt: -1 } },
  ],
  chat_messages: [
    { key: { id: 1 }, unique: true },
    { key: { userId: 1, threadKey: 1, createdAt: 1 } },
    { key: { caseId: 1, createdAt: 1 } },
  ],
  admin_notes: [{ key: { id: 1 }, unique: true }, { key: { caseId: 1, createdAt: -1 } }],
};

async function ensureIndexes() {
  const db = await getMongoDb();

  await Promise.all(
    (Object.entries(collectionIndexes) as Array<[CollectionName, IndexDescription[]]>).map(
      async ([name, indexes]) => {
        const collection = db.collection(name);
        await Promise.all(indexes.map((index) => collection.createIndex(index.key, index)));
      }
    )
  );
}

async function seedIfEmpty() {
  const db = await getMongoDb();
  const dataset = getPrototypeStore();

  const counts = await Promise.all([
    db.collection<UserDocument>("users").countDocuments(),
    db.collection<CaseDocument>("cases").countDocuments(),
    db.collection<CaseEventDocument>("case_events").countDocuments(),
    db.collection<FileDocument>("files").countDocuments(),
    db.collection<NotificationDocument>("notifications").countDocuments(),
    db.collection<ReminderDocument>("reminders").countDocuments(),
    db.collection<ChatMessageDocument>("chat_messages").countDocuments(),
  ]);

  if (counts.every((count) => count > 0)) {
    return;
  }

  if (counts[0] === 0 && dataset.users.length) {
    await db.collection<UserDocument>("users").insertMany(dataset.users, { ordered: false });
  }

  if (counts[1] === 0 && dataset.cases.length) {
    await db.collection<CaseDocument>("cases").insertMany(dataset.cases, { ordered: false });
  }

  if (counts[2] === 0 && dataset.caseEvents.length) {
    await db
      .collection<CaseEventDocument>("case_events")
      .insertMany(dataset.caseEvents, { ordered: false });
  }

  if (counts[3] === 0 && dataset.files.length) {
    await db.collection<FileDocument>("files").insertMany(dataset.files, { ordered: false });
  }

  if (counts[4] === 0 && dataset.notifications.length) {
    await db
      .collection<NotificationDocument>("notifications")
      .insertMany(dataset.notifications, { ordered: false });
  }

  if (counts[5] === 0 && dataset.reminders.length) {
    await db
      .collection<ReminderDocument>("reminders")
      .insertMany(dataset.reminders, { ordered: false });
  }

  if (counts[6] === 0 && dataset.chatSeeds.length) {
    await db
      .collection<ChatMessageDocument>("chat_messages")
      .insertMany(dataset.chatSeeds, { ordered: false });
  }
}

async function bootstrapMongoCollections() {
  await ensureIndexes();
  await seedIfEmpty();
}

export async function ensureMongoCollectionsReady() {
  const mutableGlobal = globalThis as MutableGlobal;

  if (!mutableGlobal.__mygovMongoBootstrapPromise__) {
    mutableGlobal.__mygovMongoBootstrapPromise__ = bootstrapMongoCollections();
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
    files: db.collection<FileDocument>("files"),
    notifications: db.collection<NotificationDocument>("notifications"),
    reminders: db.collection<ReminderDocument>("reminders"),
    chatMessages: db.collection<ChatMessageDocument>("chat_messages"),
    adminNotes: db.collection<AdminNoteDocument>("admin_notes"),
  };
}
