import type { AppSession, UserProfile, UserRole } from "@/lib/types";
import { getPrototypeStore } from "@/lib/prototype/store";
import type { PrototypeUserRecord } from "@/types/prototype";

function slugifyName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function toUserProfile(record: PrototypeUserRecord): UserProfile {
  return {
    id: record.id,
    uid: record.uid,
    email: record.email,
    fullName: record.fullName,
    role: record.role,
    dateOfBirth: record.dateOfBirth,
    phoneNumber: record.phoneNumber,
    addressText: record.addressText,
    documents: record.documents,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export async function getUserProfile(session: AppSession): Promise<UserProfile> {
  const store = getPrototypeStore();
  const user = store.users.find((item) => item.uid === session.uid);

  if (!user) {
    throw new Error(
      `Prototype user ${session.uid} is missing from src/data/prototype/users.json.`
    );
  }

  return toUserProfile(user);
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
  const store = getPrototypeStore();
  const existing = store.users.find((item) => item.uid === uid);
  const now = new Date().toISOString();

  if (existing) {
    existing.fullName = data.fullName;
    existing.email = data.email;
    existing.role = data.role || existing.role;
    existing.dateOfBirth = data.dateOfBirth;
    existing.phoneNumber = data.phoneNumber;
    existing.addressText = data.addressText;
    existing.updatedAt = now;
    return;
  }

  store.users.push({
    id: uid,
    uid,
    email: data.email,
    fullName: data.fullName,
    role: data.role || "citizen",
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
  const store = getPrototypeStore();
  return (
    store.users.find(
      (item) => item.email.toLowerCase() === email.trim().toLowerCase()
    ) || null
  );
}

export async function createPrototypeUser(input: {
  fullName: string;
  email: string;
  password: string;
}) {
  const store = getPrototypeStore();
  const email = input.email.trim().toLowerCase();

  if (store.users.some((item) => item.email.toLowerCase() === email)) {
    throw new Error("An account with this email already exists.");
  }

  const slugBase = slugifyName(input.fullName) || "citizen";
  let uid = `citizen-${slugBase}`;
  let counter = 2;
  while (store.users.some((item) => item.uid === uid)) {
    uid = `citizen-${slugBase}-${counter}`;
    counter += 1;
  }

  const now = new Date().toISOString();
  const user: PrototypeUserRecord = {
    id: uid,
    uid,
    email,
    fullName: input.fullName.trim(),
    role: "citizen",
    password: input.password,
    documents: [],
    createdAt: now,
    updatedAt: now,
  };

  store.users.push(user);
  return user;
}
