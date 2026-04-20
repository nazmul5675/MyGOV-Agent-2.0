import { NextResponse } from "next/server";

import { readSession } from "@/lib/auth/session";
import { getAdminCaseById, getCitizenCaseById } from "@/lib/repositories/cases";
import { handleRouteError, notFoundError, unauthorized } from "@/lib/security/api";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await readSession();
    if (!session) throw unauthorized();

    const { id } = await context.params;
    const item =
      session.role === "admin"
        ? await getAdminCaseById(id)
        : await getCitizenCaseById(session.uid, id);

    if (!item) throw notFoundError("Case not found.");
    return NextResponse.json({ case: item });
  } catch (error) {
    return handleRouteError(error, "Unable to load case.");
  }
}
