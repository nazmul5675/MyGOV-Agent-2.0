import type { Metadata } from "next";
import { BellRing, CircleCheckBig, TriangleAlert } from "lucide-react";

import { requireRole } from "@/lib/auth/session";
import { listNotificationsForUser } from "@/lib/repositories/notifications";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";

export const metadata: Metadata = {
  title: "Notifications",
};

const toneIconMap = {
  info: BellRing,
  warning: TriangleAlert,
  success: CircleCheckBig,
};

export default async function NotificationsPage() {
  const session = await requireRole("citizen");
  const notifications = await listNotificationsForUser(session.uid);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Notifications"
        title="Stay ahead of reminders and status changes"
        description="A notification center scaffold is included so reminder cards and future FCM events have a clean place to land."
      />

      <div className="grid gap-4">
        {notifications.length ? notifications.map((notification) => {
          const Icon = toneIconMap[notification.tone];
          return (
            <article key={notification.id} className="surface-panel flex items-start gap-4 p-6">
              <div className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <Icon className="size-4" />
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-lg font-bold tracking-tight text-foreground">
                    {notification.title}
                  </h2>
                  {!notification.read ? (
                    <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-foreground">
                      New
                    </span>
                  ) : null}
                </div>
                <p className="text-sm leading-7 text-muted-foreground">{notification.body}</p>
              </div>
            </article>
          );
        }) : (
          <EmptyState
            icon={<BellRing className="size-5" />}
            title="No notifications yet"
            description="New status changes, reminder nudges, and case follow-ups will appear here."
          />
        )}
      </div>
    </div>
  );
}
