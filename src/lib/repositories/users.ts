import "server-only";

import { randomUUID } from "node:crypto";

import { setAuthUserRole } from "@/lib/firebase/admin";
import { getMongoCollections } from "@/lib/repositories/bootstrap";
import { normalizeUserRole } from "@/lib/firebase/roles";
import type {
  AdminManagedUser,
  AdminUsersDashboardData,
  AppSession,
  DashboardStat,
  UserProfile,
  UserRole,
} from "@/lib/types";
import type { AdminNoteDocument, UserDocument } from "@/types/models";

function slugifyName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function toUserProfile(record: UserDocument): UserProfile {
  return {
    id: record.id,
    uid: record.uid,
    email: record.email,
    fullName: record.fullName,
    role: record.role,
    accountStatus: record.accountStatus || "active",
    dateOfBirth: record.dateOfBirth,
    phoneNumber: record.phoneNumber,
    addressText: record.addressText,
    documents: record.documents,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    lastActiveAt: record.lastActiveAt,
    profileCompleteness: computeProfileCompleteness(record),
  };
}

function computeProfileCompleteness(record: Partial<UserDocument>) {
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

function compareByDateDesc<T extends { updatedAt?: string; createdAt?: string }>(left: T, right: T) {
  return (right.updatedAt || right.createdAt || "").localeCompare(
    left.updatedAt || left.createdAt || ""
  );
}

function buildUserStats(users: AdminManagedUser[]): DashboardStat[] {
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const totalUsers = users.length;
  const citizens = users.filter((user) => user.role === "citizen").length;
  const admins = users.filter((user) => user.role === "admin").length;
  const recent = users.filter((user) => {
    const created = user.createdAt ? Date.parse(user.createdAt) : Number.NaN;
    return Number.isFinite(created) && created >= weekAgo;
  }).length;
  const incomplete = users.filter((user) => user.profileCompleteness < 100).length;

  return [
    { label: "Total users", value: String(totalUsers), change: "All citizen and admin accounts" },
    { label: "Total citizens", value: String(citizens), change: "Public-service user accounts" },
    { label: "Total admins", value: String(admins), change: "Control-console operators" },
    { label: "New this week", value: String(recent), change: "Recently created accounts" },
    {
      label: "Profile follow-up",
      value: String(incomplete),
      change: "Accounts with incomplete profile details",
    },
  ];
}

async function listRoleChangeAudit() {
  const { adminNotes } = await getMongoCollections();
  return adminNotes
    .find({ targetUserId: { $exists: true }, action: { $in: ["promote_to_admin", "demote_to_citizen"] } })
    .sort({ createdAt: -1 })
    .limit(8)
    .toArray();
}

async function countCasesByUserId(userIds: string[]) {
  const { cases } = await getMongoCollections();
  const records = await cases.find({ citizenId: { $in: userIds } }).toArray();

  return records.reduce<Record<string, { total: number; open: number }>>((acc, item) => {
    acc[item.citizenId] ||= { total: 0, open: 0 };
    acc[item.citizenId].total += 1;
    if (item.status !== "resolved" && item.status !== "rejected") {
      acc[item.citizenId].open += 1;
    }
    return acc;
  }, {});
}

function toAdminManagedUser(
  record: UserDocument,
  counts: { total: number; open: number }
): AdminManagedUser {
  const profile = toUserProfile(record);

  return {
    ...profile,
    accountStatus: profile.accountStatus || "active",
    profileCompleteness: profile.profileCompleteness ?? computeProfileCompleteness(record),
    casesCount: counts.total,
    openCasesCount: counts.open,
  };
}

export async function getUserProfile(session: AppSession): Promise<UserProfile> {
  const user = await getUserProfileByUid(session.uid);

  if (!user) {
    throw new Error(`User profile ${session.uid} is missing from the MongoDB users collection.`);
  }

  return toUserProfile(user);
}

export async function getUserProfileByUid(uid: string) {
  const { users } = await getMongoCollections();
  return users.findOne({ uid });
}

export async function upsertUserProfile(
  uid: string,
  data: {
    fullName: string;
    email: string;
    role?: UserRole;
    dateOfBirth?: string;
    phoneNumber?: string;
    addressText?: string;
  }
) {
  const { users } = await getMongoCollections();
  const now = new Date().toISOString();
  const email = data.email.trim().toLowerCase();

  const existing = await users.findOne({ uid });
  const role = normalizeUserRole(data.role) || existing?.role || "citizen";

  if (existing) {
    await users.updateOne(
      { uid },
      {
        $set: {
          email,
          fullName: data.fullName.trim(),
          role,
          accountStatus: existing.accountStatus || "active",
          dateOfBirth: data.dateOfBirth,
          phoneNumber: data.phoneNumber,
          addressText: data.addressText,
          updatedAt: now,
        },
      }
    );
    return;
  }

  await users.insertOne({
    id: uid,
    uid,
    email,
    fullName: data.fullName.trim(),
    role,
    accountStatus: "active",
    password: "",
    dateOfBirth: data.dateOfBirth,
    phoneNumber: data.phoneNumber,
    addressText: data.addressText,
    documents: [],
    createdAt: now,
    updatedAt: now,
  });
}

export async function getUserByEmail(email: string) {
  const { users } = await getMongoCollections();
  return users.findOne({ email: email.trim().toLowerCase() });
}

export async function touchUserActivity(uid: string) {
  const { users } = await getMongoCollections();
  const now = new Date().toISOString();
  await users.updateOne(
    { uid },
    {
      $set: {
        lastActiveAt: now,
        updatedAt: now,
      },
    }
  );
}

export async function getAdminUserOverview() {
  const data = await getAdminUsersDashboardData();

  return {
    totalUsers: data.users.length,
    totalAdmins: data.users.filter((user) => user.role === "admin").length,
    newCitizensThisWeek: Number(
      data.stats.find((item) => item.label === "New this week")?.value || 0
    ),
    recentRoleChanges: data.recentRoleChanges,
  };
}

export async function getAdminUsersDashboardData(): Promise<AdminUsersDashboardData> {
  const { users } = await getMongoCollections();
  const records = await users.find({}).toArray();
  const caseCounts = await countCasesByUserId(records.map((record) => record.uid));
  const managedUsers = records
    .map((record) =>
      toAdminManagedUser(record, caseCounts[record.uid] || { total: 0, open: 0 })
    )
    .sort(compareByDateDesc);
  const roleAudit = await listRoleChangeAudit();

  return {
    stats: buildUserStats(managedUsers),
    users: managedUsers,
    recentRoleChanges: roleAudit.map((item) => ({
      id: item.id,
      title:
        item.action === "promote_to_admin" ? "Role promoted to admin" : "Role demoted to citizen",
      description: item.note,
      createdAt: item.createdAt,
      actor: item.actorName,
      actorId: item.actorId,
    })),
  };
}

export async function getManagedUserById(uid: string) {
  const { users } = await getMongoCollections();
  const record = await users.findOne({ uid });
  if (!record) return null;

  const counts = await countCasesByUserId([uid]);
  return toAdminManagedUser(record, counts[uid] || { total: 0, open: 0 });
}

export async function updateUserRole(input: {
  targetUid: string;
  nextRole: UserRole;
  actorId: string;
  actorName: string;
}) {
  const { users, adminNotes } = await getMongoCollections();
  const targetUser = await users.findOne({ uid: input.targetUid });

  if (!targetUser) {
    throw new Error("User account not found.");
  }

  if (targetUser.role === input.nextRole) {
    return { ok: true, role: targetUser.role };
  }

  if (input.actorId === input.targetUid && targetUser.role === "admin" && input.nextRole === "citizen") {
    throw new Error("You cannot remove your own admin access from the active session.");
  }

  if (targetUser.role === "admin" && input.nextRole === "citizen") {
    const adminCount = await users.countDocuments({ role: "admin" });
    if (adminCount <= 1) {
      throw new Error("At least one admin account must remain active.");
    }
  }

  const now = new Date().toISOString();
  await users.updateOne(
    { uid: input.targetUid },
    {
      $set: {
        role: input.nextRole,
        accountStatus: targetUser.accountStatus || "active",
        updatedAt: now,
      },
    }
  );

  await setAuthUserRole(input.targetUid, input.nextRole);

  const previousRole = targetUser.role;
  const auditRecord: AdminNoteDocument = {
    id: `note-${randomUUID().slice(0, 8)}`,
    targetUserId: input.targetUid,
    actorId: input.actorId,
    actorName: input.actorName,
    action: input.nextRole === "admin" ? "promote_to_admin" : "demote_to_citizen",
    note: `${targetUser.fullName} moved from ${previousRole} to ${input.nextRole}.`,
    createdAt: now,
  };

  await adminNotes.insertOne(auditRecord);

  return { ok: true, role: input.nextRole };
}

export async function createPrototypeUser(input: {
  fullName: string;
  email: string;
  password: string;
}) {
  const email = input.email.trim().toLowerCase();
  const { users } = await getMongoCollections();
  const existing = await users.findOne({ email });

  if (existing) {
    throw new Error("An account with this email already exists.");
  }

  const slugBase = slugifyName(input.fullName) || "citizen";
  let uid = `citizen-${slugBase}`;
  let counter = 2;

  while (await users.findOne({ uid })) {
    uid = `citizen-${slugBase}-${counter}`;
    counter += 1;
  }

  const now = new Date().toISOString();
  const user: UserDocument = {
    id: uid,
    uid,
    email,
    fullName: input.fullName.trim(),
    role: "citizen",
    accountStatus: "active",
    password: input.password,
    documents: [],
    createdAt: now,
    updatedAt: now,
  };

  await users.insertOne(user);
  return user;
}
