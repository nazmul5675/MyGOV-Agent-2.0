import "server-only";

import { getPrototypeStore } from "@/lib/prototype/store";
import type {
  PrototypeAssistantMessageRecord,
  PrototypeCaseEventRecord,
  PrototypeCaseRecord,
  PrototypeFileRecord,
  PrototypeNotificationRecord,
  PrototypeReminderRecord,
  PrototypeUserRecord,
} from "@/types/prototype";

function compareByCreatedAtDesc<T extends { createdAt: string }>(left: T, right: T) {
  return right.createdAt.localeCompare(left.createdAt);
}

function compareByCreatedAtAsc<T extends { createdAt: string }>(left: T, right: T) {
  return left.createdAt.localeCompare(right.createdAt);
}

function compareByUploadedAtDesc<T extends { uploadedAt: string }>(left: T, right: T) {
  return right.uploadedAt.localeCompare(left.uploadedAt);
}

function compareByUpdatedAtDesc<T extends { updatedAt: string }>(left: T, right: T) {
  return right.updatedAt.localeCompare(left.updatedAt);
}

export function listPrototypeUsers() {
  return getPrototypeStore().users;
}

export function getPrototypeUserByUid(uid: string) {
  return listPrototypeUsers().find((item) => item.uid === uid) || null;
}

export function getPrototypeUserByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  return (
    listPrototypeUsers().find((item) => item.email.trim().toLowerCase() === normalizedEmail) ||
    null
  );
}

export function listPrototypeCases() {
  return getPrototypeStore().cases.slice().sort(compareByUpdatedAtDesc);
}

export function getPrototypeCaseById(caseId: string) {
  return getPrototypeStore().cases.find((item) => item.id === caseId) || null;
}

export function listPrototypeCasesForCitizen(citizenId: string) {
  return listPrototypeCases().filter((item) => item.citizenId === citizenId);
}

export function listPrototypeCaseEvents(caseId: string) {
  return getPrototypeStore().caseEvents
    .filter((item) => item.caseId === caseId)
    .slice()
    .sort(compareByCreatedAtAsc);
}

export function listPrototypeFilesForCase(caseId: string) {
  return getPrototypeStore().files
    .filter((item) => item.caseId === caseId)
    .slice()
    .sort(compareByUploadedAtDesc);
}

export function listPrototypeFilesForUser(userId: string) {
  return getPrototypeStore().files
    .filter((item) => item.ownerUid === userId)
    .slice()
    .sort(compareByUploadedAtDesc);
}

export function listPrototypeNotificationsForUser(userId: string) {
  return getPrototypeStore().notifications
    .filter((item) => item.userId === userId)
    .slice()
    .sort(compareByCreatedAtDesc);
}

export function listPrototypeRemindersForUser(userId: string) {
  return getPrototypeStore().reminders
    .filter((item) => item.userId === userId)
    .slice()
    .sort(compareByCreatedAtDesc);
}

export function listPrototypeRemindersForCase(caseId: string) {
  return getPrototypeStore().reminders
    .filter((item) => item.caseId === caseId)
    .slice()
    .sort(compareByCreatedAtDesc);
}

export function listPrototypeChatMessagesForThread(input: {
  userId?: string;
  caseId?: string;
  threadKey: string;
}) {
  return getPrototypeStore().chatSeeds
    .filter((item) => {
      if (input.caseId) {
        return item.caseId === input.caseId || item.threadKey === input.threadKey;
      }

      return item.userId === input.userId && item.threadKey === input.threadKey;
    })
    .slice()
    .sort(compareByCreatedAtAsc);
}

export function pushPrototypeCaseEvent(event: PrototypeCaseEventRecord) {
  getPrototypeStore().caseEvents.push(event);
}

export function pushPrototypeFiles(files: PrototypeFileRecord[]) {
  getPrototypeStore().files.unshift(...files);
}

export function pushPrototypeCase(caseItem: PrototypeCaseRecord) {
  getPrototypeStore().cases.unshift(caseItem);
}

export function pushPrototypeReminder(reminder: PrototypeReminderRecord) {
  getPrototypeStore().reminders.unshift(reminder);
}

export function pushPrototypeNotification(notification: PrototypeNotificationRecord) {
  getPrototypeStore().notifications.unshift(notification);
}

export function pushPrototypeChatMessage(message: PrototypeAssistantMessageRecord) {
  getPrototypeStore().chatSeeds.push(message);
}

export function pushPrototypeUser(user: PrototypeUserRecord) {
  getPrototypeStore().users.push(user);
}
