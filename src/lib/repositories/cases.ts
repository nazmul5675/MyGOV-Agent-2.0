import "server-only";

import { randomUUID } from "node:crypto";

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
import { insertFiles, listFilesForCase, listFilesForCases, updateFileById } from "@/lib/repositories/files";
import {
  createNotificationForUser,
  createReminderForUser,
  listRemindersForCase,
  listRemindersForUser,
} from "@/lib/repositories/notifications";
import { getAdminUserOverview } from "@/lib/repositories/users";
import type {
  CaseDocument,
  ChatMessageDocument,
  FileDocument,
} from "@/types/models";

function isoNow() {
  return new Date().toISOString();
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function sortEvents(events: CaseEvent[]) {
  return events.slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function compareByCreatedAtDesc<T extends { createdAt: string }>(left: T, right: T) {
  return right.createdAt.localeCompare(left.createdAt);
}

function compareByUploadedAtDesc<T extends { uploadedAt: string }>(left: T, right: T) {
  return right.uploadedAt.localeCompare(left.uploadedAt);
}

function groupByCaseId<T extends { caseId: string }>(items: T[]) {
  return items.reduce<Record<string, T[]>>((accumulator, item) => {
    accumulator[item.caseId] ||= [];
    accumulator[item.caseId].push(item);
    return accumulator;
  }, {});
}

async function listCaseEvents(caseIds: string[]) {
  if (!caseIds.length) return [];
  const { caseEvents } = await getMongoCollections();
  return caseEvents.find({ caseId: { $in: caseIds } }).sort({ createdAt: 1 }).toArray();
}

async function hydrateCases(baseCases: CaseDocument[]): Promise<CaseItem[]> {
  if (!baseCases.length) return [];

  const caseIds = baseCases.map((item) => item.id);
  const [files, events, reminders] = await Promise.all([
    listFilesForCases(caseIds),
    listCaseEvents(caseIds),
    (async () => {
      const { reminders } = await getMongoCollections();
      return reminders.find({ caseId: { $in: caseIds } }).sort({ createdAt: -1 }).toArray();
    })(),
  ]);

  const filesByCaseId = groupByCaseId(files);
  const eventsByCaseId = groupByCaseId(events);
  const remindersByCaseId = groupByCaseId(reminders);

  return baseCases.map((base) => ({
    ...base,
    evidence: (filesByCaseId[base.id] || []).sort(compareByUploadedAtDesc),
    timeline: sortEvents(eventsByCaseId[base.id] || []),
    reminders: (remindersByCaseId[base.id] || []).map((item) => item.body),
  }));
}

async function listAllCases() {
  const { cases } = await getMongoCollections();
  const records = await cases.find({}).sort({ updatedAt: -1 }).toArray();
  return hydrateCases(records);
}

async function listCasesForCitizen(citizenId: string) {
  const { cases } = await getMongoCollections();
  const records = await cases.find({ citizenId }).sort({ updatedAt: -1 }).toArray();
  return hydrateCases(records);
}

async function getCaseById(caseId: string) {
  const { cases } = await getMongoCollections();
  const record = await cases.findOne({ id: caseId });

  if (!record) return null;

  const [evidence, timeline, reminders] = await Promise.all([
    listFilesForCase(caseId),
    listCaseEvents([caseId]),
    listRemindersForCase(caseId),
  ]);

  return {
    ...record,
    evidence,
    timeline: sortEvents(timeline),
    reminders: reminders.map((item) => item.body),
  } satisfies CaseItem;
}

function computeCitizenStats(cases: CaseItem[]): DashboardStat[] {
  const total = cases.length;
  const active = cases.filter((item) =>
    ["submitted", "reviewing", "need_more_docs", "routed", "in_progress"].includes(
      item.status
    )
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
  userOverview?: {
    totalUsers: number;
    totalAdmins: number;
    newCitizensThisWeek: number;
  }
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

export async function getCitizenDashboardData(
  session: AppSession
): Promise<CitizenDashboardData> {
  const cases = await listCasesForCitizen(session.uid);
  const activeCase =
    cases.find((item) =>
      ["submitted", "reviewing", "need_more_docs", "routed", "in_progress"].includes(
        item.status
      )
    ) || null;
  const recentFiles = cases
    .flatMap((item) => item.evidence)
    .sort(compareByUploadedAtDesc)
    .slice(0, 6);
  const recentActivity = cases
    .flatMap((item) => item.timeline)
    .sort(compareByCreatedAtDesc)
    .slice(0, 6);
  const reminders: NotificationItem[] = (await listRemindersForUser(session.uid))
    .slice(0, 4)
    .map((item) => ({
      id: item.id,
      title: item.title,
      body: item.body,
      createdAt: item.createdAt,
      read: item.read,
      tone: item.tone,
      actionHref: item.actionHref,
    }));
  const missingDocuments = Array.from(
    new Set(cases.flatMap((item) => item.intake.missingDocuments))
  ).slice(0, 4);

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

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const queue = await listAllCases();
  const userOverview = await getAdminUserOverview();
  const filesNeedingReview = queue
    .flatMap((item) => item.evidence)
    .filter((file) => ["uploaded", "under_review", "needs_replacement"].includes(file.status))
    .sort(compareByUploadedAtDesc)
    .slice(0, 8);
  const recentActivity = queue
    .flatMap((item) => item.timeline)
    .sort(compareByCreatedAtDesc)
    .slice(0, 8);
  const queueBuckets = {
    recentIncoming: queue
      .filter((item) => item.status === "submitted")
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, 4),
    needsCitizenResponse: queue
      .filter((item) => item.status === "need_more_docs")
      .sort(compareByCreatedAtDesc)
      .slice(0, 4),
    urgentCases: queue
      .filter((item) => item.intake.urgency === "high" && item.status !== "resolved")
      .sort(compareByCreatedAtDesc)
      .slice(0, 4),
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
  return getCaseById(caseId);
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
    name: string;
    kind: EvidenceFile["kind"];
    size: number;
    downloadUrl?: string;
    storagePath?: string;
    contentType?: string;
  }>;
}

export function buildEvidenceFile(input: {
  id: string;
  name: string;
  kind: EvidenceFile["kind"];
  size: number;
  uploadedAt?: string;
  downloadUrl?: string;
  storagePath?: string;
  contentType?: string;
}): EvidenceFile {
  return {
    id: input.id,
    name: input.name,
    kind: input.kind,
    sizeLabel: formatFileSize(input.size),
    sizeBytes: input.size,
    uploadedAt: input.uploadedAt || isoNow(),
    status: "uploaded",
    downloadUrl: input.downloadUrl,
    storagePath: input.storagePath,
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
  event: Omit<CaseEvent, "id">
) {
  const { caseEvents } = await getMongoCollections();
  await caseEvents.insertOne({
    id: `evt-${randomUUID().slice(0, 8)}`,
    caseId,
    ...event,
  });
}

export async function createCaseRecord(payload: CreateCasePayload) {
  const { cases } = await getMongoCollections();
  const createdAt = isoNow();
  const evidence: FileDocument[] = payload.evidence.map((item) => ({
    ...buildEvidenceFile({
      id: item.id,
      name: item.name,
      kind: item.kind,
      size: item.size,
      uploadedAt: createdAt,
      downloadUrl: item.downloadUrl,
      storagePath: item.storagePath,
      contentType: item.contentType,
    }),
    caseId: payload.id,
    ownerUid: payload.citizenId,
    category:
      item.kind === "photo"
        ? "Evidence photo"
        : item.kind === "voice_note"
          ? "Voice note"
          : "Supporting document",
  }));

  const caseRecord: CaseDocument = {
    id: payload.id,
    reference: createCaseReference(),
    title: payload.title,
    type: payload.type,
    status: "submitted",
    location: payload.location,
    locationMeta: payload.locationMeta,
    createdAt,
    updatedAt: createdAt,
    summary: payload.summary,
    citizenId: payload.citizenId,
    citizenName: payload.citizenName,
    assignedUnit: "MyGOV Digital Triage Desk",
    progress: evidence.length ? 28 : 18,
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
      missingDocuments: evidence.length ? [] : ["At least one supporting file"],
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
  });

  for (const file of evidence) {
    await appendCaseEvent(payload.id, {
      type: "upload",
      title: "Evidence uploaded",
      description: `${file.name} was attached to the case packet.`,
      createdAt,
      actor: payload.citizenName,
      actorId: payload.citizenId,
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
    ...item,
    caseId,
    ownerUid: caseRecord.citizenId,
  }));

  await insertFiles(files);
  await cases.updateOne(
    { id: caseId },
    {
      $set: {
        updatedAt: isoNow(),
        progress: Math.min(100, Math.max(caseRecord.progress, 36)),
        updatedBy: caseRecord.citizenId,
        "intake.missingDocuments": [],
      },
    }
  );

  for (const item of files) {
    await appendCaseEvent(caseId, {
      type: "upload",
      title: "Evidence uploaded",
      description: `${item.name} was added to the case.`,
      createdAt: item.uploadedAt,
      actor: caseRecord.citizenName,
      actorId: caseRecord.citizenId,
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
  { status?: CaseStatus; title: string; type: CaseEvent["type"]; progress?: number }
> = {
  approve: { status: "reviewing", title: "Approved for review", type: "status", progress: 42 },
  reject: { status: "rejected", title: "Case rejected", type: "status", progress: 100 },
  request_more_documents: {
    status: "need_more_docs",
    title: "More documents requested",
    type: "note",
    progress: 54,
  },
  route: { status: "routed", title: "Case routed", type: "routing", progress: 70 },
  mark_in_progress: {
    status: "in_progress",
    title: "Work in progress",
    type: "status",
    progress: 82,
  },
  resolve: { status: "resolved", title: "Case resolved", type: "status", progress: 100 },
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
      ? Array.from(new Set([...caseRecord.intake.missingDocuments, payload.note]))
      : caseRecord.intake.missingDocuments;

  const nextUpdate: Partial<CaseDocument> & {
    "intake.missingDocuments"?: string[];
  } = {
    updatedAt: now,
    updatedBy: payload.actorId,
  };

  if (config.status) nextUpdate.status = config.status;
  if (typeof config.progress === "number") nextUpdate.progress = config.progress;
  if (payload.note) nextUpdate.latestInternalNote = payload.note;
  if (nextMissingDocuments !== caseRecord.intake.missingDocuments) {
    nextUpdate["intake.missingDocuments"] = nextMissingDocuments;
  }

  await cases.updateOne({ id: payload.caseId }, { $set: nextUpdate });

  if (payload.note) {
    await adminNotes.insertOne({
      id: `note-${randomUUID().slice(0, 8)}`,
      caseId: payload.caseId,
      actorId: payload.actorId,
      actorName: payload.actorName,
      note: payload.note,
      action: payload.action,
      createdAt: now,
    });
  }

  if (payload.action === "request_more_documents" && payload.note) {
    await createReminderForUser({
      caseId: payload.caseId,
      userId: caseRecord.citizenId,
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
  });

  await createNotificationForUser(caseRecord.citizenId, {
    title: config.title,
    body: payload.note || `${caseRecord.title} was updated by the review team.`,
    createdAt: now,
    read: false,
    tone:
      payload.action === "reject"
        ? "warning"
        : payload.action === "resolve"
          ? "success"
          : "info",
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
  const { cases, files } = await getMongoCollections();
  const [file, caseRecord] = await Promise.all([
    files.findOne({ id: input.fileId, caseId: input.caseId }),
    cases.findOne({ id: input.caseId }),
  ]);

  if (!file || !caseRecord) {
    throw new Error("File record not found.");
  }

  const now = isoNow();
  await updateFileById(input.fileId, {
    status: input.status,
    notes: input.note || file.notes,
    reviewedAt: now,
    reviewedBy: input.actorId,
  });

  const caseUpdate: Partial<CaseDocument> & {
    "intake.missingDocuments"?: string[];
  } = {
    updatedAt: now,
    updatedBy: input.actorId,
  };

  if (input.status === "needs_replacement" && input.note) {
    caseUpdate.status = "need_more_docs";
    caseUpdate["intake.missingDocuments"] = Array.from(
      new Set([...caseRecord.intake.missingDocuments, input.note])
    );

    await createReminderForUser({
      caseId: input.caseId,
      userId: caseRecord.citizenId,
      title: "Replacement file needed",
      body: input.note,
      createdAt: now,
      tone: "warning",
      read: false,
      actionHref: `/cases/${input.caseId}`,
    });

    await createNotificationForUser(caseRecord.citizenId, {
      title: "A file needs replacement",
      body: `${file.name} needs a better copy before the case can move forward.`,
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
      ? `${file.name} marked as ${input.status}: ${input.note}`
      : `${file.name} marked as ${input.status}.`,
    createdAt: now,
    actor: input.actorName,
    actorId: input.actorId,
  });

  return { ok: true };
}

export async function listCaseAssistantMessages(caseId: string): Promise<AssistantMessage[]> {
  const records = await listChatMessagesForThread({
    caseId,
    threadKey: `case:${caseId}`,
  });

  return records.map((item) => ({
    id: item.id,
    role: item.role,
    body: item.body,
    createdAt: item.createdAt,
    caseId: item.caseId,
    threadKey: item.threadKey,
    attachments: item.attachments,
  }));
}

export async function listDashboardAssistantMessages(userId: string): Promise<AssistantMessage[]> {
  const records = await listChatMessagesForThread({
    userId,
    threadKey: "dashboard",
  });

  return records.map((item) => ({
    id: item.id,
    role: item.role,
    body: item.body,
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
}) {
  const createdAt = isoNow();
  const record: ChatMessageDocument = {
    id: `chat-${randomUUID().slice(0, 8)}`,
    userId: input.userId,
    role: input.role,
    body: input.body,
    createdAt,
    caseId: input.caseId,
    threadKey: input.caseId ? `case:${input.caseId}` : "dashboard",
    attachments: input.attachments || [],
  };

  return appendChatMessageRecord(record);
}
