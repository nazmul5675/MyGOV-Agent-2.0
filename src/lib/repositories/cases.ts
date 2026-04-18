import {
  demoCases,
  getUpcomingReminders,
} from "@/lib/demo-data";
import type {
  AdminDashboardData,
  AppSession,
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
  getDb,
  isoNow,
  isFirestoreAvailable,
} from "@/lib/repositories/firestore-helpers";

function sortEvents(events: CaseEvent[]) {
  return events.slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function mapCaseWithTimeline(base: CaseItem, events?: CaseEvent[]) {
  return {
    ...base,
    timeline: sortEvents(events || base.timeline),
  };
}

async function fetchCaseEvents(caseId: string) {
  const db = getDb();
  if (!db) return [];

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

  return [
    { label: "Total queue", value: String(total), change: "Open and recent cases" },
    { label: "Urgent items", value: String(urgent), change: "High-priority packets" },
    { label: "Needs review", value: String(needsReview), change: "Pending decisions" },
    { label: "In progress", value: String(inProgress), change: "Already assigned" },
  ];
}

function fallbackCitizenDashboard(citizenId: string): CitizenDashboardData {
  const cases = demoCases.filter((item) => item.citizenId === citizenId);
  const reminders = getUpcomingReminders().map((item) => ({
    id: item.id,
    title: item.title,
    body: item.description,
    createdAt: isoNow(),
    read: false,
    tone: item.dueLabel === "Due today" ? "warning" : "info",
  })) as NotificationItem[];

  return {
    stats: computeCitizenStats(cases),
    cases,
    reminders,
  };
}

function fallbackAdminDashboard(): AdminDashboardData {
  return {
    stats: computeAdminStats(demoCases),
    queue: demoCases,
  };
}

async function getCasesCollectionForUser(userId: string) {
  const db = getDb();
  if (!db) return [];

  const snapshot = await db
    .collection("cases")
    .where("citizenId", "==", userId)
    .orderBy("updatedAt", "desc")
    .get();

  const items = await Promise.all(
    snapshot.docs.map(async (doc) => {
      const data = doc.data() as Omit<CaseItem, "id" | "timeline">;
      const events = await fetchCaseEvents(doc.id);

      return mapCaseWithTimeline(
        {
          ...data,
          id: doc.id,
          evidence: Array.isArray(data.evidence) ? data.evidence : [],
          reminders: Array.isArray(data.reminders) ? data.reminders : [],
          timeline: [],
        } as CaseItem,
        events
      );
    })
  );

  return items;
}

async function getAllCases() {
  const db = getDb();
  if (!db) return [];

  const snapshot = await db.collection("cases").orderBy("updatedAt", "desc").get();
  return Promise.all(
    snapshot.docs.map(async (doc) => {
      const data = doc.data() as Omit<CaseItem, "id" | "timeline">;
      const events = await fetchCaseEvents(doc.id);
      return mapCaseWithTimeline(
        {
          ...data,
          id: doc.id,
          evidence: Array.isArray(data.evidence) ? data.evidence : [],
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
  if (!isFirestoreAvailable()) return fallbackCitizenDashboard(session.uid);

  const cases = await getCasesCollectionForUser(session.uid);
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

  return {
    stats: computeCitizenStats(cases),
    cases,
    reminders,
  };
}

export async function listCitizenCases(citizenId: string) {
  if (!isFirestoreAvailable()) {
    return demoCases.filter((item) => item.citizenId === citizenId);
  }
  return getCasesCollectionForUser(citizenId);
}

export async function getCitizenCaseById(citizenId: string, caseId: string) {
  if (!isFirestoreAvailable()) {
    return demoCases.find((item) => item.citizenId === citizenId && item.id === caseId) || null;
  }

  const db = getDb();
  if (!db) return null;
  const snapshot = await db.collection("cases").doc(caseId).get();
  if (!snapshot.exists) return null;
  const data = snapshot.data() as Omit<CaseItem, "id" | "timeline">;
  if (data.citizenId !== citizenId) return null;
  const events = await fetchCaseEvents(caseId);

  return mapCaseWithTimeline(
    {
      ...data,
      id: snapshot.id,
      evidence: Array.isArray(data.evidence) ? data.evidence : [],
      reminders: Array.isArray(data.reminders) ? data.reminders : [],
      timeline: [],
    } as CaseItem,
    events
  );
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  if (!isFirestoreAvailable()) return fallbackAdminDashboard();

  const queue = await getAllCases();
  return {
    stats: computeAdminStats(queue),
    queue,
  };
}

export async function getAdminCaseById(caseId: string) {
  if (!isFirestoreAvailable()) {
    return demoCases.find((item) => item.id === caseId) || null;
  }

  const db = getDb();
  if (!db) return null;
  const snapshot = await db.collection("cases").doc(caseId).get();
  if (!snapshot.exists) return null;
  const data = snapshot.data() as Omit<CaseItem, "id" | "timeline">;
  const events = await fetchCaseEvents(caseId);

  return mapCaseWithTimeline(
    {
      ...data,
      id: snapshot.id,
      evidence: Array.isArray(data.evidence) ? data.evidence : [],
      reminders: Array.isArray(data.reminders) ? data.reminders : [],
      timeline: [],
    } as CaseItem,
    events
  );
}

export interface CreateCasePayload {
  title: string;
  type: CaseItem["type"];
  location: string;
  summary: string;
  citizenId: string;
  citizenName: string;
}

export async function createCaseRecord(payload: CreateCasePayload) {
  const db = getDb();
  const createdAt = isoNow();
  const reference = `MYGOV-${createdAt.slice(0, 4)}-${Math.random()
    .toString()
    .slice(2, 6)}`;

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
    progress: 18,
    reminders: ["Keep notifications enabled for follow-up requests."],
    evidence: [],
    intake: {
      citizenSummary: payload.summary,
      adminSummary: payload.summary,
      category: "Pending AI categorization",
      urgency: "medium",
      missingDocuments: [],
      structuredIntake: {
        channels: ["text"],
      },
    },
    latestInternalNote: "",
    updatedBy: payload.citizenId,
  };

  if (!isFirestoreAvailable() || !db) {
    const id = `case-${Date.now()}`;
    return {
      ...caseData,
      id,
      timeline: [
        {
          id: `event-${Date.now()}`,
          type: "status",
          title: "Case submitted",
          description: "Initial case packet created from citizen intake.",
          createdAt,
          actor: payload.citizenName,
          actorId: payload.citizenId,
        },
      ],
    } satisfies CaseItem;
  }

  const docRef = db.collection("cases").doc();
  await docRef.set(caseData);
  await appendCaseEvent(docRef.id, {
    type: "status",
    title: "Case submitted",
    description: "Initial case packet created from citizen intake.",
    createdAt,
    actor: payload.citizenName,
    actorId: payload.citizenId,
  });
  await db.collection("notifications").add({
    userId: payload.citizenId,
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
  const db = getDb();
  if (!isFirestoreAvailable() || !db) return;

  await db.collection("cases").doc(caseId).collection("events").add(event);
}

export async function addEvidenceToCase(
  caseId: string,
  evidence: EvidenceFile[]
) {
  const db = getDb();
  if (!isFirestoreAvailable() || !db) return;

  const docRef = db.collection("cases").doc(caseId);
  const snapshot = await docRef.get();
  if (!snapshot.exists) throw new Error("Case not found.");

  const existing = snapshot.data()?.evidence;
  const merged = Array.isArray(existing) ? [...existing, ...evidence] : evidence;

  await docRef.update({
    evidence: merged,
    updatedAt: isoNow(),
  });

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
  const db = getDb();
  const config = actionConfig[payload.action];
  const now = isoNow();

  if (!isFirestoreAvailable() || !db) {
    return {
      ok: true,
      fallback: true,
    };
  }

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
  await db.collection("notifications").add({
    userId: caseData.citizenId,
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
    uploadedAt: input.uploadedAt || isoNow(),
    status: "uploaded",
    downloadUrl: input.downloadUrl,
    storagePath: input.storagePath,
    contentType: input.contentType,
  };
}
