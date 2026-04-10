import { client } from "@palcodesk/libs";

export type GetScheduledPermissionsRequest = {
  workspaceId: string;
  userId: string;
};

async function getScheduledPermissions({
  workspaceId,
  userId,
}: GetScheduledPermissionsRequest) {
  const response = await client["workspace-user"][":workspaceId"].users[
    ":userId"
  ].permissions.$get({
    param: { workspaceId, userId },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  const data = await response.json();
  return data;
}

export default getScheduledPermissions;