import "server-only";

import { randomUUID } from "node:crypto";
import type { Filter } from "mongodb";

import type {
  AdminDashboardData,
  AppSession,
  AssistantMessage,
  CaseEvent,
  CaseItem,
  CaseStatus,
  CitizenDashboardData,
  DashboardStat,
  EvidenceFile,
  NotificationItem,
} from "@/lib/types";
import { appendChatMessageRecord, listChatMessagesForThread } from "@/lib/repositories/chat";
import { getMongoCollections } from "@/lib/repositories/bootstrap";
import { insertFiles, listFilesForCase, updateFileById } from "@/lib/repositories/files";
import {
  createNotificationForUser,
  createReminderForUser,
  listRemindersForCase,
  listRemindersForUser,
} from "@/lib/repositories/notifications";
import { getAdminUserOverview } from "@/lib/repositories/users";
import type { AdminNoteDocument, CaseDocument, ChatMessageDocument, FileDocument } from "@/types/models";

function toPlainRecord<T extends object>(record: T) {
  const plain = { ...(record as T & { _id?: unknown }) };
  delete plain._id;
  return plain as T;
}

function isoNow() {
  return new Date().toISOString();
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function mapFileToEvidence(file: FileDocument): EvidenceFile {
  return {
    id: file.id,
    gridFsFileId: file.gridFsFileId,
    caseId: file.caseId,
    ownerUid: file.ownerUid,
    name: file.filename,
    kind: file.kind,
    sizeLabel: formatFileSize(file.size),
    sizeBytes: file.size,
    uploadedAt: file.uploadedAt,
    status: file.reviewStatus,
    category: file.category,
    reviewedAt: file.reviewedAt,
    reviewedBy: file.reviewedBy,
    notes: file.reviewNote,
    downloadUrl: file.gridFsFileId ? `/api/files/${file.id}` : undefined,
    contentType: file.mimeType,
  };
}

function mapEvent(record: {
  id: string;
  eventType: string;
  label: string;
  description: string;
  createdAt: string;
  metadata?: Record<string, string | number | boolean | string[] | null>;
  actorUid?: string;
}) {
  return {
    id: record.id,
    type:
      record.eventType === "upload" || record.eventType === "routing" || record.eventType === "note"
        ? record.eventType
        : "status",
    title: record.label,
    description: record.description,
    createdAt: record.createdAt,
    actor:
      typeof record.metadata?.actorName === "string" ? record.metadata.actorName : "MyGOV",
    actorId: record.actorUid,
  } satisfies CaseEvent;
}

function normalizeCaseIntake(base: CaseDocument): CaseItem["intake"] {
  const fallbackMissingDocuments = Array.isArray(base.missingDocuments)
    ? base.missingDocuments
    : [];
  const intake = base.intake || {
    citizenSummary: base.summary,
    adminSummary: base.adminSummary || base.summary,
    category: "General",
    urgency: "medium" as const,
    missingDocuments: fallbackMissingDocuments,
    structuredIntake: {},
  };

  return {
    citizenSummary:
      typeof intake.citizenSummary === "string" && intake.citizenSummary.trim()
        ? intake.citizenSummary
        : base.summary,
    adminSummary:
      (typeof base.adminSummary === "string" && base.adminSummary.trim()
        ? base.adminSummary
        : undefined) ||
      (typeof intake.adminSummary === "string" && intake.adminSummary.trim()
        ? intake.adminSummary
        : base.summary),
    category:
      typeof intake.category === "string" && intake.category.trim()
        ? intake.category
        : "General",
    urgency:
      intake.urgency === "low" || intake.urgency === "high" ? intake.urgency : "medium",
    missingDocuments: Array.isArray(intake.missingDocuments)
      ? intake.missingDocuments
      : fallbackMissingDocuments,
    structuredIntake:
      intake.structuredIntake && typeof intake.structuredIntake === "object"
        ? intake.structuredIntake
        : {},
  };
}

function compareByCreatedAtDesc<T extends { createdAt: string }>(left: T, right: T) {
  return right.createdAt.localeCompare(left.createdAt);
}

function compareByUploadedAtDesc<T extends { uploadedAt: string }>(left: T, right: T) {
  return right.uploadedAt.localeCompare(left.uploadedAt);
}

async function listCaseEvents(caseIds: string[]) {
  if (!caseIds.length) return [];
  const { caseEvents } = await getMongoCollections();
  const records = await caseEvents.find({ caseId: { $in: caseIds } }).sort({ createdAt: 1 }).toArray();
  return records.map((record) => mapEvent(toPlainRecord(record)));
}

async function hydrateSingleCase(base: CaseDocument): Promise<CaseItem> {
  const [evidence, timeline, reminders] = await Promise.all([
    listFilesForCase(base.id),
    listCaseEvents([base.id]),
    listRemindersForCase(base.id),
  ]);
  const intake = normalizeCaseIntake(base);

  return {
    id: base.id,
    reference: base.reference,
    isHidden: base.isHidden,
    title: base.title,
    type: base.type,
    status: base.status,
    location: base.location,
    locationMeta: base.locationMeta
      ? {
          locationText: base.locationMeta.locationText,
          formattedAddress: base.locationMeta.formattedAddress,
          placeId: base.locationMeta.placeId,
          lat: base.locationMeta.lat,
          lng: base.locationMeta.lng,
          timezoneId: base.locationMeta.timezoneId,
          nearbyLandmark: base.locationMeta.nearbyLandmark,
          mapZoom: base.locationMeta.mapZoom,
        }
      : undefined,
    createdAt: base.createdAt,
    updatedAt: base.updatedAt,
    summary: base.summary,
    citizenId: base.citizenUid,
    citizenName: base.citizenName,
    assignedUnit: base.assignedUnit,
    progress: base.progress,
    reminders: reminders.map((item) => item.body),
    evidence: evidence.map(mapFileToEvidence),
    timeline,
    intake,
    latestInternalNote: base.latestInternalNote,
    updatedBy: base.updatedBy,
  };
}

interface ListCaseOptions {
  includeHidden?: boolean;
  hiddenOnly?: boolean;
  limit?: number;
}

function buildCaseVisibilityQuery(options?: ListCaseOptions): Filter<CaseDocument> {
  if (options?.hiddenOnly) {
    return { isHidden: true };
  }

  if (options?.includeHidden) {
    return {};
  }

  return { isHidden: { $ne: true } };
}

async function listAllCases(options?: ListCaseOptions) {
  const { cases } = await getMongoCollections();
  const cursor = cases.find(buildCaseVisibilityQuery(options)).sort({ updatedAt: -1 });
  if (typeof options?.limit === "number" && options.limit > 0) {
    cursor.limit(options.limit);
  }
  const records = await cursor.toArray();
  return Promise.all(records.map((record) => hydrateSingleCase(toPlainRecord(record))));
}

async function listCasesForCitizen(citizenUid: string, options?: Omit<ListCaseOptions, "hiddenOnly">) {
  const { cases } = await getMongoCollections();
  const cursor = cases
    .find({
      citizenUid,
      ...buildCaseVisibilityQuery(options),
    })
    .sort({ updatedAt: -1 });
  if (typeof options?.limit === "number" && options.limit > 0) {
    cursor.limit(options.limit);
  }
  const records = await cursor.toArray();
  return Promise.all(records.map((record) => hydrateSingleCase(toPlainRecord(record))));
}

async function getCaseById(caseId: string, options?: Pick<ListCaseOptions, "includeHidden">) {
  const { cases } = await getMongoCollections();
  const record = await cases.findOne({
    id: caseId,
    ...buildCaseVisibilityQuery(options),
  });
  if (!record) return null;
  return hydrateSingleCase(toPlainRecord(record));
}

function computeCitizenStats(cases: CaseItem[]): DashboardStat[] {
  const total = cases.length;
  const active = cases.filter((item) =>
    ["submitted", "reviewing", "need_more_docs", "routed", "in_progress"].includes(item.status)
  ).length;
  const needsAction = cases.filter((item) => item.status === "need_more_docs").length;
  const resolved = cases.filter((item) => item.status === "resolved").length;

  return [
    { label: "Total cases", value: String(total), change: "Across all active and closed requests" },
    { label: "Active cases", value: String(active), change: "Moving through review or routing" },
    { label: "Needs action", value: String(needsAction), change: "Waiting for your follow-up" },
    { label: "Resolved", value: String(resolved), change: "Completed and confirmed" },
  ];
}

function computeAdminStats(
  cases: CaseItem[],
  userOverview?: { totalUsers: number; totalAdmins: number; newCitizensThisWeek: number }
): DashboardStat[] {
  const total = cases.length;
  const needsReview = cases.filter((item) => ["submitted", "reviewing"].includes(item.status)).length;
  const waitingOnCitizen = cases.filter((item) => item.status === "need_more_docs").length;
  const inProgress = cases.filter((item) => item.status === "in_progress").length;
  const resolved = cases.filter((item) => item.status === "resolved").length;
  const urgent = cases.filter((item) => item.intake.urgency === "high").length;

  return [
    { label: "Total cases", value: String(total), change: "All operational records" },
    { label: "Needs review", value: String(needsReview), change: "Fresh packets awaiting triage" },
    {
      label: "Waiting on citizen",
      value: String(waitingOnCitizen),
      change: "Follow-up documents or clarification requested",
    },
    { label: "In progress", value: String(inProgress), change: "Already assigned to a desk" },
    { label: "Resolved", value: String(resolved), change: "Closed with citizen outcome" },
    { label: "Urgent items", value: String(urgent), change: "High-priority service issues" },
    {
      label: "Total users",
      value: String(userOverview?.totalUsers || 0),
      change: "Citizen and admin accounts in MongoDB",
    },
    {
      label: "Total admins",
      value: String(userOverview?.totalAdmins || 0),
      change: "Operational access holders",
    },
    {
      label: "New citizens",
      value: String(userOverview?.newCitizensThisWeek || 0),
      change: "Created during the last 7 days",
    },
  ];
}

export async function getCitizenDashboardData(session: AppSession): Promise<CitizenDashboardData> {
  const cases = await listCasesForCitizen(session.uid);
  const activeCase =
    cases.find((item) =>
      ["submitted", "reviewing", "need_more_docs", "routed", "in_progress"].includes(item.status)
    ) || null;
  const recentFiles = cases.flatMap((item) => item.evidence).sort(compareByUploadedAtDesc).slice(0, 6);
  const recentActivity = cases.flatMap((item) => item.timeline).sort(compareByCreatedAtDesc).slice(0, 6);
  const reminders: NotificationItem[] = (await listRemindersForUser(session.uid)).slice(0, 4).map((item) => ({
    id: item.id,
    title: item.title,
    body: item.body,
    createdAt: item.createdAt,
    read: item.read,
    tone: item.kind,
    actionHref: item.actionHref,
  }));
  const missingDocuments = Array.from(new Set(cases.flatMap((item) => item.intake.missingDocuments))).slice(0, 4);

  return {
    stats: computeCitizenStats(cases),
    cases,
    reminders,
    activeCase,
    recentFiles,
    recentActivity,
    recommendedActions: [
      activeCase
        ? `Prioritize the next step for ${activeCase.title}.`
        : "Create your first case to begin the guided workflow.",
      missingDocuments.length
        ? `Prepare these missing items next: ${missingDocuments.join(", ")}.`
        : "Your active packets currently show no missing-document flags.",
      recentFiles.length
        ? "Ask the assistant to summarize your uploaded evidence before you respond."
        : "Upload at least one strong supporting document or image for better routing context.",
    ],
    profileNeedsAttention: false,
  };
}

export async function listCitizenCases(citizenId: string) {
  return listCasesForCitizen(citizenId);
}

export async function getCitizenCaseById(citizenId: string, caseId: string) {
  const item = await getCaseById(caseId);
  return item && item.citizenId === citizenId ? item : null;
}

export async function listAdminCases(options?: ListCaseOptions) {
  return listAllCases({ includeHidden: true, ...options });
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const queue = await listAllCases();
  const userOverview = await getAdminUserOverview();
  const filesNeedingReview = queue
    .flatMap((item) => item.evidence)
    .filter((file) => ["uploaded", "under_review", "needs_replacement"].includes(file.status))
    .sort(compareByUploadedAtDesc)
    .slice(0, 8);
  const recentActivity = queue.flatMap((item) => item.timeline).sort(compareByCreatedAtDesc).slice(0, 8);
  const queueBuckets = {
    recentIncoming: queue.filter((item) => item.status === "submitted").slice(0, 4),
    needsCitizenResponse: queue.filter((item) => item.status === "need_more_docs").slice(0, 4),
    urgentCases: queue.filter((item) => item.intake.urgency === "high" && item.status !== "resolved").slice(0, 4),
    stalledCases: queue
      .filter((item) => {
        const updated = Date.parse(item.updatedAt);
        return Number.isFinite(updated) && Date.now() - updated >= 48 * 60 * 60 * 1000;
      })
      .slice(0, 4),
  };

  return {
    stats: computeAdminStats(queue, userOverview),
    queue,
    filesNeedingReview,
    recentActivity,
    queueBuckets,
    roleActivity: userOverview.recentRoleChanges,
    suggestedActions: [
      "Use the AI helper to prepare a concise officer summary before you request more documents.",
      "Clear file reviews first so blocked cases can move from intake into desk assignment.",
      "Check urgent and stalled packets at the start of each shift to prevent silent queue aging.",
    ],
  };
}

export async function getAdminCaseById(caseId: string) {
  return getCaseById(caseId, { includeHidden: true });
}

export interface CreateCasePayload {
  id: string;
  title: string;
  type: CaseItem["type"];
  location: string;
  locationMeta?: CaseItem["locationMeta"];
  summary: string;
  citizenId: string;
  citizenName: string;
  evidence: Array<{
    id: string;
    gridFsFileId?: string;
    name: string;
    kind: EvidenceFile["kind"];
    size: number;
    downloadUrl?: string;
    contentType?: string;
  }>;
}

export function buildEvidenceFile(input: {
  id: string;
  gridFsFileId?: string;
  name: string;
  kind: EvidenceFile["kind"];
  size: number;
  uploadedAt?: string;
  downloadUrl?: string;
  contentType?: string;
}): EvidenceFile {
  return {
    id: input.id,
    gridFsFileId: input.gridFsFileId,
    name: input.name,
    kind: input.kind,
    sizeLabel: formatFileSize(input.size),
    sizeBytes: input.size,
    uploadedAt: input.uploadedAt || isoNow(),
    status: "uploaded",
    downloadUrl: input.downloadUrl,
    contentType: input.contentType,
  };
}

function createCaseReference() {
  const year = new Date().getFullYear();
  const suffix = Math.random().toString().slice(2, 6);
  return `MYGOV-${year}-${suffix}`;
}

export async function appendCaseEvent(
  caseId: string,
  event: {
    type: "status" | "note" | "upload" | "routing";
    title: string;
    description: string;
    createdAt: string;
    actor: string;
    actorId?: string;
    actorRole?: "citizen" | "admin";
    metadata?: Record<string, string | number | boolean | string[] | null>;
  }
) {
  const { caseEvents } = await getMongoCollections();
  await caseEvents.insertOne({
    id: `evt-${randomUUID().slice(0, 8)}`,
    caseId,
    actorUid: event.actorId,
    actorRole: event.actorRole,
    eventType: event.type,
    label: event.title,
    description: event.description,
    createdAt: event.createdAt,
    metadata: {
      ...(event.metadata || {}),
      actorName: event.actor,
    },
  });
}

export async function createCaseRecord(payload: CreateCasePayload) {
  const { cases } = await getMongoCollections();
  const createdAt = isoNow();
  const evidence: FileDocument[] = payload.evidence.map((item) => ({
    id: item.id,
    fileId: item.id,
    gridFsFileId: item.gridFsFileId,
    caseId: payload.id,
    ownerUid: payload.citizenId,
    filename: item.name,
    mimeType: item.contentType,
    size: item.size,
    uploadedAt: createdAt,
    category:
      item.kind === "photo"
        ? "Evidence photo"
        : item.kind === "voice_note"
          ? "Voice note"
          : "Supporting document",
    kind: item.kind,
    reviewStatus: "uploaded",
    uploadedByRole: "citizen",
  }));

  const missingDocuments = evidence.length ? [] : ["At least one supporting file"];
  const caseRecord: CaseDocument = {
    id: payload.id,
    reference: createCaseReference(),
    isHidden: false,
    title: payload.title,
    type: payload.type,
    status: "submitted",
    location: payload.location,
    locationMeta: payload.locationMeta,
    createdAt,
    updatedAt: createdAt,
    summary: payload.summary,
    citizenUid: payload.citizenId,
    citizenName: payload.citizenName,
    assignedUnit: "MyGOV Digital Triage Desk",
    progress: evidence.length ? 28 : 18,
    evidenceCount: evidence.length,
    missingDocuments,
    currentStep: "submitted",
    intake: {
      citizenSummary: payload.summary,
      adminSummary: `New ${payload.type.replaceAll("_", " ")} case created by ${payload.citizenName}. Evidence packet is ready for triage review.`,
      category:
        payload.type === "flood_relief"
          ? "Disaster assistance"
          : payload.type === "reminder_renewal"
            ? "Renewal support"
            : "Public complaint",
      urgency: payload.type === "flood_relief" ? "high" : "medium",
      missingDocuments,
      structuredIntake: {
        channel: "citizen-web",
        capturedAt: createdAt,
        locationText: payload.location,
        formattedAddress: payload.locationMeta?.formattedAddress || payload.location,
        placeId: payload.locationMeta?.placeId || "",
        coordinates:
          typeof payload.locationMeta?.lat === "number" &&
          typeof payload.locationMeta?.lng === "number"
            ? [`${payload.locationMeta.lat}`, `${payload.locationMeta.lng}`]
            : [],
      },
    },
    latestInternalNote: "Awaiting first admin review.",
    updatedBy: payload.citizenId,
  };

  await cases.insertOne(caseRecord);
  await insertFiles(evidence);

  await appendCaseEvent(payload.id, {
    type: "status",
    title: "Case submitted",
    description: "Citizen created a new case from the guided intake flow.",
    createdAt,
    actor: payload.citizenName,
    actorId: payload.citizenId,
    actorRole: "citizen",
  });

  for (const file of evidence) {
    await appendCaseEvent(payload.id, {
      type: "upload",
      title: "Evidence uploaded",
      description: `${file.filename} was attached to the case packet.`,
      createdAt,
      actor: payload.citizenName,
      actorId: payload.citizenId,
      actorRole: "citizen",
    });
  }

  await createReminderForUser({
    caseId: payload.id,
    userId: payload.citizenId,
    title: "Watch for triage updates",
    body: "Your new case is now in the queue. The admin desk will review the packet and may request more documents.",
    createdAt,
    tone: "info",
    read: false,
    actionHref: `/cases/${payload.id}`,
  });

  await createNotificationForUser(payload.citizenId, {
    title: "Case submitted",
    body: `${payload.title} is now visible in your citizen dashboard.`,
    createdAt,
    read: false,
    tone: "info",
    actionHref: `/cases/${payload.id}`,
  });

  const created = await getCitizenCaseById(payload.citizenId, payload.id);
  if (!created) {
    throw new Error("Unable to read back the newly created MongoDB case.");
  }

  return created;
}

export async function addEvidenceToCase(caseId: string, evidence: EvidenceFile[]) {
  const { cases } = await getMongoCollections();
  const caseRecord = await cases.findOne({ id: caseId });
  if (!caseRecord) throw new Error("Case not found.");

  const files: FileDocument[] = evidence.map((item) => ({
    id: item.id,
    fileId: item.id,
    gridFsFileId: item.gridFsFileId,
    caseId,
    ownerUid: caseRecord.citizenUid,
    filename: item.name,
    mimeType: item.contentType,
    size: item.sizeBytes || 0,
    uploadedAt: item.uploadedAt,
    category:
      item.kind === "photo" ? "Evidence photo" : item.kind === "voice_note" ? "Voice note" : "Supporting document",
    kind: item.kind,
    reviewStatus: "uploaded",
    uploadedByRole: "citizen",
  }));

  await insertFiles(files);
  await cases.updateOne(
    { id: caseId },
    {
      $set: {
        updatedAt: isoNow(),
        progress: Math.min(100, Math.max(caseRecord.progress, 36)),
        updatedBy: caseRecord.citizenUid,
        evidenceCount: caseRecord.evidenceCount + files.length,
        missingDocuments: [],
        "intake.missingDocuments": [],
      },
    }
  );

  for (const item of files) {
    await appendCaseEvent(caseId, {
      type: "upload",
      title: "Evidence uploaded",
      description: `${item.filename} was added to the case.`,
      createdAt: item.uploadedAt,
      actor: caseRecord.citizenName,
      actorId: caseRecord.citizenUid,
      actorRole: "citizen",
    });
  }
}

export interface AdminCaseActionPayload {
  caseId: string;
  action:
    | "approve"
    | "reject"
    | "request_more_documents"
    | "route"
    | "mark_in_progress"
    | "resolve"
    | "internal_note";
  note?: string;
  actorName: string;
  actorId: string;
}

const actionConfig: Record<
  AdminCaseActionPayload["action"],
  { status?: CaseStatus; title: string; type: "status" | "note" | "routing"; progress?: number; currentStep?: string }
> = {
  approve: { status: "reviewing", title: "Approved for review", type: "status", progress: 42, currentStep: "reviewing" },
  reject: { status: "rejected", title: "Case rejected", type: "status", progress: 100, currentStep: "rejected" },
  request_more_documents: {
    status: "need_more_docs",
    title: "More documents requested",
    type: "note",
    progress: 54,
    currentStep: "waiting_for_citizen",
  },
  route: { status: "routed", title: "Case routed", type: "routing", progress: 70, currentStep: "routed" },
  mark_in_progress: {
    status: "in_progress",
    title: "Work in progress",
    type: "status",
    progress: 82,
    currentStep: "in_progress",
  },
  resolve: { status: "resolved", title: "Case resolved", type: "status", progress: 100, currentStep: "resolved" },
  internal_note: { title: "Internal note added", type: "note" },
};

export async function applyAdminCaseAction(payload: AdminCaseActionPayload) {
  const { adminNotes, cases } = await getMongoCollections();
  const caseRecord = await cases.findOne({ id: payload.caseId });
  if (!caseRecord) throw new Error("Case not found.");

  const config = actionConfig[payload.action];
  const now = isoNow();
  const nextMissingDocuments =
    payload.action === "request_more_documents" && payload.note
      ? Array.from(new Set([...caseRecord.missingDocuments, payload.note]))
      : caseRecord.missingDocuments;

  const nextUpdate: Partial<CaseDocument> & { "intake.missingDocuments"?: string[] } = {
    updatedAt: now,
    updatedBy: payload.actorId,
    missingDocuments: nextMissingDocuments,
  };

  if (config.status) nextUpdate.status = config.status;
  if (typeof config.progress === "number") nextUpdate.progress = config.progress;
  if (config.currentStep) nextUpdate.currentStep = config.currentStep;
  if (payload.note) nextUpdate.latestInternalNote = payload.note;
  if (nextMissingDocuments !== caseRecord.missingDocuments) {
    nextUpdate["intake.missingDocuments"] = nextMissingDocuments;
  }

  await cases.updateOne({ id: payload.caseId }, { $set: nextUpdate });

  if (payload.note) {
    const noteRecord: AdminNoteDocument = {
      id: `note-${randomUUID().slice(0, 8)}`,
      caseId: payload.caseId,
      actorUid: payload.actorId,
      actorRole: "admin",
      actorName: payload.actorName,
      note: payload.note,
      action: payload.action,
      createdAt: now,
      visibleInTimeline: payload.action !== "internal_note",
    };
    await adminNotes.insertOne(noteRecord);
  }

  if (payload.action === "request_more_documents" && payload.note) {
    await createReminderForUser({
      caseId: payload.caseId,
      userId: caseRecord.citizenUid,
      title: "More information needed",
      body: payload.note,
      createdAt: now,
      tone: "warning",
      read: false,
      actionHref: `/cases/${payload.caseId}`,
    });
  }

  await appendCaseEvent(payload.caseId, {
    type: config.type,
    title: config.title,
    description: payload.note || config.title,
    createdAt: now,
    actor: payload.actorName,
    actorId: payload.actorId,
    actorRole: "admin",
  });

  await createNotificationForUser(caseRecord.citizenUid, {
    title: config.title,
    body: payload.note || `${caseRecord.title} was updated by the review team.`,
    createdAt: now,
    read: false,
    tone: payload.action === "reject" ? "warning" : payload.action === "resolve" ? "success" : "info",
    actionHref: `/cases/${payload.caseId}`,
  });

  return { ok: true };
}

export async function updateEvidenceReviewStatus(input: {
  caseId: string;
  fileId: string;
  status: EvidenceFile["status"];
  note?: string;
  actorName: string;
  actorId: string;
}) {
  const { cases, filesMetadata } = await getMongoCollections();
  const [file, caseRecord] = await Promise.all([
    filesMetadata.findOne({ id: input.fileId, caseId: input.caseId }),
    cases.findOne({ id: input.caseId }),
  ]);

  if (!file || !caseRecord) throw new Error("File record not found.");

  const now = isoNow();
  await updateFileById(input.fileId, {
    reviewStatus: input.status,
    reviewNote: input.note || file.reviewNote,
    reviewedAt: now,
    reviewedBy: input.actorId,
  });

  const caseUpdate: Partial<CaseDocument> & { "intake.missingDocuments"?: string[] } = {
    updatedAt: now,
    updatedBy: input.actorId,
  };

  if (input.status === "needs_replacement" && input.note) {
    caseUpdate.status = "need_more_docs";
    caseUpdate.currentStep = "waiting_for_replacement";
    caseUpdate.missingDocuments = Array.from(new Set([...caseRecord.missingDocuments, input.note]));
    caseUpdate["intake.missingDocuments"] = caseUpdate.missingDocuments;

    await createReminderForUser({
      caseId: input.caseId,
      userId: caseRecord.citizenUid,
      title: "Replacement file needed",
      body: input.note,
      createdAt: now,
      tone: "warning",
      read: false,
      actionHref: `/cases/${input.caseId}`,
    });

    await createNotificationForUser(caseRecord.citizenUid, {
      title: "A file needs replacement",
      body: `${file.filename} needs a better copy before the case can move forward.`,
      createdAt: now,
      read: false,
      tone: "warning",
      actionHref: `/cases/${input.caseId}`,
    });
  }

  await cases.updateOne({ id: input.caseId }, { $set: caseUpdate });

  await appendCaseEvent(input.caseId, {
    type: "note",
    title: "File review updated",
    description: input.note
      ? `${file.filename} marked as ${input.status}: ${input.note}`
      : `${file.filename} marked as ${input.status}.`,
    createdAt: now,
    actor: input.actorName,
    actorId: input.actorId,
    actorRole: "admin",
  });

  return { ok: true };
}

export async function updateCaseVisibility(input: {
  caseId: string;
  isHidden: boolean;
  actorName: string;
  actorId: string;
}) {
  const { adminNotes, cases } = await getMongoCollections();
  const caseRecord = await cases.findOne({ id: input.caseId });
  if (!caseRecord) throw new Error("Case not found.");

  if (Boolean(caseRecord.isHidden) === input.isHidden) {
    return { ok: true, isHidden: input.isHidden };
  }

  const now = isoNow();

  await cases.updateOne(
    { id: input.caseId },
    {
      $set: {
        isHidden: input.isHidden,
        updatedAt: now,
        updatedBy: input.actorId,
      },
    }
  );

  const noteRecord: AdminNoteDocument = {
    id: `note-${randomUUID().slice(0, 8)}`,
    caseId: input.caseId,
    actorUid: input.actorId,
    actorRole: "admin",
    actorName: input.actorName,
    note: input.isHidden
      ? "Case hidden from citizen and admin visible queues."
      : "Case restored to citizen and admin visible queues.",
    action: input.isHidden ? "hide_case" : "unhide_case",
    createdAt: now,
    visibleInTimeline: false,
  };

  await adminNotes.insertOne(noteRecord);

  return { ok: true, isHidden: input.isHidden };
}

export async function listCaseAssistantMessages(caseId: string): Promise<AssistantMessage[]> {
  const records = await listChatMessagesForThread({ caseId, threadKey: `case:${caseId}` });
  return records.map((item) => ({
    id: item.id,
    role: item.role,
    body: item.content,
    createdAt: item.createdAt,
    caseId: item.caseId,
    threadKey: item.threadKey,
    attachments: item.attachments,
  }));
}

export async function listDashboardAssistantMessages(userId: string): Promise<AssistantMessage[]> {
  const records = await listChatMessagesForThread({ userId, threadKey: "dashboard" });
  return records.map((item) => ({
    id: item.id,
    role: item.role,
    body: item.content,
    createdAt: item.createdAt,
    caseId: item.caseId,
    threadKey: item.threadKey,
    attachments: item.attachments,
  }));
}

export async function appendAssistantMessage(input: {
  userId: string;
  role: AssistantMessage["role"];
  body: string;
  caseId?: string;
  attachments?: string[];
  model?: string;
  source?: "gemini" | "prototype-fallback";
}) {
  const createdAt = isoNow();
  const record: ChatMessageDocument = {
    id: `chat-${randomUUID().slice(0, 8)}`,
    userUid: input.userId,
    role: input.role,
    senderType: input.role === "assistant" ? "assistant" : "citizen",
    content: input.body,
    model: input.model,
    createdAt,
    caseId: input.caseId,
    threadKey: input.caseId ? `case:${input.caseId}` : "dashboard",
    attachments: input.attachments || [],
    metadata: input.source ? { source: input.source } : {},
  };

  return appendChatMessageRecord(record);
}
