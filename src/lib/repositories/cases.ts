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
import { createNotificationForUser } from "@/lib/repositories/notifications";
import {
  getPrototypeCaseById,
  listPrototypeCases,
  listPrototypeCasesForCitizen,
  listPrototypeCaseEvents,
  listPrototypeChatMessagesForThread,
  listPrototypeFilesForCase,
  listPrototypeRemindersForCase,
  listPrototypeRemindersForUser,
  pushPrototypeCase,
  pushPrototypeCaseEvent,
  pushPrototypeChatMessage,
  pushPrototypeFiles,
  pushPrototypeReminder,
} from "@/lib/prototype/repository";
import type {
  PrototypeAssistantMessageRecord,
  PrototypeCaseEventRecord,
  PrototypeCaseRecord,
  PrototypeFileRecord,
  PrototypeReminderRecord,
} from "@/types/prototype";

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

function getCaseEvents(caseId: string): PrototypeCaseEventRecord[] {
  return listPrototypeCaseEvents(caseId);
}

function getCaseFiles(caseId: string): PrototypeFileRecord[] {
  return listPrototypeFilesForCase(caseId);
}

function getCaseReminders(caseId: string): PrototypeReminderRecord[] {
  return listPrototypeRemindersForCase(caseId);
}

function mapCaseRecord(base: PrototypeCaseRecord): CaseItem {
  const timeline = sortEvents(
    getCaseEvents(base.id).map((item) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      description: item.description,
      createdAt: item.createdAt,
      actor: item.actor,
      actorId: item.actorId,
    }))
  );

  return {
    ...base,
    evidence: getCaseFiles(base.id),
    timeline,
    reminders: getCaseReminders(base.id).map((item) => item.body),
  };
}

function getAllCases() {
  return listPrototypeCases().map(mapCaseRecord);
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

function computeAdminStats(cases: CaseItem[]): DashboardStat[] {
  const total = cases.length;
  const needsReview = cases.filter((item) =>
    ["submitted", "reviewing", "need_more_docs"].includes(item.status)
  ).length;
  const inProgress = cases.filter((item) => item.status === "in_progress").length;
  const resolved = cases.filter((item) => item.status === "resolved").length;
  const urgent = cases.filter((item) => item.intake.urgency === "high").length;

  return [
    { label: "Total queue", value: String(total), change: "All seeded operational records" },
    { label: "Needs review", value: String(needsReview), change: "Open packets awaiting action" },
    { label: "In progress", value: String(inProgress), change: "Already assigned to a desk" },
    { label: "Resolved", value: String(resolved), change: "Closed with citizen outcome" },
    { label: "Urgent items", value: String(urgent), change: "High-priority service issues" },
  ];
}

function getCasesForCitizen(citizenId: string) {
  return listPrototypeCasesForCitizen(citizenId).map(mapCaseRecord);
}

export async function getCitizenDashboardData(
  session: AppSession
): Promise<CitizenDashboardData> {
  const cases = getCasesForCitizen(session.uid);
  const activeCase =
    cases.find((item) =>
      ["submitted", "reviewing", "need_more_docs", "routed", "in_progress"].includes(
        item.status
      )
    ) || null;
  const recentFiles = cases
    .flatMap((item) => item.evidence)
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
    .slice(0, 6);
  const recentActivity = cases
    .flatMap((item) => item.timeline)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6);
  const reminders: NotificationItem[] = listPrototypeRemindersForUser(session.uid)
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
  return getCasesForCitizen(citizenId);
}

export async function getCitizenCaseById(citizenId: string, caseId: string) {
  const item = getAllCases().find(
    (candidate) => candidate.id === caseId && candidate.citizenId === citizenId
  );
  return item || null;
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const queue = getAllCases();
  const filesNeedingReview = queue
    .flatMap((item) => item.evidence)
    .filter((file) => ["uploaded", "under_review", "needs_replacement"].includes(file.status))
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
    .slice(0, 8);
  const recentActivity = queue
    .flatMap((item) => item.timeline)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8);

  return {
    stats: computeAdminStats(queue),
    queue,
    filesNeedingReview,
    recentActivity,
    suggestedActions: [
      "Use the AI helper to produce a citizen-facing summary before requesting more documents.",
      "Check files needing review first to keep the queue moving cleanly.",
      "Route high-urgency packets early so field teams see them quickly.",
    ],
  };
}

export async function getAdminCaseById(caseId: string) {
  const item = getPrototypeCaseById(caseId);
  return item ? mapCaseRecord(item) : null;
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
  pushPrototypeCaseEvent({
    id: `evt-${Math.random().toString(36).slice(2, 10)}`,
    caseId,
    ...event,
  });
}

export async function createCaseRecord(payload: CreateCasePayload) {
  const createdAt = isoNow();
  const evidence = payload.evidence.map((item) => ({
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
  })) satisfies PrototypeFileRecord[];

  const caseRecord: PrototypeCaseRecord = {
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
        channel: "prototype-web",
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

  pushPrototypeCase(caseRecord);
  pushPrototypeFiles(evidence);

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

  pushPrototypeReminder({
    id: `reminder-${Math.random().toString(36).slice(2, 10)}`,
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
    throw new Error("Unable to read back the newly created prototype case.");
  }

  return created;
}

export async function addEvidenceToCase(caseId: string, evidence: EvidenceFile[]) {
  const caseRecord = getPrototypeCaseById(caseId);
  if (!caseRecord) throw new Error("Case not found.");

  const files = evidence.map((item) => ({
    ...item,
    caseId,
    ownerUid: caseRecord.citizenId,
  })) satisfies PrototypeFileRecord[];

  pushPrototypeFiles(files);
  caseRecord.updatedAt = isoNow();
  caseRecord.progress = Math.min(100, Math.max(caseRecord.progress, 36));
  caseRecord.intake.missingDocuments = [];

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
  const caseRecord = getPrototypeCaseById(payload.caseId);
  if (!caseRecord) throw new Error("Case not found.");

  const config = actionConfig[payload.action];
  const now = isoNow();
  caseRecord.updatedAt = now;
  caseRecord.updatedBy = payload.actorId;

  if (config.status) caseRecord.status = config.status;
  if (typeof config.progress === "number") caseRecord.progress = config.progress;
  if (payload.note) caseRecord.latestInternalNote = payload.note;

  if (payload.action === "request_more_documents" && payload.note) {
    caseRecord.intake.missingDocuments = Array.from(
      new Set([...caseRecord.intake.missingDocuments, payload.note])
    );
    pushPrototypeReminder({
      id: `reminder-${Math.random().toString(36).slice(2, 10)}`,
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
  const file = listPrototypeFilesForCase(input.caseId).find((item) => item.id === input.fileId);
  const caseRecord = getPrototypeCaseById(input.caseId);

  if (!file || !caseRecord) {
    throw new Error("File record not found.");
  }

  const now = isoNow();
  file.status = input.status;
  file.notes = input.note || file.notes;
  file.reviewedAt = now;
  file.reviewedBy = input.actorId;
  caseRecord.updatedAt = now;
  caseRecord.updatedBy = input.actorId;

  if (input.status === "needs_replacement" && input.note) {
    caseRecord.status = "need_more_docs";
    caseRecord.intake.missingDocuments = Array.from(
      new Set([...caseRecord.intake.missingDocuments, input.note])
    );
  }

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
  return listPrototypeChatMessagesForThread({
    caseId,
    threadKey: `case:${caseId}`,
  })
    .map((item) => ({
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
  return listPrototypeChatMessagesForThread({
    userId,
    threadKey: "dashboard",
  })
    .map((item) => ({
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
  const record: PrototypeAssistantMessageRecord = {
    id: `chat-${Math.random().toString(36).slice(2, 10)}`,
    userId: input.userId,
    role: input.role,
    body: input.body,
    createdAt,
    caseId: input.caseId,
    threadKey: input.caseId ? `case:${input.caseId}` : "dashboard",
    attachments: input.attachments || [],
  };

  pushPrototypeChatMessage(record);
  return {
    id: record.id,
    role: record.role,
    body: record.body,
    createdAt: record.createdAt,
    caseId: record.caseId,
    threadKey: record.threadKey,
    attachments: record.attachments,
  };
}
