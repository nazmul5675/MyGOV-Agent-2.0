import "server-only";

import { getMongoCollections } from "@/lib/repositories/bootstrap";
import { normalizeUserRole } from "@/lib/firebase/roles";
import type { AppSession, UserProfile, UserRole } from "@/lib/types";
import type { UserDocument } from "@/types/models";

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
    dateOfBirth: record.dateOfBirth,
    phoneNumber: record.phoneNumber,
    addressText: record.addressText,
    documents: record.documents,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
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
    password: input.password,
    documents: [],
    createdAt: now,
    updatedAt: now,
  };

  await users.insertOne(user);
  return user;
}
