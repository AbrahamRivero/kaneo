import { and, eq } from "drizzle-orm";
import db from "../../database";
import { workspaceUserTable } from "../../database/schema";

async function activatePendingWorkspaceUsers(userId: string) {
  const updatedWorkspaceUsers = await db
    .update(workspaceUserTable)
    .set({ status: "active" })
    .where(
      and(
        eq(workspaceUserTable.userId, userId),
        eq(workspaceUserTable.status, "pending"),
      ),
    )
    .returning();

  console.log(
    "activatePendingWorkspaceUsers:",
    `userId=${userId} activated=${updatedWorkspaceUsers.length}`,
  );

  return updatedWorkspaceUsers;
}

export default activatePendingWorkspaceUsers;

