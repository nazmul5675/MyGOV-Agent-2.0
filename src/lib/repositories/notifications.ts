import "server-only";

import type { NotificationItem } from "@/lib/types";
import { getMongoCollections } from "@/lib/repositories/bootstrap";

function compareByCreatedAtDesc<T extends { createdAt: string }>(left: T, right: T) {
  return right.createdAt.localeCompare(left.createdAt);
}

function toPlainRecord<T extends object>(record: T) {
  const plain = { ...(record as T & { _id?: unknown }) };
  delete plain._id;
  return plain as T;
}

export async function createNotificationForUser(
  userUid: string,
  notification: Omit<NotificationItem, "id">
) {
  const { notifications } = await getMongoCollections();

  await notifications.insertOne({
    id: `notif-${Math.random().toString(36).slice(2, 10)}`,
    userUid,
    title: notification.title,
    body: notification.body,
    kind: notification.tone,
    read: notification.read,
    createdAt: notification.createdAt,
    relatedCaseId: notification.actionHref?.startsWith("/cases/")
      ? notification.actionHref.split("/").pop()
      : undefined,
    actionHref: notification.actionHref,
  });
}

export async function listNotificationsForUser(userUid: string): Promise<NotificationItem[]> {
  const { notifications } = await getMongoCollections();
  const items = await notifications.find({ userUid }).toArray();

  return items.sort(compareByCreatedAtDesc).map((item) => ({
    id: item.id,
    title: item.title,
    body: item.body,
    createdAt: item.createdAt,
    read: item.read,
    tone: item.kind,
    actionHref: item.actionHref,
  }));
}

export async function createReminderForUser(input: {
  caseId: string;
  userId: string;
  title: string;
  body: string;
  createdAt: string;
  tone: "info" | "warning" | "success";
  read: boolean;
  actionHref?: string;
}) {
  const { reminders } = await getMongoCollections();

  await reminders.insertOne({
    id: `reminder-${Math.random().toString(36).slice(2, 10)}`,
    caseId: input.caseId,
    userUid: input.userId,
    title: input.title,
    body: input.body,
    kind: input.tone,
    read: input.read,
    createdAt: input.createdAt,
    actionHref: input.actionHref,
  });
}

export async function listRemindersForUser(userUid: string) {
  const { reminders } = await getMongoCollections();
  const records = await reminders.find({ userUid }).sort({ createdAt: -1 }).toArray();
  return records.map(toPlainRecord);
}

export async function listRemindersForCase(caseId: string) {
  const { reminders } = await getMongoCollections();
  const records = await reminders.find({ caseId }).sort({ createdAt: -1 }).toArray();
  return records.map(toPlainRecord);
}
