import { redirect } from "next/navigation";

import { readSession } from "@/lib/auth/session";

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await readSession();

  if (session) {
    redirect(session.role === "admin" ? "/admin" : "/dashboard");
  }

  return children;
}
