import type { client } from "@kaneo/libs";
import type { InferResponseType } from "hono/client";

export type WorkspaceBase = Extract<
  InferResponseType<(typeof client)["workspace"][":id"]["$get"]>,
  { id: string }
>;

export type Workspace = Omit<WorkspaceBase, "currentUserRole"> & {
  currentUserRole?: "owner" | "member" | "viewer";
};

export default Workspace;
