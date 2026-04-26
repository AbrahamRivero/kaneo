import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database/index.js";
import {
  scheduledPermissionTable,
  workspaceUserTable,
} from "../../database/schema.js";
import type { ScheduledAction } from "../../utils/permissions.js";

export type CreateScheduledPermissionPayload = {
  workspaceId: string;
  userId: string;
  action: ScheduledAction;
  startTime: Date;
  endTime: Date;
};

export type UpdateScheduledPermissionPayload = {
  action?: ScheduledAction;
  startTime?: Date;
  endTime?: Date;
};

export async function getScheduledPermissions(
  workspaceId: string,
  userId: string,
) {
  return db
    .select()
    .from(scheduledPermissionTable)
    .where(
      and(
        eq(scheduledPermissionTable.workspaceId, workspaceId),
        eq(scheduledPermissionTable.userId, userId),
      ),
    );
}

export async function getScheduledPermissionById(id: string) {
  const [permission] = await db
    .select()
    .from(scheduledPermissionTable)
    .where(eq(scheduledPermissionTable.id, id))
    .limit(1);

  return permission;
}

export async function createScheduledPermission(
  requesterId: string,
  workspaceId: string,
  targetUserId: string,
  payload: CreateScheduledPermissionPayload,
) {
  if (requesterId === targetUserId) {
    throw new HTTPException(400, {
      message: "Cannot assign permissions to yourself",
    });
  }

  const [requester] = await db
    .select()
    .from(workspaceUserTable)
    .where(
      and(
        eq(workspaceUserTable.workspaceId, workspaceId),
        eq(workspaceUserTable.userId, requesterId),
      ),
    )
    .limit(1);

  if (!requester || requester.role === "viewer") {
    throw new HTTPException(403, {
      message: "Only owners and members can assign permissions",
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

  if (targetUser.role === "viewer") {
    const validViewerActions: ScheduledAction[] = [
      "create_reservations",
      "edit_reservations",
      "delete_reservations",
      "mark_reservation_paid",
      "create_services",
      "edit_services",
      "delete_services",
      "create_tariffs",
      "edit_tariffs",
      "delete_tariffs",
      "create_rooms",
      "edit_rooms",
      "delete_rooms",
      "create_tasks",
      "edit_tasks",
      "delete_tasks",
      "create_projects",
      "edit_projects",
      "delete_projects",
      "create_time_entries",
      "edit_time_entries",
      "delete_time_entries",
      "create_labels",
      "edit_labels",
      "delete_labels",
      "import_issues",
      "edit_github_integration",
      "manage_notifications",
      "edit_comments",
    ];
    if (!validViewerActions.includes(payload.action)) {
      throw new HTTPException(400, {
        message: "Invalid action for viewer role",
      });
    }
  }

  const [permission] = await db
    .insert(scheduledPermissionTable)
    .values({
      workspaceId,
      userId: targetUserId,
      action: payload.action,
      startTime: payload.startTime,
      endTime: payload.endTime,
    })
    .returning();

  return permission;
}

export async function updateScheduledPermission(
  requesterId: string,
  workspaceId: string,
  permissionId: string,
  payload: UpdateScheduledPermissionPayload,
) {
  const [permission] = await db
    .select()
    .from(scheduledPermissionTable)
    .where(eq(scheduledPermissionTable.id, permissionId))
    .limit(1);

  if (!permission) {
    throw new HTTPException(404, { message: "Permission not found" });
  }

  if (requesterId === permission.userId) {
    throw new HTTPException(400, {
      message: "Cannot modify your own permissions",
    });
  }

  const [requesterWorkspaceUser] = await db
    .select()
    .from(workspaceUserTable)
    .where(
      and(
        eq(workspaceUserTable.workspaceId, workspaceId),
        eq(workspaceUserTable.userId, requesterId),
      ),
    )
    .limit(1);

  if (!requesterWorkspaceUser || requesterWorkspaceUser.role === "viewer") {
    throw new HTTPException(403, {
      message: "Only owners and members can modify permissions",
    });
  }

  const isRequesterOwner = requesterWorkspaceUser.role === "owner";
  const isTargetUserOwner = permission.userId === requesterId;

  if (!isRequesterOwner) {
    if (isTargetUserOwner) {
      throw new HTTPException(403, {
        message:
          "Only workspace owners can modify permissions for other owners",
      });
    }
  }

  if (payload.action) {
    const [targetUser] = await db
      .select()
      .from(workspaceUserTable)
      .where(
        and(
          eq(workspaceUserTable.workspaceId, workspaceId),
          eq(workspaceUserTable.userId, permission.userId),
        ),
      )
      .limit(1);

    if (targetUser?.role === "viewer") {
      const validViewerActions = [
        "create_reservations",
        "edit_reservations",
        "delete_reservations",
        "mark_reservation_paid",
        "create_services",
        "edit_services",
        "delete_services",
        "create_tariffs",
        "edit_tariffs",
        "delete_tariffs",
        "create_rooms",
        "edit_rooms",
        "delete_rooms",
        "create_tasks",
        "edit_tasks",
        "delete_tasks",
        "create_projects",
        "edit_projects",
        "delete_projects",
        "create_time_entries",
        "edit_time_entries",
        "delete_time_entries",
        "create_labels",
        "edit_labels",
        "delete_labels",
        "import_issues",
        "edit_github_integration",
        "manage_notifications",
        "edit_comments",
      ];
      if (!validViewerActions.includes(payload.action)) {
        throw new HTTPException(400, {
          message: "Invalid action for viewer role",
        });
      }
    }
  }

  const [updatedPermission] = await db
    .update(scheduledPermissionTable)
    .set({
      ...payload,
      updatedAt: new Date(),
    })
    .where(eq(scheduledPermissionTable.id, permissionId))
    .returning();

  return updatedPermission;
}

export async function deleteScheduledPermission(
  requesterId: string,
  workspaceId: string,
  permissionId: string,
) {
  const [permission] = await db
    .select()
    .from(scheduledPermissionTable)
    .where(eq(scheduledPermissionTable.id, permissionId))
    .limit(1);

  if (!permission) {
    throw new HTTPException(404, { message: "Permission not found" });
  }

  const [requesterWorkspaceUser] = await db
    .select()
    .from(workspaceUserTable)
    .where(
      and(
        eq(workspaceUserTable.workspaceId, workspaceId),
        eq(workspaceUserTable.userId, requesterId),
      ),
    )
    .limit(1);

  const isRequesterOwner = requesterWorkspaceUser?.role === "owner";
  const isTargetUserOwner = permission.userId === requesterId;

  if (!isRequesterOwner) {
    if (isTargetUserOwner) {
      throw new HTTPException(403, {
        message:
          "Only workspace owners can delete permissions for other owners",
      });
    }
  }

  const [deletedPermission] = await db
    .delete(scheduledPermissionTable)
    .where(eq(scheduledPermissionTable.id, permissionId))
    .returning();

  return deletedPermission;
}

export default {
  getScheduledPermissions,
  getScheduledPermissionById,
  createScheduledPermission,
  updateScheduledPermission,
  deleteScheduledPermission,
};
