import { NextResponse } from "next/server";

import { readSession } from "@/lib/auth/session";
import { listNotificationsForUser } from "@/lib/repositories/notifications";
import { handleRouteError, unauthorized } from "@/lib/security/api";

export async function GET() {
  try {
    const session = await readSession();
    if (!session) throw unauthorized();

    const notifications = await listNotificationsForUser(session.uid);
    return NextResponse.json({ notifications });
  } catch (error) {
    return handleRouteError(error, "Unable to load notifications.");
  }
}
