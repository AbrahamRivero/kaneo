export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

export default async function changePassword(body: ChangePasswordRequest) {
  const base = import.meta.env.VITE_API_URL || "";
  const url = (base ? base : "") + "/user/password";

  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || "Failed to change password");
  }

  return res.json();
}
