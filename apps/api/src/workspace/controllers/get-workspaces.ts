import { eq, or } from "drizzle-orm";
import db from "../../database";
import { workspaceTable, workspaceUserTable } from "../../database/schema";

async function getWorkspaces(userId: string) {
  const workspaces = await db
    .select({
      id: workspaceTable.id,
      name: workspaceTable.name,
      ownerId: workspaceTable.ownerId,
      createdAt: workspaceTable.createdAt,
      description: workspaceTable.description,
      phoneBoardEnabled: workspaceTable.phoneBoardEnabled,
      phoneBoardData: workspaceTable.phoneBoardData,
    })
    .from(workspaceTable)
    .leftJoin(
      workspaceUserTable,
      eq(workspaceTable.id, workspaceUserTable.workspaceId),
    )
    .where(
      or(
        eq(workspaceTable.ownerId, userId),
        eq(workspaceUserTable.userId, userId),
      ),
    )
    .groupBy(
      workspaceTable.id,
      workspaceTable.name,
      workspaceTable.ownerId,
      workspaceTable.description,
      workspaceTable.phoneBoardEnabled,
      workspaceTable.phoneBoardData,
    );

  return workspaces;
}

export default getWorkspaces;
