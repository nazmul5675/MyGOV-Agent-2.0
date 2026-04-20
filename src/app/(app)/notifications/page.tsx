import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, BellRing, CircleCheckBig, TriangleAlert } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { LiveDataState } from "@/components/common/live-data-state";
import { PageHeader } from "@/components/common/page-header";
import { requireRole } from "@/lib/auth/session";
import { listNotificationsForUser } from "@/lib/repositories/notifications";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  let notifications:
    | Awaited<ReturnType<typeof listNotificationsForUser>>
    | null = null;
  let errorMessage: string | null = null;

  try {
    notifications = await listNotificationsForUser(session.uid);
  } catch (error) {
    errorMessage =
      error instanceof Error
        ? error.message
        : "The notifications page could not load live Firebase data.";
  }

  if (errorMessage || !notifications) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Notifications"
          title="Stay ahead of reminders and status changes"
          description="Track reminders, case updates, and follow-up requests in one clear notification center."
        />
        <LiveDataState
          tone="setup"
          title="Live notifications are unavailable"
          description={errorMessage || "The notifications page could not load live Firebase data."}
          action={
            <Link
              href="/notifications"
              className={cn(buttonVariants({ size: "default" }), "gap-2 px-5")}
            >
              <AlertTriangle className="size-4" />
              Retry notifications
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Notifications"
        title="Stay ahead of reminders and status changes"
        description="Track reminders, case updates, and follow-up requests in one clear notification center."
      />

      <div className="grid gap-4">
        {notifications.length ? notifications.map((notification) => {
          const Icon = toneIconMap[notification.tone];
          return (
            <article key={notification.id} className="surface-panel flex min-w-0 items-start gap-4 p-5 sm:p-6">
              <div className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 space-y-2">
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
            title="No live notifications yet"
            description="New status changes, reminder nudges, and case follow-ups will appear here once Firestore notification records exist for this user."
          />
        )}
      </div>
    </div>
  );
}
