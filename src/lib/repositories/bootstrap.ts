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

function normalizeSeedUsers(records: Array<Record<string, unknown> | object>): UserDocument[] {
  return records.map((item) => {
    const record = item as Record<string, unknown>;
    return ({
    id: String(record.id || record.uid),
    uid: String(record.uid || record.firebaseUid || record.id),
    firebaseUid: String(record.uid || record.firebaseUid || record.id),
    email: String(record.email || ""),
    fullName: String(record.fullName || record.name || "MyGOV User"),
    role: record.role === "admin" ? "admin" : "citizen",
    accountStatus:
      record.accountStatus === "disabled" || record.accountStatus === "invited"
        ? record.accountStatus
        : "active",
    password: typeof record.password === "string" ? record.password : "",
    dateOfBirth: typeof record.dateOfBirth === "string" ? record.dateOfBirth : undefined,
    phoneNumber: typeof record.phoneNumber === "string" ? record.phoneNumber : undefined,
    addressText: typeof record.addressText === "string" ? record.addressText : undefined,
    documents: Array.isArray(record.documents)
      ? record.documents.filter((value): value is string => typeof value === "string")
      : [],
    createdAt: String(record.createdAt || new Date().toISOString()),
    updatedAt: String(record.updatedAt || record.createdAt || new Date().toISOString()),
    lastActiveAt: typeof record.lastActiveAt === "string" ? record.lastActiveAt : undefined,
  })});
}

function normalizeSeedCases(records: Array<Record<string, unknown> | object>): CaseDocument[] {
  return records.map((item) => {
    const record = item as Record<string, unknown>;
    const intake = (record.intake || {}) as Record<string, unknown>;
    const missingDocuments = Array.isArray(intake.missingDocuments)
      ? intake.missingDocuments.filter((item): item is string => typeof item === "string")
      : [];

    return {
      id: String(record.id),
      reference: String(record.reference),
      citizenUid: String(record.citizenId || record.citizenUid),
      citizenName: String(record.citizenName || "Citizen"),
      isHidden: Boolean(record.isHidden),
      title: String(record.title),
      type:
        record.type === "flood_relief" ||
        record.type === "public_complaint" ||
        record.type === "reminder_renewal"
          ? record.type
          : "public_complaint",
      status:
        record.status === "reviewing" ||
        record.status === "need_more_docs" ||
        record.status === "routed" ||
        record.status === "in_progress" ||
        record.status === "resolved" ||
        record.status === "rejected"
          ? record.status
          : "submitted",
      summary: String(record.summary || ""),
      aiSummary: typeof record.aiSummary === "string" ? record.aiSummary : undefined,
      adminSummary: typeof intake.adminSummary === "string" ? intake.adminSummary : undefined,
      location: String(record.location || ""),
      locationMeta: (record.locationMeta || undefined) as CaseDocument["locationMeta"],
      assignedUnit: String(record.assignedUnit || "MyGOV Digital Triage Desk"),
      currentStep: typeof record.currentStep === "string" ? record.currentStep : undefined,
      progress: typeof record.progress === "number" ? record.progress : 0,
      evidenceCount: Array.isArray(record.evidence) ? record.evidence.length : 0,
      missingDocuments,
      intake: {
        citizenSummary: String(intake.citizenSummary || record.summary || ""),
        adminSummary: String(intake.adminSummary || record.summary || ""),
        category: String(intake.category || "General"),
        urgency:
          intake.urgency === "low" || intake.urgency === "high" ? intake.urgency : "medium",
        missingDocuments,
        structuredIntake:
          intake.structuredIntake && typeof intake.structuredIntake === "object"
            ? (intake.structuredIntake as Record<string, string | string[]>)
            : {},
      },
      latestInternalNote:
        typeof record.latestInternalNote === "string" ? record.latestInternalNote : undefined,
      updatedBy: typeof record.updatedBy === "string" ? record.updatedBy : undefined,
      createdAt: String(record.createdAt || new Date().toISOString()),
      updatedAt: String(record.updatedAt || record.createdAt || new Date().toISOString()),
    };
  });
}

function normalizeSeedEvents(records: Array<Record<string, unknown> | object>): CaseEventDocument[] {
  return records.map((item) => {
    const record = item as Record<string, unknown>;
    return ({
    id: String(record.id),
    caseId: String(record.caseId),
    actorUid: typeof record.actorId === "string" ? record.actorId : undefined,
    actorRole: record.actor === "Admin Review Team" ? "admin" : "citizen",
    eventType:
      record.type === "upload" || record.type === "routing" || record.type === "note"
        ? record.type
        : "status",
    label: String(record.title || "Case event"),
    description: String(record.description || ""),
    createdAt: String(record.createdAt || new Date().toISOString()),
    metadata: {
      actorName: typeof record.actor === "string" ? record.actor : null,
    },
  })});
}

function normalizeSeedFiles(records: Array<Record<string, unknown> | object>): FileDocument[] {
  return records.map((item) => {
    const record = item as Record<string, unknown>;
    return ({
    id: String(record.id),
    fileId: String(record.id),
    gridFsFileId: typeof record.gridFsFileId === "string" ? record.gridFsFileId : undefined,
    caseId: String(record.caseId || ""),
    ownerUid: String(record.ownerUid || record.citizenId || ""),
    filename: String(record.name || record.filename || "file"),
    mimeType: typeof record.contentType === "string" ? record.contentType : undefined,
    size: typeof record.sizeBytes === "number" ? record.sizeBytes : 0,
    uploadedAt: String(record.uploadedAt || new Date().toISOString()),
    category: typeof record.category === "string" ? record.category : undefined,
    kind:
      record.kind === "photo" || record.kind === "voice_note" ? record.kind : "document",
    reviewStatus:
      record.status === "under_review" ||
      record.status === "accepted" ||
      record.status === "needs_replacement" ||
      record.status === "rejected"
        ? record.status
        : "uploaded",
    reviewNote: typeof record.notes === "string" ? record.notes : undefined,
    reviewedAt: typeof record.reviewedAt === "string" ? record.reviewedAt : undefined,
    reviewedBy: typeof record.reviewedBy === "string" ? record.reviewedBy : undefined,
    uploadedByRole: "citizen",
  })});
}

function normalizeSeedNotifications(records: Array<Record<string, unknown> | object>): NotificationDocument[] {
  return records.map((item) => {
    const record = item as Record<string, unknown>;
    return ({
    id: String(record.id),
    userUid: String(record.userId || record.userUid),
    title: String(record.title || ""),
    body: String(record.body || ""),
    kind:
      record.tone === "warning" || record.tone === "success" ? record.tone : "info",
    read: Boolean(record.read),
    createdAt: String(record.createdAt || new Date().toISOString()),
    relatedCaseId: typeof record.relatedCaseId === "string" ? record.relatedCaseId : undefined,
    actionHref: typeof record.actionHref === "string" ? record.actionHref : undefined,
  })});
}

function normalizeSeedReminders(records: Array<Record<string, unknown> | object>): ReminderDocument[] {
  return records.map((item) => {
    const record = item as Record<string, unknown>;
    return ({
    id: String(record.id),
    caseId: String(record.caseId || ""),
    userUid: String(record.userId || record.userUid),
    title: String(record.title || ""),
    body: String(record.body || ""),
    kind:
      record.tone === "warning" || record.tone === "success" ? record.tone : "info",
    read: Boolean(record.read),
    createdAt: String(record.createdAt || new Date().toISOString()),
    actionHref: typeof record.actionHref === "string" ? record.actionHref : undefined,
  })});
}

function normalizeSeedChat(records: Array<Record<string, unknown> | object>): ChatMessageDocument[] {
  return records.map((item) => {
    const record = item as Record<string, unknown>;
    return ({
    id: String(record.id),
    caseId: typeof record.caseId === "string" ? record.caseId : undefined,
    userUid: String(record.userId || record.userUid),
    role: record.role === "assistant" ? "assistant" : "user",
    senderType: record.role === "assistant" ? "assistant" : "citizen",
    content: String(record.body || record.content || ""),
    model: typeof record.model === "string" ? record.model : undefined,
    createdAt: String(record.createdAt || new Date().toISOString()),
    threadKey: String(record.threadKey || "dashboard"),
    attachments: Array.isArray(record.attachments)
      ? record.attachments.filter((value): value is string => typeof value === "string")
      : [],
    metadata: {},
  })});
}

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

async function seedIfEmpty() {
  const db = await getMongoDb();
  const dataset = getPrototypeStore();
  const legacyFilesCollection = db.collection<FileDocument>("files");
  const filesMetadataCollection = db.collection<FileDocument>("files_metadata");

  const counts = await Promise.all([
    db.collection<UserDocument>("users").countDocuments(),
    db.collection<CaseDocument>("cases").countDocuments(),
    db.collection<CaseEventDocument>("case_events").countDocuments(),
    filesMetadataCollection.countDocuments(),
    db.collection<NotificationDocument>("notifications").countDocuments(),
    db.collection<ReminderDocument>("reminders").countDocuments(),
    db.collection<ChatMessageDocument>("chat_messages").countDocuments(),
  ]);

  const legacyFilesCount = await legacyFilesCollection.countDocuments();

  if (counts[3] === 0 && legacyFilesCount > 0) {
    const legacyFiles = await legacyFilesCollection.find({}).toArray();
    await filesMetadataCollection.insertMany(
      legacyFiles.map((record) =>
        normalizeSeedFiles([
          {
            ...record,
            id: record.id,
            name: record.filename,
            contentType: record.mimeType,
            sizeBytes: record.size,
            status: record.reviewStatus,
            notes: record.reviewNote,
          },
        ])[0]
      ),
      { ordered: false }
    );
  }

  if (counts.every((count) => count > 0)) return;

  if (counts[0] === 0 && dataset.users.length) {
    await db.collection<UserDocument>("users").insertMany(normalizeSeedUsers(dataset.users), {
      ordered: false,
    });
  }

  if (counts[1] === 0 && dataset.cases.length) {
    await db.collection<CaseDocument>("cases").insertMany(normalizeSeedCases(dataset.cases), {
      ordered: false,
    });
  }

  if (counts[2] === 0 && dataset.caseEvents.length) {
    await db
      .collection<CaseEventDocument>("case_events")
      .insertMany(normalizeSeedEvents(dataset.caseEvents), { ordered: false });
  }

  if (counts[3] === 0 && legacyFilesCount === 0 && dataset.files.length) {
    await filesMetadataCollection.insertMany(normalizeSeedFiles(dataset.files), {
      ordered: false,
    });
  }

  if (counts[4] === 0 && dataset.notifications.length) {
    await db
      .collection<NotificationDocument>("notifications")
      .insertMany(normalizeSeedNotifications(dataset.notifications), { ordered: false });
  }

  if (counts[5] === 0 && dataset.reminders.length) {
    await db
      .collection<ReminderDocument>("reminders")
      .insertMany(normalizeSeedReminders(dataset.reminders), { ordered: false });
  }

  if (counts[6] === 0 && dataset.chatSeeds.length) {
    await db
      .collection<ChatMessageDocument>("chat_messages")
      .insertMany(normalizeSeedChat(dataset.chatSeeds), { ordered: false });
  }
}

async function ensureCaseVisibilityDefaults() {
  const db = await getMongoDb();
  await db
    .collection<CaseDocument>("cases")
    .updateMany({ isHidden: { $exists: false } }, { $set: { isHidden: false } });
}

async function bootstrapMongoCollections() {
  await ensureIndexes();
  await seedIfEmpty();
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
