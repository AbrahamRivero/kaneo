import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { workspaceTable, workspaceUserTable } from "../../database/schema";

type UpdateUserRolePayload = {
  role: "owner" | "member" | "viewer";
};

async function updateWorkspaceUserRole(
  requesterId: string,
  workspaceId: string,
  targetUserId: string,
  payload: UpdateUserRolePayload,
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
      message: "Only the workspace owner can change user roles",
    });
  }

  const [targetUser] = await db
    .select()
    .from(workspaceUserTable)
    .where(eq(workspaceUserTable.workspaceId, workspaceId))
    .limit(1);

  if (!targetUser || targetUser.userId !== targetUserId) {
    throw new HTTPException(404, { message: "User not found in workspace" });
  }

  if (payload.role === "owner") {
    await db
      .update(workspaceUserTable)
      .set({ role: "member" })
      .where(eq(workspaceUserTable.workspaceId, workspaceId));

    await db
      .update(workspaceTable)
      .set({ ownerId: targetUserId })
      .where(eq(workspaceTable.id, workspaceId));

    await db
      .update(workspaceUserTable)
      .set({ role: "owner" })
      .where(
        and(
          eq(workspaceUserTable.workspaceId, workspaceId),
          eq(workspaceUserTable.userId, targetUserId),
        ),
      );
  } else {
    await db
      .update(workspaceUserTable)
      .set({ role: payload.role })
      .where(
        and(
          eq(workspaceUserTable.workspaceId, workspaceId),
          eq(workspaceUserTable.userId, targetUserId),
        ),
      );
  }

  const [updatedUser] = await db
    .select()
    .from(workspaceUserTable)
    .where(
      and(
        eq(workspaceUserTable.workspaceId, workspaceId),
        eq(workspaceUserTable.userId, targetUserId),
      ),
    )
    .limit(1);

  return updatedUser;
}

export default updateWorkspaceUserRole;
