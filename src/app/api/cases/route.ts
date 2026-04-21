import { NextResponse } from "next/server";

import { readSession } from "@/lib/auth/session";
import { getAdminDashboardData, listAdminCases, listCitizenCases } from "@/lib/repositories/cases";
import { assertRole } from "@/lib/services/auth";
import { createCitizenCase } from "@/lib/services/cases";
import { handleRouteError, unauthorized } from "@/lib/security/api";
import { createCaseRequestSchema } from "@/lib/validation/cases";

export async function GET(request: Request) {
  try {
    const session = await readSession();
    if (!session) throw unauthorized();
    const searchParams = new URL(request.url).searchParams;

    if (session.role === "admin") {
      const includeHidden = searchParams.get("includeHidden") === "true";
      const data = includeHidden
        ? { queue: await listAdminCases({ includeHidden: true }), stats: [] }
        : await getAdminDashboardData();
      return NextResponse.json({
        cases: data.queue,
        stats: data.stats,
      });
    }

    const cases = await listCitizenCases(session.uid);
    return NextResponse.json({ cases });
  } catch (error) {
    return handleRouteError(error, "Unable to load cases.");
  }
}

export async function POST(request: Request) {
  try {
    const session = await readSession();
    if (!session) throw unauthorized();
    assertRole(session, "citizen");
    const body = createCaseRequestSchema.parse(await request.json());

    const created = await createCitizenCase({
      session,
      caseId: body.caseId,
      title: body.title,
      caseType: body.caseType,
      location: body.location,
      description: body.description,
      locationMeta: {
        locationText: body.location,
        formattedAddress: body.formattedAddress,
        placeId: body.placeId,
        lat: body.lat,
        lng: body.lng,
        timezoneId: body.timezoneId,
        nearbyLandmark: body.nearbyLandmark,
      },
      files: body.files,
    });

    return NextResponse.json({
      caseId: created.id,
      role: session.role,
    });
  } catch (error) {
    return handleRouteError(error, "Unable to create case.");
  }
}
