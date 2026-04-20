import { BadgeCheck, FileCheck2, type LucideIcon } from "lucide-react";

import type { UserRole } from "@/lib/types";

export function getProfileCards(input: {
  role: UserRole;
  documents: string[];
}): Array<{
  icon: LucideIcon;
  title: string;
  body: string;
}> {
  return [
    {
      icon: BadgeCheck,
      title: "Identity health",
      body: `${input.role === "citizen" ? "Citizen" : "Admin"} account verified and ready for assisted service workflows.`,
    },
    {
      icon: FileCheck2,
      title: "Stored documents",
      body: input.documents.length
        ? input.documents.join(", ")
        : "No stored documents are available in the application record for this account yet.",
    },
  ];
}
