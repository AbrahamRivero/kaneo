import type {
  ScheduledPermission,
  UpdateScheduledPermissionRequest,
} from "@/types/scheduled-permission";
import { client } from "@palcodesk/libs";

async function updateScheduledPermission({
  workspaceId,
  userId,
  permissionId,
  ...payload
}: UpdateScheduledPermissionRequest & {
  workspaceId: string;
  userId: string;
  permissionId: string;
}): Promise<ScheduledPermission> {
  const response = await client["workspace-user"][":workspaceId"].users[
    ":userId"
  ].permissions[":permissionId"].$put({
    json: payload,
    param: { workspaceId, userId, permissionId },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  const data = await response.json();
  return data;
}

export default updateScheduledPermission;
