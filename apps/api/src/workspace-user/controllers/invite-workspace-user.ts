import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import {
  userTable,
  workspaceTable,
  workspaceUserTable,
} from "../../database/schema";
import { requireAtLeastMember } from "../../utils/permissions";

async function inviteWorkspaceUser(
  userId: string,
  workspaceId: string,
  email: string,
  role?: "owner" | "member" | "viewer",
) {
  const [workspace] = await db
    .select()
    .from(workspaceTable)
    .where(eq(workspaceTable.id, workspaceId));

  if (!workspace) {
    throw new HTTPException(404, {
      message: "Workspace not found",
    });
  }

  await requireAtLeastMember(userId, workspaceId);

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

  const targetUserId = user.id;

  const [existingUser] = await db
    .select()
    .from(workspaceUserTable)
    .where(
      and(
        eq(workspaceUserTable.workspaceId, workspaceId),
        eq(workspaceUserTable.userId, targetUserId),
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
      userId: targetUserId,
      workspaceId,
      role: role || "member",
    })
    .returning();

  return invitedUser;
}

export default inviteWorkspaceUser;
