import "server-only";

import { computeProfileCompleteness } from "@/lib/audit/logger";
import { setAuthUserRole } from "@/lib/firebase/admin";
import { normalizeUserRole } from "@/lib/firebase/roles";
import { getMongoCollections } from "@/lib/repositories/bootstrap";
import type {
  AdminManagedUser,
  AdminUsersDashboardData,
  AppSession,
  DashboardStat,
  UserProfile,
  UserRole,
} from "@/lib/types";
import type { UserDocument } from "@/types/models";

function toPlainRecord<T extends object>(record: T) {
  const plain = { ...(record as T & { _id?: unknown }) };
  delete plain._id;
  return plain as T;
}

function resolveUserUid(record: Partial<Pick<UserDocument, "firebaseUid" | "uid" | "id">>) {
  return record.firebaseUid || record.uid || record.id || "";
}

function toUserProfile(record: UserDocument): UserProfile {
  const plainRecord = toPlainRecord(record);
  const resolvedUid = resolveUserUid(plainRecord);

  return {
    id: plainRecord.id || resolvedUid,
    uid: resolvedUid,
    email: plainRecord.email,
    fullName: plainRecord.fullName,
    role: plainRecord.role,
    accountStatus: plainRecord.accountStatus,
    dateOfBirth: plainRecord.dateOfBirth,
    phoneNumber: plainRecord.phoneNumber,
    addressText: plainRecord.addressText,
    documents: plainRecord.documents,
    createdAt: plainRecord.createdAt,
    updatedAt: plainRecord.updatedAt,
    lastActiveAt: plainRecord.lastActiveAt,
    profileCompleteness: computeProfileCompleteness(plainRecord),
  };
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
  const { roleAuditLogs, users } = await getMongoCollections();
  const records = await roleAuditLogs.find({}).sort({ createdAt: -1 }).limit(8).toArray();

  return Promise.all(
    records.map(async (record) => {
      const plain = toPlainRecord(record);
      const actor = await users.findOne({ firebaseUid: plain.changedByUid });
      return {
        id: plain.id,
        title:
          plain.nextRole === "admin" ? "Role promoted to admin" : "Role demoted to citizen",
        description:
          plain.reason ||
          `${plain.targetUserUid} moved from ${plain.previousRole} to ${plain.nextRole}.`,
        createdAt: plain.createdAt,
        actor: actor?.fullName || plain.changedByUid,
        actorId: plain.changedByUid,
      };
    })
  );
}

async function countCasesByUserId(userIds: string[]) {
  const { cases } = await getMongoCollections();
  const records = await cases.find({ citizenUid: { $in: userIds } }).toArray();

  return records.reduce<Record<string, { total: number; open: number }>>((acc, item) => {
    acc[item.citizenUid] ||= { total: 0, open: 0 };
    acc[item.citizenUid].total += 1;
    if (item.status !== "resolved" && item.status !== "rejected") {
      acc[item.citizenUid].open += 1;
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
  const record = await users.findOne({
    $or: [{ firebaseUid: uid }, { uid }, { id: uid }],
  });
  return record ? toPlainRecord(record) : null;
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

  const existing = await users.findOne({
    $or: [{ firebaseUid: uid }, { uid }, { id: uid }],
  });
  const role = normalizeUserRole(data.role) || existing?.role || "citizen";

  if (existing) {
    await users.updateOne(
      { id: existing.id },
      {
        $set: {
          email,
          fullName: data.fullName.trim(),
          uid,
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
    firebaseUid: uid,
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
  const record = await users.findOne({ email: email.trim().toLowerCase() });
  return record ? toPlainRecord(record) : null;
}

export async function touchUserActivity(uid: string) {
  const { users } = await getMongoCollections();
  const now = new Date().toISOString();
  await users.updateOne(
    {
      $or: [{ firebaseUid: uid }, { uid }, { id: uid }],
    },
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
    newCitizensThisWeek: Number(data.stats.find((item) => item.label === "New this week")?.value || 0),
    recentRoleChanges: data.recentRoleChanges,
  };
}

export async function getAdminUsersDashboardData(): Promise<AdminUsersDashboardData> {
  const { users } = await getMongoCollections();
  const records = (await users.find({}).toArray()).map(toPlainRecord);
  const resolvedUserIds = records.map((record) => resolveUserUid(record));
  const caseCounts = await countCasesByUserId(resolvedUserIds);
  const managedUsers = records
    .map((record) =>
      toAdminManagedUser(record, caseCounts[resolveUserUid(record)] || { total: 0, open: 0 })
    )
    .sort(compareByDateDesc);

  return {
    stats: buildUserStats(managedUsers),
    users: managedUsers,
    recentRoleChanges: await listRoleChangeAudit(),
  };
}

export async function getManagedUserById(uid: string) {
  const { users } = await getMongoCollections();
  const record = await users.findOne({
    $or: [{ firebaseUid: uid }, { uid }, { id: uid }],
  });
  if (!record) return null;

  const counts = await countCasesByUserId([uid]);
  return toAdminManagedUser(toPlainRecord(record), counts[uid] || { total: 0, open: 0 });
}

export async function updateUserRole(input: {
  targetUid: string;
  nextRole: UserRole;
  actorId: string;
  actorName: string;
}) {
  const { users } = await getMongoCollections();
  const targetUser = await users.findOne({
    $or: [{ firebaseUid: input.targetUid }, { uid: input.targetUid }, { id: input.targetUid }],
  });

  if (!targetUser) {
    throw new Error("User account not found.");
  }

  if (targetUser.role === input.nextRole) {
    return { ok: true, changed: false, role: targetUser.role, previousRole: targetUser.role };
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
    { id: targetUser.id },
    {
      $set: {
        role: input.nextRole,
        accountStatus: targetUser.accountStatus || "active",
        updatedAt: now,
      },
    }
  );

  await setAuthUserRole(input.targetUid, input.nextRole);

  return {
    ok: true,
    changed: true,
    role: input.nextRole,
    previousRole: targetUser.role,
  };
}

function slugifyName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
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

  while (await users.findOne({ firebaseUid: uid })) {
    uid = `citizen-${slugBase}-${counter}`;
    counter += 1;
  }

  const now = new Date().toISOString();
  const user: UserDocument = {
    id: uid,
    uid,
    firebaseUid: uid,
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

export async function searchManagedUsers(query?: string) {
  const data = await getAdminUsersDashboardData();
  const normalized = query?.trim().toLowerCase();
  if (!normalized) return data.users;

  return data.users.filter((user) =>
    [user.fullName, user.email, user.uid].join(" ").toLowerCase().includes(normalized)
  );
}

export async function listRoleAuditLogs(limit = 25) {
  const { roleAuditLogs } = await getMongoCollections();
  const records = await roleAuditLogs.find({}).sort({ createdAt: -1 }).limit(limit).toArray();
  return records.map(toPlainRecord);
}
