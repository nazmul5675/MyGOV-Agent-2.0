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
export type FileReviewStatus =
  | "uploaded"
  | "under_review"
  | "accepted"
  | "needs_replacement"
  | "rejected";

export interface AppSession {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export interface UserProfile {
  id: string;
  uid: string;
  email: string;
  fullName: string;
  role: UserRole;
  accountStatus?: "active" | "invited" | "disabled";
  dateOfBirth?: string;
  phoneNumber?: string;
  addressText?: string;
  documents?: string[];
  createdAt?: string;
  updatedAt?: string;
  lastActiveAt?: string;
  profileCompleteness?: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  tone: "info" | "warning" | "success";
  actionHref?: string;
}

export interface CaseEvent {
  id: string;
  type: "status" | "note" | "upload" | "routing";
  title: string;
  description: string;
  createdAt: string;
  actor: string;
  actorId?: string;
}

export interface EvidenceFile {
  id: string;
  caseId?: string;
  ownerUid?: string;
  name: string;
  kind: EvidenceKind;
  sizeLabel: string;
  sizeBytes?: number;
  uploadedAt: string;
  status: FileReviewStatus;
  category?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  notes?: string;
  downloadUrl?: string;
  storagePath?: string;
  contentType?: string;
}

export interface AssistantMessage {
  id: string;
  role: "user" | "assistant";
  body: string;
  createdAt: string;
  caseId?: string;
  threadKey: string;
  attachments?: string[];
}

export type AssistantResponseSource = "gemini" | "prototype-fallback";

export interface AssistantResponseMeta {
  source: AssistantResponseSource;
  model?: string;
  notice?: string;
}

export interface IntakeSummary {
  citizenSummary: string;
  adminSummary: string;
  category: string;
  urgency: "low" | "medium" | "high";
  missingDocuments: string[];
  structuredIntake: Record<string, string | string[]>;
}

export interface CaseLocationMeta {
  locationText: string;
  formattedAddress?: string;
  placeId?: string;
  lat?: number;
  lng?: number;
  timezoneId?: string;
  nearbyLandmark?: string;
  mapZoom?: number;
}

export interface CaseItem {
  id: string;
  reference: string;
  title: string;
  type: CaseType;
  status: CaseStatus;
  location: string;
  locationMeta?: CaseLocationMeta;
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
  latestInternalNote?: string;
  updatedBy?: string;
}

export interface DashboardStat {
  label: string;
  value: string;
  change: string;
}

export interface CitizenDashboardData {
  stats: DashboardStat[];
  cases: CaseItem[];
  reminders: NotificationItem[];
  activeCase: CaseItem | null;
  recentFiles: EvidenceFile[];
  recentActivity: CaseEvent[];
  recommendedActions: string[];
  profileNeedsAttention: boolean;
}

export interface AdminDashboardData {
  stats: DashboardStat[];
  queue: CaseItem[];
  filesNeedingReview: EvidenceFile[];
  recentActivity: CaseEvent[];
  suggestedActions: string[];
  queueBuckets?: {
    recentIncoming: CaseItem[];
    needsCitizenResponse: CaseItem[];
    urgentCases: CaseItem[];
    stalledCases: CaseItem[];
  };
  roleActivity?: Array<{
    id: string;
    title: string;
    description: string;
    createdAt: string;
    actor: string;
  }>;
}

export interface AdminManagedUser extends UserProfile {
  casesCount: number;
  openCasesCount: number;
  profileCompleteness: number;
}

export interface AdminUsersDashboardData {
  stats: DashboardStat[];
  users: AdminManagedUser[];
  recentRoleChanges: Array<{
    id: string;
    title: string;
    description: string;
    createdAt: string;
    actor: string;
    actorId?: string;
  }>;
}
