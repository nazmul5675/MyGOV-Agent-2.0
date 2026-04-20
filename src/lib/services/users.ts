import "server-only";

import { writeRoleAuditLog } from "@/lib/audit/logger";
import { updateUserRole } from "@/lib/repositories/users";
import type { AppSession, UserRole } from "@/lib/types";

export async function changeUserRole(input: {
  session: AppSession;
  targetUid: string;
  nextRole: UserRole;
  reason?: string;
}) {
  const result = await updateUserRole({
    targetUid: input.targetUid,
    nextRole: input.nextRole,
    actorId: input.session.uid,
    actorName: input.session.name,
  });

  if (result.changed && result.previousRole) {
    await writeRoleAuditLog({
      targetUserUid: input.targetUid,
      previousRole: result.previousRole,
      nextRole: input.nextRole,
      changedByUid: input.session.uid,
      changedByRole: input.session.role,
      reason: input.reason,
    });
  }

  return { ok: true, role: result.role };
}
