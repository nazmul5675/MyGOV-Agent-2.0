import type { UserRole } from "@/lib/types";

const roleValues = new Set<UserRole>(["citizen", "admin"]);

export function normalizeUserRole(value: unknown): UserRole | null {
  return typeof value === "string" && roleValues.has(value as UserRole)
    ? (value as UserRole)
    : null;
}
