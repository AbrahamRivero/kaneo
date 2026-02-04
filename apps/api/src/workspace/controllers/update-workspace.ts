import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { workspaceTable } from "../../database/schema";

type UpdateWorkspacePayload = {
  name: string;
  description: string;
  phoneBoardEnabled?: boolean;
  phoneBoardData?: Record<
    string,
    { extension?: string; type?: "digital" | "analog"; blocked?: boolean }
  > | null;
};

async function updateWorkspace(
  userId: string,
  workspaceId: string,
  payload: UpdateWorkspacePayload,
) {
  const [existingWorkspace] = await db
    .select({
      id: workspaceTable.id,
      ownerId: workspaceTable.ownerId,
    })
    .from(workspaceTable)
    .where(
      and(
        eq(workspaceTable.id, workspaceId),
        eq(workspaceTable.ownerId, userId),
      ),
    )
    .limit(1);

  const isWorkspaceExisting = Boolean(existingWorkspace);

  if (!isWorkspaceExisting) {
    throw new HTTPException(404, {
      message: "Workspace not found",
    });
  }

  const setPayload: Record<string, unknown> = {
    name: payload.name,
    description: payload.description,
  };
  if (payload.phoneBoardEnabled !== undefined) {
    setPayload.phoneBoardEnabled = payload.phoneBoardEnabled;
  }
  if (payload.phoneBoardData !== undefined) {
    setPayload.phoneBoardData = payload.phoneBoardData;
  }

  const [updatedWorkspace] = await db
    .update(workspaceTable)
    .set(setPayload)
    .where(eq(workspaceTable.id, workspaceId))
    .returning({
      id: workspaceTable.id,
      name: workspaceTable.name,
      ownerId: workspaceTable.ownerId,
      description: workspaceTable.description,
      phoneBoardEnabled: workspaceTable.phoneBoardEnabled,
      phoneBoardData: workspaceTable.phoneBoardData,
      createdAt: workspaceTable.createdAt,
    });

  return updatedWorkspace;
}

export default updateWorkspace;
