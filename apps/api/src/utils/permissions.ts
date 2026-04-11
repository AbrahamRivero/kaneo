import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../database";
import {
  scheduledPermissionTable,
  workspaceTable,
  workspaceUserTable,
} from "../database/schema";

export type WorkspaceRole = "owner" | "member" | "viewer";

export type ScheduledAction =
  | "create_reservations"
  | "edit_reservations"
  | "delete_reservations"
  | "create_services"
  | "edit_services"
  | "delete_services"
  | "create_tariffs"
  | "edit_tariffs"
  | "delete_tariffs"
  | "create_rooms"
  | "edit_rooms"
  | "delete_rooms"
  | "create_tasks"
  | "edit_tasks"
  | "delete_tasks"
  | "create_projects"
  | "edit_projects"
  | "delete_projects"
  | "create_time_entries"
  | "edit_time_entries"
  | "delete_time_entries"
  | "create_labels"
  | "edit_labels"
  | "delete_labels"
  | "import_issues"
  | "edit_github_integration"
  | "manage_notifications"
  | "edit_comments";

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
  action?: ScheduledAction,
): Promise<void> {
  const role = await getUserRole(userId, workspaceId);

  if (!role) {
    throw new HTTPException(403, { message: "Forbidden" });
  }

  if (role === "owner" || role === "member") {
    return;
  }

  if (role === "viewer" && action) {
    const hasPermission = await hasScheduledPermission(
      userId,
      workspaceId,
      action,
    );
    if (hasPermission) {
      return;
    }
  }

  throw new HTTPException(403, {
    message: "Viewers cannot perform this action",
  });
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

function isTimeInRange(
  currentTime: Date,
  startTime: Date,
  endTime: Date,
): boolean {
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
  const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }

  return currentMinutes >= startMinutes || currentMinutes < endMinutes;
}

export async function hasScheduledPermission(
  userId: string,
  workspaceId: string,
  action: ScheduledAction,
): Promise<boolean> {
  const role = await getUserRole(userId, workspaceId);

  if (role === "owner" || role === "member") {
    return true;
  }

  if (role !== "viewer") {
    return false;
  }

  const now = new Date();

  const permissions = await db
    .select()
    .from(scheduledPermissionTable)
    .where(
      and(
        eq(scheduledPermissionTable.userId, userId),
        eq(scheduledPermissionTable.workspaceId, workspaceId),
        eq(scheduledPermissionTable.action, action),
      ),
    );

  for (const permission of permissions) {
    if (isTimeInRange(now, permission.startTime, permission.endTime)) {
      return true;
    }
  }

  return false;
}

export async function hasAnyScheduledPermission(
  userId: string,
  workspaceId: string,
  actions: ScheduledAction[],
): Promise<boolean> {
  for (const action of actions) {
    if (await hasScheduledPermission(userId, workspaceId, action)) {
      return true;
    }
  }
  return false;
}
