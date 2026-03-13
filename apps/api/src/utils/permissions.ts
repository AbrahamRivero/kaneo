import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../database";
import { workspaceTable, workspaceUserTable } from "../database/schema";

export type WorkspaceRole = "owner" | "member" | "viewer";

export async function getUserRole(
  userId: string,
  workspaceId: string,
): Promise<WorkspaceRole | null> {
  const [workspace] = await db
    .select({ ownerId: workspaceTable.ownerId })
    .from(workspaceTable)
    .where(eq(workspaceTable.id, workspaceId))
    .limit(1);

  if (!workspace) {
    return null;
  }

  if (workspace.ownerId === userId) {
    return "owner";
  }

  const [member] = await db
    .select({ role: workspaceUserTable.role })
    .from(workspaceUserTable)
    .where(
      and(
        eq(workspaceUserTable.workspaceId, workspaceId),
        eq(workspaceUserTable.userId, userId),
        eq(workspaceUserTable.status, "active"),
      ),
    )
    .limit(1);

  if (!member) {
    return null;
  }

  return member.role as WorkspaceRole;
}

export async function requireAtLeastMember(
  userId: string,
  workspaceId: string,
): Promise<void> {
  const role = await getUserRole(userId, workspaceId);

  if (!role) {
    throw new HTTPException(403, { message: "Forbidden" });
  }

  if (role === "viewer") {
    throw new HTTPException(403, {
      message: "Viewers cannot perform this action",
    });
  }
}

export async function requireOwner(
  userId: string,
  workspaceId: string,
): Promise<void> {
  const role = await getUserRole(userId, workspaceId);

  if (!role) {
    throw new HTTPException(403, { message: "Forbidden" });
  }

  if (role !== "owner") {
    throw new HTTPException(403, {
      message: "Only workspace owners can perform this action",
    });
  }
}
