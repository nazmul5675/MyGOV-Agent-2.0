import "server-only";

import type { NotificationItem } from "@/lib/types";
import { getMongoCollections } from "@/lib/repositories/bootstrap";

function compareByCreatedAtDesc<T extends { createdAt: string }>(left: T, right: T) {
  return right.createdAt.localeCompare(left.createdAt);
}

export async function createNotificationForUser(
  userId: string,
  notification: Omit<NotificationItem, "id">
) {
  const { notifications } = await getMongoCollections();

  await notifications.insertOne({
    id: `notif-${Math.random().toString(36).slice(2, 10)}`,
    userId,
    ...notification,
  });
}

export async function listNotificationsForUser(
  userId: string
): Promise<NotificationItem[]> {
  const { notifications } = await getMongoCollections();
  const items = await notifications.find({ userId }).toArray();

  return items
    .sort(compareByCreatedAtDesc)
    .map((item) => ({
      id: item.id,
      title: item.title,
      body: item.body,
      createdAt: item.createdAt,
      read: item.read,
      tone: item.tone,
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
    ...input,
  });
}

export async function listRemindersForUser(userId: string) {
  const { reminders } = await getMongoCollections();
  return reminders.find({ userId }).sort({ createdAt: -1 }).toArray();
}

export async function listRemindersForCase(caseId: string) {
  const { reminders } = await getMongoCollections();
  return reminders.find({ caseId }).sort({ createdAt: -1 }).toArray();
}
