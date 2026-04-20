import "server-only";

import { randomUUID } from "node:crypto";

import { getMongoCollections } from "@/lib/repositories/bootstrap";
import type { RoleAuditLogDocument, UserDocument } from "@/types/models";
import type { UserRole } from "@/lib/types";

export async function writeRoleAuditLog(input: {
  targetUserUid: string;
  previousRole: UserRole;
  nextRole: UserRole;
  changedByUid: string;
  changedByRole: UserRole;
  reason?: string;
}) {
  const { roleAuditLogs } = await getMongoCollections();
  const record: RoleAuditLogDocument = {
    id: `role-${randomUUID().slice(0, 10)}`,
    targetUserUid: input.targetUserUid,
    previousRole: input.previousRole,
    nextRole: input.nextRole,
    changedByUid: input.changedByUid,
    changedByRole: input.changedByRole,
    createdAt: new Date().toISOString(),
    reason: input.reason,
  };

  await roleAuditLogs.insertOne(record);
  return record;
}

export function computeProfileCompleteness(record: Partial<UserDocument>) {
  const checks = [
    Boolean(record.fullName?.trim()),
    Boolean(record.email?.trim()),
    Boolean(record.phoneNumber?.trim()),
    Boolean(record.addressText?.trim()),
    Boolean(record.dateOfBirth?.trim()),
    Boolean(record.documents?.length),
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}
