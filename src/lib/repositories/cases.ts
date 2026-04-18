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
import {
  formatFileSize,
  isoNow,
  requireDb,
} from "@/lib/repositories/firestore-helpers";
import { createNotificationForUser } from "@/lib/repositories/notifications";

function sortEvents(events: CaseEvent[]) {
  return events.slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function mapCaseWithTimeline(base: CaseItem, events?: CaseEvent[]) {
  return {
    ...base,
    timeline: sortEvents(events || base.timeline),
  };
}

function normaliseEvidenceFile(caseId: string, ownerUid: string, raw: Partial<EvidenceFile>) {
  return {
    id: String(raw.id || ""),
    caseId,
    ownerUid,
    name: String(raw.name || "Untitled file"),
    kind: raw.kind || "document",
    sizeLabel: String(raw.sizeLabel || formatFileSize(Number(raw.sizeBytes || 0))),
    sizeBytes: raw.sizeBytes ? Number(raw.sizeBytes) : 0,
    uploadedAt: String(raw.uploadedAt || isoNow()),
    status: raw.status || "uploaded",
    category: raw.category ? String(raw.category) : undefined,
    reviewedAt: raw.reviewedAt ? String(raw.reviewedAt) : undefined,
    reviewedBy: raw.reviewedBy ? String(raw.reviewedBy) : undefined,
    notes: raw.notes ? String(raw.notes) : undefined,
    downloadUrl: raw.downloadUrl ? String(raw.downloadUrl) : undefined,
    storagePath: raw.storagePath ? String(raw.storagePath) : undefined,
    contentType: raw.contentType ? String(raw.contentType) : undefined,
  } satisfies EvidenceFile;
}

async function fetchCaseFiles(caseId: string, citizenId: string, fallback?: EvidenceFile[]) {
  const db = requireDb();
  const snapshot = await db
    .collection("cases")
    .doc(caseId)
    .collection("files")
    .orderBy("uploadedAt", "desc")
    .get();

  if (!snapshot.empty) {
    return snapshot.docs.map((doc) =>
      normaliseEvidenceFile(caseId, citizenId, {
        id: doc.id,
        ...(doc.data() as Partial<EvidenceFile>),
      })
    );
  }

  return Array.isArray(fallback)
    ? fallback.map((item) => normaliseEvidenceFile(caseId, citizenId, item))
    : [];
}

async function fetchCaseEvents(caseId: string) {
  const db = requireDb();
  const snapshot = await db
    .collection("cases")
    .doc(caseId)
    .collection("events")
    .orderBy("createdAt", "asc")
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      type: (data.type as CaseEvent["type"]) || "status",
      title: String(data.title || ""),
      description: String(data.description || ""),
      createdAt: String(data.createdAt || ""),
      actor: String(data.actor || "MyGOV Agent"),
      actorId: data.actorId ? String(data.actorId) : undefined,
    } satisfies CaseEvent;
  });
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
    { label: "Total cases", value: String(total), change: "Across all submissions" },
    { label: "Active cases", value: String(active), change: "Currently in progress" },
    { label: "Needs action", value: String(needsAction), change: "Awaiting citizen follow-up" },
    { label: "Resolved", value: String(resolved), change: "Completed successfully" },
  ];
}

function computeAdminStats(cases: CaseItem[]): DashboardStat[] {
  const total = cases.length;
  const urgent = cases.filter((item) => item.intake.urgency === "high").length;
  const needsReview = cases.filter((item) =>
    ["submitted", "reviewing", "need_more_docs"].includes(item.status)
  ).length;
  const inProgress = cases.filter((item) => item.status === "in_progress").length;
  const resolvedToday = cases.filter((item) => {
    return item.status === "resolved" && item.updatedAt.slice(0, 10) === isoNow().slice(0, 10);
  }).length;

  return [
    { label: "Total queue", value: String(total), change: "Open and recent cases" },
    { label: "Needs review", value: String(needsReview), change: "Pending decisions" },
    { label: "In progress", value: String(inProgress), change: "Already assigned" },
    { label: "Resolved today", value: String(resolvedToday), change: "Completed today" },
    { label: "Urgent items", value: String(urgent), change: "High-priority packets" },
  ];
}

async function getCasesCollectionForUser(userId: string) {
  const db = requireDb();
  const snapshot = await db
    .collection("cases")
    .where("citizenId", "==", userId)
    .orderBy("updatedAt", "desc")
    .get();

  return Promise.all(
    snapshot.docs.map(async (doc) => {
      const data = doc.data() as Omit<CaseItem, "id" | "timeline">;
      const events = await fetchCaseEvents(doc.id);
      const evidence = await fetchCaseFiles(
        doc.id,
        data.citizenId,
        Array.isArray(data.evidence) ? data.evidence : []
      );

      return mapCaseWithTimeline(
        {
          ...data,
          id: doc.id,
          evidence,
          reminders: Array.isArray(data.reminders) ? data.reminders : [],
          timeline: [],
        } as CaseItem,
        events
      );
    })
  );
}

async function getAllCases() {
  const db = requireDb();
  const snapshot = await db.collection("cases").orderBy("updatedAt", "desc").get();

  return Promise.all(
    snapshot.docs.map(async (doc) => {
      const data = doc.data() as Omit<CaseItem, "id" | "timeline">;
      const events = await fetchCaseEvents(doc.id);
      const evidence = await fetchCaseFiles(
        doc.id,
        data.citizenId,
        Array.isArray(data.evidence) ? data.evidence : []
      );

      return mapCaseWithTimeline(
        {
          ...data,
          id: doc.id,
          evidence,
          reminders: Array.isArray(data.reminders) ? data.reminders : [],
          timeline: [],
        } as CaseItem,
        events
      );
    })
  );
}

export async function getCitizenDashboardData(
  session: AppSession
): Promise<CitizenDashboardData> {
  const cases = await getCasesCollectionForUser(session.uid);
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
    .flatMap((item) => item.timeline.map((event) => ({ ...event, caseId: item.id })))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6);
  const reminders: NotificationItem[] = cases
    .flatMap((item) =>
      item.reminders.map((reminder, index) => {
        const tone: NotificationItem["tone"] =
          item.status === "need_more_docs" ? "warning" : "info";

        return {
          id: `${item.id}-reminder-${index}`,
          title: item.title,
          body: reminder,
          createdAt: item.updatedAt,
          read: item.status !== "need_more_docs",
          tone,
          actionHref: `/cases/${item.id}`,
        };
      })
    )
    .slice(0, 4);
  const missingDocuments = Array.from(
    new Set(cases.flatMap((item) => item.intake.missingDocuments))
  ).slice(0, 4);
  const recommendedActions = [
    activeCase ? `Check the latest update for ${activeCase.title}.` : "Start your first case.",
    recentFiles.length
      ? "Ask the assistant to summarize your uploaded evidence before submission."
      : "Upload at least one supporting document or photo for stronger review context.",
    ...(missingDocuments.length
      ? [`Prepare these missing items: ${missingDocuments.join(", ")}.`]
      : ["No missing documents are currently flagged by the workflow."]),
  ];

  return {
    stats: computeCitizenStats(cases),
    cases,
    reminders,
    activeCase,
    recentFiles,
    recentActivity,
    recommendedActions,
    profileNeedsAttention: !session.name || session.name === session.email,
  };
}

export async function listCitizenCases(citizenId: string) {
  return getCasesCollectionForUser(citizenId);
}

export async function getCitizenCaseById(citizenId: string, caseId: string) {
  const db = requireDb();
  const snapshot = await db.collection("cases").doc(caseId).get();
  if (!snapshot.exists) return null;

  const data = snapshot.data() as Omit<CaseItem, "id" | "timeline">;
  if (data.citizenId !== citizenId) return null;
  const events = await fetchCaseEvents(caseId);
  const evidence = await fetchCaseFiles(
    caseId,
    data.citizenId,
    Array.isArray(data.evidence) ? data.evidence : []
  );

  return mapCaseWithTimeline(
    {
      ...data,
      id: snapshot.id,
      evidence,
      reminders: Array.isArray(data.reminders) ? data.reminders : [],
      timeline: [],
    } as CaseItem,
    events
  );
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const queue = await getAllCases();
  const filesNeedingReview = queue
    .flatMap((item) => item.evidence)
    .filter((file) => ["uploaded", "under_review", "needs_replacement"].includes(file.status))
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
    .slice(0, 8);
  const recentActivity = queue
    .flatMap((item) => item.timeline.map((event) => ({ ...event, caseId: item.id })))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8);
  return {
    stats: computeAdminStats(queue),
    queue,
    filesNeedingReview,
    recentActivity,
    suggestedActions: [
      "Review newly uploaded files before moving a case to in progress.",
      "Use request more documents for blurred or incomplete evidence.",
      "Check AI-ready summaries for clearer citizen-facing follow-up notes.",
    ],
  };
}

export async function getAdminCaseById(caseId: string) {
  const db = requireDb();
  const snapshot = await db.collection("cases").doc(caseId).get();
  if (!snapshot.exists) return null;

  const data = snapshot.data() as Omit<CaseItem, "id" | "timeline">;
  const events = await fetchCaseEvents(caseId);
  const evidence = await fetchCaseFiles(
    caseId,
    data.citizenId,
    Array.isArray(data.evidence) ? data.evidence : []
  );

  return mapCaseWithTimeline(
    {
      ...data,
      id: snapshot.id,
      evidence,
      reminders: Array.isArray(data.reminders) ? data.reminders : [],
      timeline: [],
    } as CaseItem,
    events
  );
}

export interface CreateCasePayload {
  id: string;
  title: string;
  type: CaseItem["type"];
  location: string;
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

export async function createCaseRecord(payload: CreateCasePayload) {
  const db = requireDb();
  const createdAt = isoNow();
  const reference = `MYGOV-${createdAt.slice(0, 4)}-${Math.random()
    .toString()
    .slice(2, 6)}`;
  const evidence = payload.evidence.map((item) =>
    buildEvidenceFile({
      id: item.id,
      name: item.name,
      kind: item.kind,
      size: item.size,
      uploadedAt: createdAt,
      downloadUrl: item.downloadUrl,
      storagePath: item.storagePath,
      contentType: item.contentType,
    })
  );

  const caseData: Omit<CaseItem, "id" | "timeline"> = {
    reference,
    title: payload.title,
    type: payload.type,
    status: "submitted",
    location: payload.location,
    createdAt,
    updatedAt: createdAt,
    summary: payload.summary,
    citizenId: payload.citizenId,
    citizenName: payload.citizenName,
    assignedUnit: "MyGOV Triage Desk",
    progress: evidence.length ? 22 : 18,
    reminders: ["Keep notifications enabled for follow-up requests."],
    evidence,
    intake: {
      citizenSummary: payload.summary,
      adminSummary: payload.summary,
      category: "Pending AI categorization",
      urgency: "medium",
      missingDocuments: [],
      structuredIntake: {
        channels: evidence.length
          ? Array.from(new Set(["text", ...evidence.map((item) => item.kind)]))
          : ["text"],
      },
    },
    latestInternalNote: "",
    updatedBy: payload.citizenId,
  };

  const docRef = db.collection("cases").doc(payload.id);
  await docRef.set(caseData);
  if (evidence.length) {
    await Promise.all(
      evidence.map((item) =>
        docRef.collection("files").doc(item.id).set(item)
      )
    );
  }
  await appendCaseEvent(docRef.id, {
    type: "status",
    title: "Case submitted",
    description: "Initial case packet created from citizen intake.",
    createdAt,
    actor: payload.citizenName,
    actorId: payload.citizenId,
  });
  for (const item of evidence) {
    await appendCaseEvent(docRef.id, {
      type: "upload",
      title: "Evidence uploaded",
      description: `${item.name} was attached during case submission.`,
      createdAt,
      actor: payload.citizenName,
      actorId: payload.citizenId,
    });
  }

  await createNotificationForUser(payload.citizenId, {
    title: "Case submitted",
    body: `${payload.title} was created and entered the review queue.`,
    createdAt,
    read: false,
    tone: "info",
    actionHref: `/cases/${docRef.id}`,
  });

  const created = await getCitizenCaseById(payload.citizenId, docRef.id);
  if (!created) throw new Error("Unable to read back the created case.");
  return created;
}

export async function appendCaseEvent(
  caseId: string,
  event: Omit<CaseEvent, "id">
) {
  const db = requireDb();
  await db.collection("cases").doc(caseId).collection("events").add(event);
}

export async function addEvidenceToCase(
  caseId: string,
  evidence: EvidenceFile[]
) {
  const db = requireDb();
  const docRef = db.collection("cases").doc(caseId);
  const snapshot = await docRef.get();

  if (!snapshot.exists) throw new Error("Case not found.");

  const existing = snapshot.data()?.evidence;
  const merged = Array.isArray(existing) ? [...existing, ...evidence] : evidence;

  await docRef.update({
    evidence: merged,
    updatedAt: isoNow(),
  });

  await Promise.all(
    evidence.map((item) =>
      docRef.collection("files").doc(item.id).set({
        ...item,
        caseId,
      })
    )
  );

  for (const item of evidence) {
    await appendCaseEvent(caseId, {
      type: "upload",
      title: "Evidence uploaded",
      description: `${item.name} was attached to the case.`,
      createdAt: isoNow(),
      actor: "Citizen upload",
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
    title: "Additional documents requested",
    type: "note",
    progress: 55,
  },
  route: { status: "routed", title: "Case routed", type: "routing", progress: 64 },
  mark_in_progress: {
    status: "in_progress",
    title: "Work in progress",
    type: "status",
    progress: 78,
  },
  resolve: { status: "resolved", title: "Case resolved", type: "status", progress: 100 },
  internal_note: { title: "Internal note added", type: "note" },
};

export async function applyAdminCaseAction(payload: AdminCaseActionPayload) {
  const db = requireDb();
  const config = actionConfig[payload.action];
  const now = isoNow();
  const docRef = db.collection("cases").doc(payload.caseId);
  const snapshot = await docRef.get();

  if (!snapshot.exists) throw new Error("Case not found.");

  const updates: Record<string, unknown> = {
    updatedAt: now,
    updatedBy: payload.actorId,
  };

  if (config.status) updates.status = config.status;
  if (typeof config.progress === "number") updates.progress = config.progress;
  if (payload.note && payload.action === "request_more_documents") {
    const existingReminders = snapshot.data()?.reminders;
    updates.reminders = Array.isArray(existingReminders)
      ? [...existingReminders, payload.note]
      : [payload.note];
  }
  if (payload.note && payload.action === "internal_note") {
    updates.latestInternalNote = payload.note;
  }

  await docRef.update(updates);
  const caseData = snapshot.data() as CaseItem;
  await appendCaseEvent(payload.caseId, {
    type: config.type,
    title: config.title,
    description: payload.note || config.title,
    createdAt: now,
    actor: payload.actorName,
    actorId: payload.actorId,
  });
  await createNotificationForUser(caseData.citizenId, {
    title: config.title,
    body: payload.note || `${caseData.title} was updated by the review team.`,
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
  const db = requireDb();
  const fileRef = db.collection("cases").doc(input.caseId).collection("files").doc(input.fileId);
  const fileSnapshot = await fileRef.get();

  if (!fileSnapshot.exists) {
    throw new Error("File record not found.");
  }

  const now = isoNow();
  await fileRef.update({
    status: input.status,
    notes: input.note || "",
    reviewedAt: now,
    reviewedBy: input.actorId,
  });

  const caseRef = db.collection("cases").doc(input.caseId);
  const caseSnapshot = await caseRef.get();
  if (caseSnapshot.exists) {
    const caseData = caseSnapshot.data() as CaseItem;
    const mergedEvidence = await fetchCaseFiles(
      input.caseId,
      caseData.citizenId,
      Array.isArray(caseData.evidence) ? caseData.evidence : []
    );

    await caseRef.update({
      evidence: mergedEvidence,
      updatedAt: now,
      updatedBy: input.actorId,
    });
  }

  await appendCaseEvent(input.caseId, {
    type: "note",
    title: "File review updated",
    description: input.note
      ? `File ${input.fileId} marked as ${input.status}: ${input.note}`
      : `File ${input.fileId} marked as ${input.status}.`,
    createdAt: now,
    actor: input.actorName,
    actorId: input.actorId,
  });

  return { ok: true };
}

export async function listCaseAssistantMessages(caseId: string): Promise<AssistantMessage[]> {
  const db = requireDb();
  const snapshot = await db
    .collection("cases")
    .doc(caseId)
    .collection("chat")
    .orderBy("createdAt", "asc")
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    role: (doc.data().role as AssistantMessage["role"]) || "assistant",
    body: String(doc.data().body || ""),
    createdAt: String(doc.data().createdAt || ""),
    caseId,
    threadKey: String(doc.data().threadKey || `case:${caseId}`),
    attachments: Array.isArray(doc.data().attachments)
      ? (doc.data().attachments as string[])
      : [],
  }));
}

export async function listDashboardAssistantMessages(userId: string): Promise<AssistantMessage[]> {
  const db = requireDb();
  const snapshot = await db
    .collection("users")
    .doc(userId)
    .collection("assistantThreads")
    .doc("dashboard")
    .collection("messages")
    .orderBy("createdAt", "asc")
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    role: (doc.data().role as AssistantMessage["role"]) || "assistant",
    body: String(doc.data().body || ""),
    createdAt: String(doc.data().createdAt || ""),
    threadKey: "dashboard",
    attachments: Array.isArray(doc.data().attachments)
      ? (doc.data().attachments as string[])
      : [],
  }));
}

export async function appendAssistantMessage(input: {
  userId: string;
  role: AssistantMessage["role"];
  body: string;
  caseId?: string;
  attachments?: string[];
}) {
  const db = requireDb();
  const createdAt = isoNow();
  if (input.caseId) {
    const ref = await db.collection("cases").doc(input.caseId).collection("chat").add({
      role: input.role,
      body: input.body,
      createdAt,
      threadKey: `case:${input.caseId}`,
      attachments: input.attachments || [],
      userId: input.userId,
    });

    return {
      id: ref.id,
      role: input.role,
      body: input.body,
      createdAt,
      caseId: input.caseId,
      threadKey: `case:${input.caseId}`,
      attachments: input.attachments || [],
    } satisfies AssistantMessage;
  }

  const ref = await db
    .collection("users")
    .doc(input.userId)
    .collection("assistantThreads")
    .doc("dashboard")
    .collection("messages")
    .add({
      role: input.role,
      body: input.body,
      createdAt,
      threadKey: "dashboard",
      attachments: input.attachments || [],
      userId: input.userId,
    });

  return {
    id: ref.id,
    role: input.role,
    body: input.body,
    createdAt,
    threadKey: "dashboard",
    attachments: input.attachments || [],
  } satisfies AssistantMessage;
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
