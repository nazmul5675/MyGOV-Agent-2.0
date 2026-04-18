import type { EvidenceFile } from "@/lib/types";
import { adminActionSchema, createCaseSchema } from "@/lib/validation/cases";
import type { z } from "zod";

type CreateCaseInput = z.infer<typeof createCaseSchema>;
type AdminActionInput = z.infer<typeof adminActionSchema>;

interface EvidencePayload {
  id: string;
  name: string;
  kind: EvidenceFile["kind"];
  size: number;
  downloadUrl?: string;
  storagePath?: string;
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
