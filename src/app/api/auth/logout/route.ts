import { NextResponse } from "next/server";

import { sessionCookieName } from "@/lib/constants";

export async function GET(request: Request) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const redirectUrl = appUrl
    ? new URL("/login", appUrl)
    : new URL("/login", request.url);
  const response = NextResponse.redirect(redirectUrl);
  response.cookies.delete(sessionCookieName);
  return response;
}
