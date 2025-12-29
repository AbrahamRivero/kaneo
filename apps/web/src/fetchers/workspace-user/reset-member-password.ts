export type ResetMemberPasswordRequest = {
  workspaceId: string;
  userId: string;
  password: string;
};

export default async function resetMemberPassword(body: ResetMemberPasswordRequest) {
  const base = import.meta.env.VITE_API_URL || "";
  const url = (base ? base : "") + `/workspace-user/${body.workspaceId}/reset-password`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: body.userId, password: body.password }),
    credentials: "include",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || "Failed to reset member password");
  }

  return res.json();
}
