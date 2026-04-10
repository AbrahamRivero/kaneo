import { client } from "@palcodesk/libs";
import type { ScheduledPermission } from "@/types/scheduled-permission";

async function toggleScheduledPermission({
  workspaceId,
  userId,
  permissionId,
  isActive,
}: {
  workspaceId: string;
  userId: string;
  permissionId: string;
  isActive: boolean;
}): Promise<ScheduledPermission> {
  const response = await client["workspace-user"][":workspaceId"].users[
    ":userId"
  ].permissions[":permissionId"].toggle.$patch({
    json: { isActive },
    param: { workspaceId, userId, permissionId },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  const data = await response.json();
  return data;
}

export default toggleScheduledPermission;