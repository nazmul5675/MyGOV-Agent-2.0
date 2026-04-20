import type { CaseStatus, CaseType, EvidenceKind, FileReviewStatus, UserRole } from "@/lib/types";

export interface UserDocument {
  id: string;
  uid?: string;
  firebaseUid: string;
  email: string;
  fullName: string;
  role: UserRole;
  accountStatus: "active" | "invited" | "disabled";
  password?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  addressText?: string;
  documents?: string[];
  profileFields?: Record<string, string | number | boolean | null>;
  createdAt: string;
  updatedAt: string;
  lastActiveAt?: string;
}

export interface CaseLocationDocument {
  locationText: string;
  formattedAddress?: string;
  placeId?: string;
  lat?: number;
  lng?: number;
  area?: string;
  district?: string;
  state?: string;
  timezoneId?: string;
  nearbyLandmark?: string;
  mapZoom?: number;
}

export interface CaseIntakeDocument {
  citizenSummary: string;
  adminSummary: string;
  category: string;
  urgency: "low" | "medium" | "high";
  missingDocuments: string[];
  structuredIntake: Record<string, string | string[]>;
}

export interface CaseDocument {
  id: string;
  reference: string;
  citizenUid: string;
  citizenName: string;
  title: string;
  type: CaseType;
  status: CaseStatus;
  summary: string;
  aiSummary?: string;
  adminSummary?: string;
  location: string;
  locationMeta?: CaseLocationDocument;
  assignedUnit: string;
  currentStep?: string;
  progress: number;
  evidenceCount: number;
  missingDocuments: string[];
  intake: CaseIntakeDocument;
  latestInternalNote?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CaseEventDocument {
  id: string;
  caseId: string;
  actorUid?: string;
  actorRole?: UserRole;
  eventType: "status" | "note" | "upload" | "routing" | "audit" | "assistant";
  label: string;
  description: string;
  createdAt: string;
  metadata?: Record<string, string | number | boolean | string[] | null>;
}

export interface FileDocument {
  id: string;
  fileId?: string;
  gridFsFileId?: string;
  caseId: string;
  ownerUid: string;
  filename: string;
  mimeType?: string;
  size: number;
  uploadedAt: string;
  category?: string;
  kind: EvidenceKind;
  reviewStatus: FileReviewStatus;
  reviewNote?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  uploadedByRole?: UserRole;
}

export interface NotificationDocument {
  id: string;
  userUid: string;
  title: string;
  body: string;
  kind: "info" | "warning" | "success";
  read: boolean;
  createdAt: string;
  relatedCaseId?: string;
  actionHref?: string;
}

export interface ReminderDocument {
  id: string;
  caseId: string;
  userUid: string;
  title: string;
  body: string;
  kind: "info" | "warning" | "success";
  read: boolean;
  createdAt: string;
  actionHref?: string;
}

export interface ChatMessageDocument {
  id: string;
  caseId?: string;
  userUid: string;
  role: "user" | "assistant";
  senderType: "citizen" | "admin" | "assistant";
  content: string;
  model?: string;
  createdAt: string;
  threadKey: string;
  attachments?: string[];
  metadata?: Record<string, string | number | boolean | string[] | null>;
}

export interface AdminNoteDocument {
  id: string;
  caseId: string;
  actorUid: string;
  actorRole: UserRole;
  actorName: string;
  note: string;
  action: string;
  createdAt: string;
  visibleInTimeline?: boolean;
}

export interface RoleAuditLogDocument {
  id: string;
  targetUserUid: string;
  previousRole: UserRole;
  nextRole: UserRole;
  changedByUid: string;
  changedByRole: UserRole;
  createdAt: string;
  reason?: string;
}
