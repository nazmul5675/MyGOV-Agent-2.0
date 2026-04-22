import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, LayoutPanelTop, Sparkles } from "lucide-react";

import { CitizenRecentCasesTable } from "@/components/cases/citizen-recent-cases-table";
import { LiveDataState } from "@/components/common/live-data-state";
import { PageHeader } from "@/components/common/page-header";
import { requireRole } from "@/lib/auth/session";
import { listCitizenCases } from "@/lib/repositories/cases";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Recent Cases",
};

export default async function CitizenCasesPage() {
  const session = await requireRole("citizen");
  let cases: Awaited<ReturnType<typeof listCitizenCases>> | null = null;
  let errorMessage: string | null = null;

  try {
    cases = await listCitizenCases(session.uid);
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "The recent cases page could not load application data.";
  }

  if (errorMessage || !cases) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Citizen cases"
          title="Recent cases table unavailable"
          description="This page keeps your latest visible cases in one structured table for fast status checks."
        />
        <LiveDataState
          tone="setup"
          title="Recent cases could not be loaded"
          description={errorMessage || "The recent cases page could not load application data."}
          action={
            <Link href="/cases" className={cn(buttonVariants({ size: "default" }), "gap-2 px-5")}>
              <AlertTriangle className="size-4" />
              Retry recent cases
            </Link>
          }
        />
      </div>
    );
  }

  const recentCases = cases.slice(0, 10);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Citizen cases"
        title="Track your cases"
        description="See which case needs you, which one is moving, and which one is already finished."
        actions={
          <>
            <Link
              href="/dashboard"
              className={cn(buttonVariants({ variant: "outline", size: "default" }), "rounded-full px-5")}
            >
              <LayoutPanelTop className="size-4" />
              Dashboard view
            </Link>
            <Link
              href="/cases/new"
              className={cn(buttonVariants({ size: "default" }), "rounded-full px-5")}
            >
              <Sparkles className="size-4" />
              Create case
            </Link>
          </>
        }
      />

      <CitizenRecentCasesTable
        cases={recentCases}
        totalVisibleCount={cases.length}
        description="Your latest 10 visible cases are shown here by default so the page stays calm and easy to scan."
      />
    </div>
  );
}
