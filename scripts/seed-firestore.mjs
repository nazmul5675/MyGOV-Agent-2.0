import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const required = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
];

const missing = required.filter((key) => !process.env[key]);

if (missing.length) {
  console.error(`Missing Firebase Admin env vars: ${missing.join(", ")}`);
  process.exit(1);
}

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});

const db = getFirestore();
const now = new Date().toISOString();

const users = [
  {
    id: "citizen-demo",
    name: "Aisyah Rahman",
    email: "citizen@mygov.test",
    role: "citizen",
    location: "Petaling Jaya, Selangor",
    documents: ["MyKad", "Proof of address"],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "admin-demo",
    name: "Farid Hakim",
    email: "admin@mygov.test",
    role: "admin",
    location: "Putrajaya",
    documents: [],
    createdAt: now,
    updatedAt: now,
  },
];

for (const user of users) {
  await db.collection("users").doc(user.id).set(user, { merge: true });
}

console.log("Seeded Firestore users collection.");
