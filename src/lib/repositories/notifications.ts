import type { NotificationItem } from "@/lib/types";
import { getPrototypeStore } from "@/lib/prototype/store";

export async function createNotificationForUser(
  userId: string,
  notification: Omit<NotificationItem, "id">
) {
  const store = getPrototypeStore();
  store.notifications.unshift({
    id: `notif-${Math.random().toString(36).slice(2, 10)}`,
    userId,
    ...notification,
  });
}

export async function listNotificationsForUser(
  userId: string
): Promise<NotificationItem[]> {
  const store = getPrototypeStore();

  return store.notifications
    .filter((item) => item.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
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
