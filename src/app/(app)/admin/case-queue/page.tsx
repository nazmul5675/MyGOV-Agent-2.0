import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, LayoutDashboard } from "lucide-react";

import { AdminCaseQueueTable } from "@/components/admin/admin-case-queue-table";
import { LiveDataState } from "@/components/common/live-data-state";
import { PageHeader } from "@/components/common/page-header";
import { requireRole } from "@/lib/auth/session";
import { listAdminCases } from "@/lib/repositories/cases";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Case Queue",
};

export default async function AdminCaseQueuePage() {
  await requireRole("admin");
  let cases: Awaited<ReturnType<typeof listAdminCases>> | null = null;
  let errorMessage: string | null = null;

  try {
    cases = await listAdminCases({ includeHidden: true });
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "The admin case queue could not load application data.";
  }

  if (errorMessage || !cases) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Admin case queue"
          title="Full case queue unavailable"
          description="This is the full saved queue for admin review, including hidden records."
        />
        <LiveDataState
          tone="setup"
          title="Case queue could not be loaded"
          description={errorMessage || "The admin case queue could not load application data."}
          action={
            <Link
              href="/admin/case-queue"
              className={cn(buttonVariants({ size: "default" }), "gap-2 px-5")}
            >
              <AlertTriangle className="size-4" />
              Retry case queue
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin case queue"
        title="Full case queue"
        description="Scan the saved queue quickly, then open or hide the next record without losing the case history."
        actions={
          <Link
            href="/admin"
            className={cn(buttonVariants({ variant: "outline", size: "default" }), "rounded-full px-5")}
          >
            <LayoutDashboard className="size-4" />
            Back to dashboard
          </Link>
        }
      />

      <AdminCaseQueueTable cases={cases} />
    </div>
  );
}
