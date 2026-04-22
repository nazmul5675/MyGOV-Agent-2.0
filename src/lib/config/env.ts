import "server-only";

const requiredEnvKeys = {
  mongodb: ["MONGODB_URI"] as const,
  gridfs: ["GRIDFS_BUCKET_NAME"] as const,
  firebaseAdmin: ["FIREBASE_PROJECT_ID", "FIREBASE_CLIENT_EMAIL", "FIREBASE_PRIVATE_KEY"] as const,
  gemini: ["GEMINI_API_KEY"] as const,
} as const;

export type EnvCheckKey = keyof typeof requiredEnvKeys;

export function getMissingEnvVars(kind: EnvCheckKey) {
  return requiredEnvKeys[kind].filter((key) => !process.env[key]?.trim());
}

export function assertEnvConfigured(kind: EnvCheckKey) {
  const missing = getMissingEnvVars(kind);
  if (!missing.length) return;

  throw new Error(
    `${kind} configuration is incomplete. Missing environment variables: ${missing.join(", ")}.`
  );
}

export function getBackendEnvironmentSummary() {
  return {
    hasMongo: getMissingEnvVars("mongodb").length === 0,
    hasGridFs: getMissingEnvVars("gridfs").length === 0,
    hasFirebaseAdmin: getMissingEnvVars("firebaseAdmin").length === 0,
    hasGemini: getMissingEnvVars("gemini").length === 0,
  };
}
