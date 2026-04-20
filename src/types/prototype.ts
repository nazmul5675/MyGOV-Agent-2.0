import type { AssistantMessage, CaseEvent, CaseItem, EvidenceFile, NotificationItem, UserProfile } from "@/lib/types";

export interface PrototypeUserRecord extends UserProfile {
  password: string;
}

export type PrototypeCaseRecord = Omit<CaseItem, "evidence" | "timeline" | "reminders">;

export interface PrototypeCaseEventRecord extends CaseEvent {
  caseId: string;
}

export interface PrototypeFileRecord extends EvidenceFile {
  caseId: string;
  ownerUid: string;
}

export interface PrototypeNotificationRecord extends NotificationItem {
  userId: string;
}

export interface PrototypeReminderRecord extends NotificationItem {
  userId: string;
  caseId: string;
}

export interface PrototypeAssistantMessageRecord extends AssistantMessage {
  userId: string;
}

export interface PrototypeDataset {
  users: PrototypeUserRecord[];
  cases: PrototypeCaseRecord[];
  caseEvents: PrototypeCaseEventRecord[];
  files: PrototypeFileRecord[];
  notifications: PrototypeNotificationRecord[];
  reminders: PrototypeReminderRecord[];
  chatSeeds: PrototypeAssistantMessageRecord[];
}
