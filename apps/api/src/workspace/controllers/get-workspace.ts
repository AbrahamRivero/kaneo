import { and, eq, or } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { workspaceTable, workspaceUserTable } from "../../database/schema";

async function getWorkspace(userId: string, workspaceId: string) {
  const [existingWorkspace] = await db
    .select({
      id: workspaceTable.id,
      name: workspaceTable.name,
      ownerId: workspaceTable.ownerId,
      description: workspaceTable.description,
      phoneBoardEnabled: workspaceTable.phoneBoardEnabled,
      phoneBoardData: workspaceTable.phoneBoardData,
      eventRoomsEnabled: workspaceTable.eventRoomsEnabled,
      createdAt: workspaceTable.createdAt,
    })
    .from(workspaceTable)
    .where(eq(workspaceTable.id, workspaceId))
    .limit(1);

  if (!existingWorkspace) {
    throw new HTTPException(404, {
      message: "Workspace not found",
    });
  }

  const isOwner = existingWorkspace.ownerId === userId;

  let currentUserRole: "owner" | "member" | "viewer" | undefined;

  if (isOwner) {
    currentUserRole = "owner";
  } else {
    const [member] = await db
      .select({
        role: workspaceUserTable.role,
      })
      .from(workspaceUserTable)
      .where(
        and(
          eq(workspaceUserTable.workspaceId, workspaceId),
          eq(workspaceUserTable.userId, userId),
        ),
      )
      .limit(1);

    currentUserRole = (member?.role as "member" | "viewer") || undefined;
  }

  return {
    ...existingWorkspace,
    currentUserRole,
  };
}

export default getWorkspace;
