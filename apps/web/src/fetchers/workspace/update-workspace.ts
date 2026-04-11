import { client } from "@palcodesk/libs";
import type { InferRequestType } from "hono/client";
export type PhoneBoardCell = {
  extension?: string;
  type?: "digital" | "analog";
  blocked?: boolean;
};
export type PhoneBoardCellMap = Record<string, PhoneBoardCell>;
type UpdateWorkspaceRequest = InferRequestType<
  (typeof client.workspace)[":id"]["$put"]
>["param"] &
  InferRequestType<(typeof client.workspace)[":id"]["$put"]>["json"];
const updateWorkspace = async (payload: UpdateWorkspaceRequest) => {
  const { id, ...json } = payload;
  const response = await client.workspace[":id"].$put({
    param: { id },
    json: json as Parameters<
      (typeof client.workspace)[":id"]["$put"]
    >[0]["json"],
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  const workspace = await response.json();
  return workspace;
};
export default updateWorkspace;
