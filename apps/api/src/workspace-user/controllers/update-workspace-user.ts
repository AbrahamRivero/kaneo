import { eq } from "drizzle-orm";
import db from "../../database";
import { userTable, workspaceUserTable } from "../../database/schema";

async function updateWorkspaceUser(
  identifier: string,
  status: string,
  isEmail = false,
) {
  let userId = identifier;

  if (isEmail) {
    const [user] = await db
      .select({ id: userTable.id })
      .from(userTable)
      .where(eq(userTable.email, identifier))
      .limit(1);

    if (!user) {
      return null;
    }

    userId = user.id;
  }

  const [updatedWorkspaceUser] = await db
    .update(workspaceUserTable)
    .set({ status })
    .where(eq(workspaceUserTable.userId, userId))
    .returning();

  return updatedWorkspaceUser;
}

export default updateWorkspaceUser;
