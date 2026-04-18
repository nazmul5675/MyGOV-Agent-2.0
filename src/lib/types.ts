export type UserRole = "citizen" | "admin";

export type CaseStatus =
  | "submitted"
  | "reviewing"
  | "need_more_docs"
  | "routed"
  | "in_progress"
  | "resolved"
  | "rejected";

export type CaseType = "flood_relief" | "public_complaint" | "reminder_renewal";

export type EvidenceKind = "photo" | "document" | "voice_note";

export interface AppSession {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  tone: "info" | "warning" | "success";
}

export interface CaseEvent {
  id: string;
  type: "status" | "note" | "upload" | "routing";
  title: string;
  description: string;
  createdAt: string;
  actor: string;
}

export interface EvidenceFile {
  id: string;
  name: string;
  kind: EvidenceKind;
  sizeLabel: string;
  uploadedAt: string;
  status: "uploaded" | "processing" | "flagged";
}

export interface IntakeSummary {
  citizenSummary: string;
  adminSummary: string;
  category: string;
  urgency: "low" | "medium" | "high";
  missingDocuments: string[];
  structuredIntake: Record<string, string | string[]>;
}

export interface CaseItem {
  id: string;
  reference: string;
  title: string;
  type: CaseType;
  status: CaseStatus;
  location: string;
  createdAt: string;
  updatedAt: string;
  summary: string;
  citizenId: string;
  citizenName: string;
  assignedUnit: string;
  progress: number;
  reminders: string[];
  evidence: EvidenceFile[];
  timeline: CaseEvent[];
  intake: IntakeSummary;
}

export interface DashboardStat {
  label: string;
  value: string;
  change: string;
}
