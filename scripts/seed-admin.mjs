/**
 * seed-admin.mjs
 * ---------------------------------------------------------------------------
 * Creates the first admin account in Firebase Auth + MongoDB for live mode.
 * Run ONCE after switching NEXT_PUBLIC_APP_MODE=live.
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-admin.mjs \
 *     --email admin@yourdomain.com \
 *     --password "YourStrongPassword123" \
 *     --name "Admin User"
 * ---------------------------------------------------------------------------
 */

import { cert, initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { MongoClient } from "mongodb";

// ── CLI arg parsing ────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function getArg(flag) {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : null;
}

const email = getArg("--email");
const password = getArg("--password");
const name = getArg("--name") ?? "Admin";

if (!email || !password) {
  console.error("Usage: node scripts/seed-admin.mjs --email <email> --password <password> [--name <name>]");
  process.exit(1);
}

// ── Firebase Admin ─────────────────────────────────────────────────────────
const required = ["FIREBASE_PROJECT_ID", "FIREBASE_CLIENT_EMAIL", "FIREBASE_PRIVATE_KEY"];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing env vars: ${missing.join(", ")}`);
  process.exit(1);
}

const app =
  getApps()[0] ??
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });

const auth = getAuth(app);

// ── MongoDB ────────────────────────────────────────────────────────────────
if (!process.env.MONGODB_URI) {
  console.error("Missing MONGODB_URI env var.");
  process.exit(1);
}

const client = new MongoClient(process.env.MONGODB_URI);

try {
  await client.connect();
  const db = client.db(process.env.MONGODB_DB_NAME ?? "mygov_agent_2");
  const users = db.collection("users");

  // ── Create or fetch Firebase Auth user ──────────────────────────────────
  let uid;
  try {
    const existing = await auth.getUserByEmail(email);
    uid = existing.uid;
    console.log(`ℹ️  Firebase user already exists: ${uid}`);
  } catch {
    const created = await auth.createUser({ email, password, displayName: name });
    uid = created.uid;
    console.log(`✅ Firebase user created: ${uid}`);
  }

  // ── Set admin custom claim ───────────────────────────────────────────────
  const userRecord = await auth.getUser(uid);
  const existingClaims =
    userRecord.customClaims && typeof userRecord.customClaims === "object"
      ? userRecord.customClaims
      : {};

  await auth.setCustomUserClaims(uid, { ...existingClaims, role: "admin" });
  console.log(`✅ Custom claim role=admin set for ${uid}`);

  // ── Upsert MongoDB profile ───────────────────────────────────────────────
  const now = new Date().toISOString();
  const existingProfile = await users.findOne({ uid });

  if (existingProfile) {
    await users.updateOne(
      { uid },
      { $set: { role: "admin", fullName: name, email: email.toLowerCase(), updatedAt: now } }
    );
    console.log(`✅ MongoDB profile updated for ${uid}`);
  } else {
    await users.insertOne({
      id: uid,
      uid,
      email: email.toLowerCase(),
      fullName: name,
      role: "admin",
      accountStatus: "active",
      password: "",
      documents: [],
      createdAt: now,
      updatedAt: now,
    });
    console.log(`✅ MongoDB profile created for ${uid}`);
  }

  console.log(`\n🎉 Admin account ready!`);
  console.log(`   Email:    ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`   UID:      ${uid}`);
  console.log(`\n   You can now sign in at /login with these credentials.\n`);
} finally {
  await client.close();
}
