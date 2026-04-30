import { useQuery } from "@tanstack/react-query";

async function fetchUserName(userId: string): Promise<string> {
  const base = import.meta.env.VITE_API_URL || "";
  const url = `${base}/user/${userId}/name`;

  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Failed to fetch user name");
  }

  const data = await res.json();
  return data.name || "Unknown User";
}

export function useGetUserName(userId: string | null | undefined) {
  return useQuery({
    queryKey: ["user-name", userId],
    queryFn: () => fetchUserName(userId ?? ""),
    enabled: !!userId,
  });
}