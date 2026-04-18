import type { Metadata } from "next";

import { requireRole } from "@/lib/auth/session";
import { CaseIntakeForm } from "@/components/forms/case-intake-form";
import { PageHeader } from "@/components/common/page-header";

export const metadata: Metadata = {
  title: "Create Case",
};

export default async function NewCasePage() {
  await requireRole("citizen");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="New case"
        title="Create a structured case in one guided flow"
        description="This intake keeps the citizen experience simple while preparing clean JSON, summaries, evidence metadata, and future-ready AI fields behind the scenes."
      />
      <CaseIntakeForm />
    </div>
  );
}
