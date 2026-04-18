import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { demoCookieName, sessionCookieName } from "@/lib/constants";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName);
  cookieStore.delete(demoCookieName);

  return NextResponse.redirect(new URL("/login", request.url));
}
