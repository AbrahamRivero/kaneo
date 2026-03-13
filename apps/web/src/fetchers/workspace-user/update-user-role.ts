import { client } from "@kaneo/libs";

export type UpdateUserRoleRequest = {
  workspaceId: string;
  userId: string;
  role: "owner" | "member" | "viewer";
};

async function updateUserRole({
  workspaceId,
  userId,
  role,
}: UpdateUserRoleRequest) {
  const response = await client["workspace-user"][":workspaceId"].users[
    ":userId"
  ].role.$patch({
    json: { role },
    param: { workspaceId, userId },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  const data = await response.json();

  return data;
}

export default updateUserRole;
