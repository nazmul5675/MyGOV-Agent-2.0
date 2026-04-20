import type { NotificationItem } from "@/lib/types";
import {
  listPrototypeNotificationsForUser,
  pushPrototypeNotification,
} from "@/lib/prototype/repository";

export async function createNotificationForUser(
  userId: string,
  notification: Omit<NotificationItem, "id">
) {
  pushPrototypeNotification({
    id: `notif-${Math.random().toString(36).slice(2, 10)}`,
    userId,
    ...notification,
  });
}

export async function listNotificationsForUser(
  userId: string
): Promise<NotificationItem[]> {
  return listPrototypeNotificationsForUser(userId)
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
