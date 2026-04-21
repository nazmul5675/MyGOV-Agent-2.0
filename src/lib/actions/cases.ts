import type { AssistantResponseMeta, EvidenceFile } from "@/lib/types";
import { adminActionSchema, createCaseRequestSchema } from "@/lib/validation/cases";
import type { z } from "zod";

type CreateCaseInput = z.infer<typeof createCaseRequestSchema>;
type AdminActionInput = z.infer<typeof adminActionSchema>;

interface EvidencePayload {
  id: string;
  gridFsFileId?: string;
  name: string;
  kind: EvidenceFile["kind"];
  size: number;
  downloadUrl?: string;
  contentType?: string;
}

async function postJson<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(body?.error || "Request failed.");
  }

  return response.json() as Promise<T>;
}

export async function createCaseAction(values: CreateCaseInput) {
  return postJson<{ caseId: string; role: string }>("/api/cases", values);
}

export async function attachEvidenceAction(caseId: string, files: EvidencePayload[]) {
  return postJson<{ ok: boolean }>(`/api/cases/${caseId}/evidence`, {
    files,
  });
}

export async function applyAdminAction(caseId: string, payload: AdminActionInput) {
  return postJson<{ ok: boolean }>(`/api/admin/cases/${caseId}/actions`, payload);
}

export async function sendAssistantMessage(payload: {
  body: string;
  caseId?: string;
}) {
  return postJson<{
    userMessage: { id: string; body: string; createdAt: string };
    assistantMessage: { id: string; body: string; createdAt: string; attachments?: string[] };
    assistantMeta: AssistantResponseMeta;
  }>("/api/assistant/messages", payload);
}

export async function updateFileReviewAction(
  caseId: string,
  payload: {
    fileId: string;
    status: "uploaded" | "under_review" | "accepted" | "needs_replacement" | "rejected";
    note?: string;
  }
) {
  const response = await fetch(`/api/admin/cases/${caseId}/files`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(body?.error || "Request failed.");
  }

  return response.json() as Promise<{ ok: boolean }>;
}

export async function updateCaseVisibilityAction(
  caseId: string,
  payload: { isHidden: boolean }
) {
  const response = await fetch(`/api/admin/cases/${caseId}/visibility`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(body?.error || "Request failed.");
  }

  return response.json() as Promise<{ ok: boolean; isHidden: boolean }>;
}
