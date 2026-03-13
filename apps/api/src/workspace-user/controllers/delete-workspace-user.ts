import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { workspaceTable, workspaceUserTable } from "../../database/schema";

async function deleteWorkspaceUser(
  workspaceId: string,
  requesterId: string,
  targetUserId: string,
) {
  const [workspace] = await db
    .select()
    .from(workspaceTable)
    .where(eq(workspaceTable.id, workspaceId))
    .limit(1);

  if (!workspace) {
    throw new HTTPException(404, { message: "Workspace not found" });
  }

  if (workspace.ownerId !== requesterId) {
    throw new HTTPException(403, {
      message: "Only the workspace owner can remove members",
    });
  }

  const workspaceMembers = await db
    .select()
    .from(workspaceUserTable)
    .where(eq(workspaceUserTable.workspaceId, workspaceId));

  if (workspaceMembers.length === 1) {
    throw new HTTPException(400, {
      message: "Cannot remove the last member of the workspace",
    });
  }

  const [targetUser] = await db
    .select()
    .from(workspaceUserTable)
    .where(
      and(
        eq(workspaceUserTable.workspaceId, workspaceId),
        eq(workspaceUserTable.userId, targetUserId),
      ),
    )
    .limit(1);

  if (!targetUser) {
    throw new HTTPException(404, { message: "User not found in workspace" });
  }

  if (workspace.ownerId === targetUserId) {
    const otherMembers = workspaceMembers.filter(
      (m) => m.userId !== targetUserId,
    );

    if (otherMembers.length > 0) {
      const newOwner = otherMembers[0];

      if (newOwner) {
        await db
          .update(workspaceTable)
          .set({ ownerId: newOwner.userId })
          .where(eq(workspaceTable.id, workspaceId));

        await db
          .update(workspaceUserTable)
          .set({ role: "owner" })
          .where(
            and(
              eq(workspaceUserTable.workspaceId, workspaceId),
              eq(workspaceUserTable.userId, newOwner.userId),
            ),
          );
      }
    }
  }

  const [deletedWorkspaceUser] = await db
    .delete(workspaceUserTable)
    .where(
      and(
        eq(workspaceUserTable.workspaceId, workspaceId),
        eq(workspaceUserTable.userId, targetUserId),
      ),
    )
    .returning();

  return deletedWorkspaceUser;
}

export default deleteWorkspaceUser;
