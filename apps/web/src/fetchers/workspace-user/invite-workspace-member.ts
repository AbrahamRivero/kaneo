import { client } from "@palcodesk/libs";
import type { InferRequestType } from "hono/client";
export type InviteWorkspaceMemberRequest = InferRequestType<
  (typeof client)["workspace-user"][":workspaceId"]["invite"]["$post"]
>["json"] &
  InferRequestType<
    (typeof client)["workspace-user"][":workspaceId"]["invite"]["$post"]
  >["param"];
const inviteWorkspaceMember = async ({
  workspaceId,
  email,
  role,
}: InviteWorkspaceMemberRequest & { role?: "owner" | "member" | "viewer" }) => {
  const response = await client["workspace-user"][":workspaceId"].invite.$post({
    json: { email, role },
    param: { workspaceId },
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  const data = await response.json();
  return data;
};
export default inviteWorkspaceMember;
