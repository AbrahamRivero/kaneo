import { client } from "@palcodesk/libs";

async function deleteScheduledPermission({
  workspaceId,
  userId,
  permissionId,
}: {
  workspaceId: string;
  userId: string;
  permissionId: string;
}): Promise<boolean> {
  const response = await client["workspace-user"][":workspaceId"].users[
    ":userId"
  ].permissions[":permissionId"].$delete({
    param: { workspaceId, userId, permissionId },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return true;
}

export default deleteScheduledPermission;