import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { sessionCookieName } from "@/lib/constants";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName);

  return NextResponse.redirect(new URL("/login", request.url));
}
