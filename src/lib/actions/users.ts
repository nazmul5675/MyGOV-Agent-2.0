export async function updateAdminUserRole(input: {
  userId: string;
  role: "citizen" | "admin";
}) {
  const response = await fetch(`/api/admin/users/${input.userId}/role`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role: input.role }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error || "Request failed.");
  }

  return response.json() as Promise<{ ok: boolean; role: "citizen" | "admin" }>;
}
