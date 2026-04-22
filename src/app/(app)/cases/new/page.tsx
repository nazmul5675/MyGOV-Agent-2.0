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
        description="Describe the issue, add any useful proof, and send it with confidence. You will track progress from your case page right after submit."
      />
      <CaseIntakeForm userId={session.uid} />
    </div>
  );
}
