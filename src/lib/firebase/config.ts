export function hasFirebaseClientConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET &&
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  );
}

export function hasFirebaseAdminConfig() {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  );
}

export function getMissingFirebaseClientVars() {
  const missing: string[] = [];

  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    missing.push("NEXT_PUBLIC_FIREBASE_API_KEY");
  }
  if (!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) {
    missing.push("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
  }
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    missing.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  }
  if (!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) {
    missing.push("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET");
  }
  if (!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) {
    missing.push("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID");
  }
  if (!process.env.NEXT_PUBLIC_FIREBASE_APP_ID) {
    missing.push("NEXT_PUBLIC_FIREBASE_APP_ID");
  }

  return missing;
}

export function getMissingFirebaseAdminVars() {
  const missing: string[] = [];

  if (!process.env.FIREBASE_PROJECT_ID) {
    missing.push("FIREBASE_PROJECT_ID");
  }
  if (!process.env.FIREBASE_CLIENT_EMAIL) {
    missing.push("FIREBASE_CLIENT_EMAIL");
  }
  if (!process.env.FIREBASE_PRIVATE_KEY) {
    missing.push("FIREBASE_PRIVATE_KEY");
  }

  return missing;
}