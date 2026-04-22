import type { Metadata } from "next";

import { requireRole } from "@/lib/auth/session";
import { CaseIntakeForm } from "@/components/forms/case-intake-form";
import { PageHeader } from "@/components/common/page-header";

export const metadata: Metadata = {
  title: "Create Case",
};

export default async function NewCasePage() {
  const session = await requireRole("citizen");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="New case"
        title="Create a case in one guided flow"
        description="Share the issue clearly, add your strongest supporting file, and submit with confidence."
      />
      <CaseIntakeForm userId={session.uid} />
    </div>
  );
}
