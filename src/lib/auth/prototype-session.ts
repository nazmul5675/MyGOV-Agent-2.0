import "server-only";

import { jwtVerify, SignJWT } from "jose";

import type { AppSession } from "@/lib/types";

const encoder = new TextEncoder();
const SESSION_ISSUER = "mygov-agent-2.0";
const SESSION_AUDIENCE = "mygov-agent-2.0-app";

function getPrototypeSessionSecret() {
  const secret =
    process.env.APP_SESSION_SECRET ||
    process.env.FIREBASE_PRIVATE_KEY ||
    process.env.FIREBASE_CLIENT_EMAIL;

  if (!secret) {
    throw new Error(
      "Prototype session secret is missing. Set APP_SESSION_SECRET or keep Firebase server credentials configured."
    );
  }

  return encoder.encode(secret);
}

export async function createPrototypeSessionToken(session: AppSession) {
  return new SignJWT({
    uid: session.uid,
    email: session.email,
    name: session.name,
    role: session.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(SESSION_ISSUER)
    .setAudience(SESSION_AUDIENCE)
    .setExpirationTime("5d")
    .sign(getPrototypeSessionSecret());
}

export async function verifyPrototypeSessionToken(token: string) {
  const result = await jwtVerify(token, getPrototypeSessionSecret(), {
    issuer: SESSION_ISSUER,
    audience: SESSION_AUDIENCE,
  });

  const payload = result.payload;
  const role = payload.role;

  if (
    typeof payload.uid !== "string" ||
    typeof payload.email !== "string" ||
    typeof payload.name !== "string" ||
    (role !== "citizen" && role !== "admin")
  ) {
    return null;
  }

  return {
    uid: payload.uid,
    email: payload.email,
    name: payload.name,
    role,
  } satisfies AppSession;
}
