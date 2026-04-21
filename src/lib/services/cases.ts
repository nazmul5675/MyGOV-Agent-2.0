import "server-only";

import {
  addEvidenceToCase,
  appendAssistantMessage,
  applyAdminCaseAction,
  buildEvidenceFile,
  createCaseRecord,
  getAdminCaseById,
  getCitizenCaseById,
  listCaseAssistantMessages,
  listDashboardAssistantMessages,
  updateCaseVisibility,
  updateEvidenceReviewStatus,
} from "@/lib/repositories/cases";
import { notFoundError } from "@/lib/security/api";
import type { AppSession } from "@/lib/types";

export async function createCitizenCase(input: {
  session: AppSession;
  caseId: string;
  title: string;
  caseType: "flood_relief" | "public_complaint" | "reminder_renewal";
  location: string;
  description: string;
  locationMeta?: {
    locationText: string;
    formattedAddress?: string;
    placeId?: string;
    lat?: number;
    lng?: number;
    timezoneId?: string;
    nearbyLandmark?: string;
  };
  files: Array<{
    id: string;
    gridFsFileId?: string;
    name: string;
    kind: "photo" | "document" | "voice_note";
    size: number;
    downloadUrl?: string;
    contentType?: string;
  }>;
}) {
  return createCaseRecord({
    id: input.caseId,
    title: input.title,
    type: input.caseType,
    location: input.location,
    locationMeta: input.locationMeta,
    summary: input.description,
    citizenId: input.session.uid,
    citizenName: input.session.name,
    evidence: input.files,
  });
}

export async function attachCitizenEvidence(input: {
  session: AppSession;
  caseId: string;
  files: Array<{
    id: string;
    gridFsFileId?: string;
    name: string;
    kind: "photo" | "document" | "voice_note";
    size: number;
    downloadUrl?: string;
    contentType?: string;
  }>;
}) {
  const existing = await getCitizenCaseById(input.session.uid, input.caseId);
  if (!existing) throw notFoundError("Case not found.");

  await addEvidenceToCase(
    input.caseId,
    input.files.map((file) =>
      buildEvidenceFile({
        id: file.id,
        gridFsFileId: file.gridFsFileId,
        name: file.name,
        kind: file.kind,
        size: file.size,
        downloadUrl: file.downloadUrl,
        contentType: file.contentType,
      })
    )
  );
}

export async function runAdminCaseAction(input: {
  session: AppSession;
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
}) {
  return applyAdminCaseAction({
    caseId: input.caseId,
    action: input.action,
    note: input.note,
    actorName: input.session.name,
    actorId: input.session.uid,
  });
}

export async function reviewAdminFile(input: {
  session: AppSession;
  caseId: string;
  fileId: string;
  status: "uploaded" | "under_review" | "accepted" | "needs_replacement" | "rejected";
  note?: string;
}) {
  return updateEvidenceReviewStatus({
    caseId: input.caseId,
    fileId: input.fileId,
    status: input.status,
    note: input.note,
    actorName: input.session.name,
    actorId: input.session.uid,
  });
}

export async function setAdminCaseVisibility(input: {
  session: AppSession;
  caseId: string;
  isHidden: boolean;
}) {
  return updateCaseVisibility({
    caseId: input.caseId,
    isHidden: input.isHidden,
    actorName: input.session.name,
    actorId: input.session.uid,
  });
}

export async function appendAssistantConversation(input: {
  session: AppSession;
  body: string;
  caseId?: string;
  assistantBody: string;
  attachments?: string[];
  model?: string;
  source: "gemini" | "prototype-fallback";
}) {
  const caseItem = input.caseId
    ? input.session.role === "admin"
      ? await getAdminCaseById(input.caseId)
      : await getCitizenCaseById(input.session.uid, input.caseId)
    : null;

  if (input.caseId && !caseItem) {
    throw notFoundError("Case context could not be loaded.");
  }

  const userMessage = await appendAssistantMessage({
    userId: input.session.uid,
    role: "user",
    body: input.body,
    caseId: input.caseId,
  });

  const assistantMessage = await appendAssistantMessage({
    userId: input.session.uid,
    role: "assistant",
    body: input.assistantBody,
    caseId: input.caseId,
    attachments: input.attachments || [],
    model: input.model,
    source: input.source,
  });

  return { userMessage, assistantMessage, caseItem };
}

export async function getAssistantHistory(input: { session: AppSession; caseId?: string }) {
  if (input.caseId) {
    const caseItem =
      input.session.role === "admin"
        ? await getAdminCaseById(input.caseId)
        : await getCitizenCaseById(input.session.uid, input.caseId);
    if (!caseItem) throw notFoundError("Case context could not be loaded.");

    return {
      caseItem,
      history: await listCaseAssistantMessages(input.caseId),
    };
  }

  return {
    caseItem: null,
    history: await listDashboardAssistantMessages(input.session.uid),
  };
}
