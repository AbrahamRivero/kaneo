import type { CreateScheduledPermissionRequest, ScheduledPermission } from "@/types/scheduled-permission";
import { client } from "@palcodesk/libs";

async function createScheduledPermission(
  data: CreateScheduledPermissionRequest
): Promise<ScheduledPermission> {
  const { workspaceId, userId, action, startTime, endTime, isActive } = data;

  const response = await client["workspace-user"][":workspaceId"].users[
    ":userId"
  ].permissions.$post({
    json: { action, startTime, endTime, isActive },
    param: { workspaceId, userId },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  const result = await response.json();
  return result;
}

export default createScheduledPermission;