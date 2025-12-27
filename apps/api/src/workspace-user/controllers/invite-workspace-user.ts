import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { userTable, workspaceTable, workspaceUserTable } from "../../database/schema";

async function inviteWorkspaceUser(workspaceId: string, email: string) {
  const [workspace] = await db
    .select()
    .from(workspaceTable)
    .where(eq(workspaceTable.id, workspaceId));

  if (!workspace) {
    throw new HTTPException(404, {
      message: "Workspace not found",
    });
  }

  const [user] = await db
    .select()
    .from(userTable)
    .where(eq(userTable.email, email))
    .limit(1);

  if (!user) {
    throw new HTTPException(404, {
      message: "User not found",
    });
  }

  const userId = user.id;

  const [existingUser] = await db
    .select()
    .from(workspaceUserTable)
    .where(
      and(
        eq(workspaceUserTable.workspaceId, workspaceId),
        eq(workspaceUserTable.userId, userId),
      ),
    );

  if (existingUser) {
    throw new HTTPException(400, {
      message: "User is already invited to this workspace",
    });
  }

  const [invitedUser] = await db
    .insert(workspaceUserTable)
    .values({
      userId,
      workspaceId,
    })
    .returning();

  return invitedUser;
}

export default inviteWorkspaceUser;
