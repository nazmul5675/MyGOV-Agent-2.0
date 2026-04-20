import { NextResponse } from "next/server";

import { readSession } from "@/lib/auth/session";
import { getManagedUserById, searchManagedUsers } from "@/lib/repositories/users";
import { handleRouteError, unauthorized } from "@/lib/security/api";

export async function GET(request: Request) {
  try {
    const session = await readSession();
    if (!session) throw unauthorized();

    const url = new URL(request.url);
    const query = url.searchParams.get("q") || undefined;
    const userId = url.searchParams.get("userId");
    const role = url.searchParams.get("role");
    const status = url.searchParams.get("status");

    if (session.role === "admin") {
      if (userId) {
        const user = await getManagedUserById(userId);
        return NextResponse.json({ user });
      }

      const users = await searchManagedUsers(query);
      return NextResponse.json({
        users: users.filter((user) => {
          const matchesRole = role === "citizen" || role === "admin" ? user.role === role : true;
          const matchesStatus =
            status === "active" || status === "invited" || status === "disabled"
              ? (user.accountStatus || "active") === status
              : true;
          return matchesRole && matchesStatus;
        }),
      });
    }

    const user = await getManagedUserById(session.uid);
    return NextResponse.json({ user });
  } catch (error) {
    return handleRouteError(error, "Unable to load users.");
  }
}
