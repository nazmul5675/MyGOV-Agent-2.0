import type {
  PrototypeAssistantMessageRecord,
  PrototypeCaseEventRecord,
  PrototypeCaseRecord,
  PrototypeFileRecord,
  PrototypeNotificationRecord,
  PrototypeReminderRecord,
  PrototypeUserRecord,
} from "@/types/prototype";

export type UserDocument = PrototypeUserRecord;
export type CaseDocument = PrototypeCaseRecord;
export type CaseEventDocument = PrototypeCaseEventRecord;
export type FileDocument = PrototypeFileRecord;
export type NotificationDocument = PrototypeNotificationRecord;
export type ReminderDocument = PrototypeReminderRecord;
export type ChatMessageDocument = PrototypeAssistantMessageRecord;

export interface AdminNoteDocument {
  id: string;
  caseId?: string;
  targetUserId?: string;
  actorId: string;
  actorName: string;
  note: string;
  action: string;
  createdAt: string;
}
