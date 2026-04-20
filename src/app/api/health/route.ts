import { NextResponse } from "next/server";

import { getBackendEnvironmentSummary } from "@/lib/config/env";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "mygov-agent-2.0",
    timestamp: new Date().toISOString(),
    environment: getBackendEnvironmentSummary(),
  });
}
