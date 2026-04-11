import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import db from "../database";
import { userTable } from "../database/schema";
import { subscribeToEvent } from "../events";
import activatePendingWorkspaceUsers from "./controllers/activate-pending-workspace-users";
import createRootWorkspaceUser from "./controllers/create-root-workspace-user";
import deleteWorkspaceUser from "./controllers/delete-workspace-user";
import getActiveWorkspaceUsers from "./controllers/get-active-workspace-users";
import getWorkspaceUser from "./controllers/get-workspace-user";
import getWorkspaceUsers from "./controllers/get-workspace-users";
import inviteWorkspaceUser from "./controllers/invite-workspace-user";
import resetMemberPassword from "./controllers/reset-member-password";
import {
  createScheduledPermission,
  deleteScheduledPermission,
  getScheduledPermissions,
  updateScheduledPermission,
} from "./controllers/scheduled-permissions";
import updateWorkspaceUser from "./controllers/update-workspace-user";
import updateWorkspaceUserRole from "./controllers/update-workspace-user-role";

const workspaceUser = new Hono<{
  Variables: {
    userId: string;
  };
}>()
  .get(
    "/user/:id",
    zValidator("param", z.object({ id: z.string() })),
    async (c) => {
      const { id } = c.req.valid("param");

      const workspaceUser = await getWorkspaceUser(id);

      return c.json(workspaceUser);
    },
  )
  .post(
    "/root",
    zValidator(
      "json",
      z.object({
        workspaceId: z.string(),
        userId: z.string(),
      }),
    ),
    async (c) => {
      const { workspaceId, userId } = c.req.valid("json");

      const workspaceUser = await createRootWorkspaceUser(workspaceId, userId);

      return c.json(workspaceUser);
    },
  )
  .get(
    "/:workspaceId",
    zValidator("param", z.object({ workspaceId: z.string() })),
    async (c) => {
      const { workspaceId } = c.req.valid("param");

      const workspaceUsers = await getWorkspaceUsers(workspaceId);

      return c.json(workspaceUsers);
    },
  )
  .delete(
    "/:workspaceId",
    zValidator("param", z.object({ workspaceId: z.string() })),
    zValidator("query", z.object({ userId: z.string() })),
    async (c) => {
      const { workspaceId } = c.req.valid("param");
      const { userId } = c.req.valid("query");
      const requesterId = c.get("userId") as string;

      const deletedWorkspaceUser = await deleteWorkspaceUser(
        workspaceId,
        requesterId,
        userId,
      );

      return c.json(deletedWorkspaceUser);
    },
  )
  .put(
    "/:userId",
    zValidator("param", z.object({ userId: z.string() })),
    zValidator("json", z.object({ status: z.string() })),
    async (c) => {
      const { userId } = c.req.valid("param");
      const { status } = c.req.valid("json");

      const updatedWorkspaceUser = await updateWorkspaceUser(userId, status);

      return c.json(updatedWorkspaceUser);
    },
  )
  .get(
    "/:workspaceId/active",
    zValidator("param", z.object({ workspaceId: z.string() })),
    async (c) => {
      const { workspaceId } = c.req.valid("param");

      const activeWorkspaceUsers = await getActiveWorkspaceUsers(workspaceId);

      return c.json(activeWorkspaceUsers);
    },
  )
  .post(
    "/:workspaceId/invite",
    zValidator("param", z.object({ workspaceId: z.string() })),
    zValidator(
      "json",
      z.object({
        email: z.string().email(),
        role: z.enum(["owner", "member", "viewer"]).optional(),
      }),
    ),
    async (c) => {
      const { workspaceId } = c.req.valid("param");
      const { email, role } = c.req.valid("json");
      const userId = c.get("userId");

      const workspaceUser = await inviteWorkspaceUser(
        userId,
        workspaceId,
        email,
        role,
      );

      return c.json(workspaceUser);
    },
  )
  .patch(
    "/:workspaceId/users/:userId/role",
    zValidator(
      "param",
      z.object({ workspaceId: z.string(), userId: z.string() }),
    ),
    zValidator(
      "json",
      z.object({ role: z.enum(["owner", "member", "viewer"]) }),
    ),
    async (c) => {
      const { workspaceId, userId } = c.req.valid("param");
      const { role } = c.req.valid("json");

      const requesterId = c.get("userId") as string;

      const updatedUser = await updateWorkspaceUserRole(
        requesterId,
        workspaceId,
        userId,
        { role },
      );

      return c.json(updatedUser);
    },
  )
  .post(
    "/:workspaceId/reset-password",
    zValidator("param", z.object({ workspaceId: z.string() })),
    zValidator(
      "json",
      z.object({ userId: z.string(), password: z.string().min(8) }),
    ),
    async (c) => {
      const { workspaceId } = c.req.valid("param");
      const { userId, password } = c.req.valid("json");

      const requesterId = c.get("userId") as string;

      try {
        const res = await resetMemberPassword(workspaceId, requesterId, {
          userId,
          password,
        });
        return c.json(res);
      } catch (error) {
        return c.json(
          {
            message:
              error instanceof Error
                ? error.message
                : "Failed to reset password",
          },
          400,
        );
      }
    },
  )
  .delete(
    "/:workspaceId/invite/:userId",
    zValidator(
      "param",
      z.object({ workspaceId: z.string(), userId: z.string() }),
    ),
    async (c) => {
      const { workspaceId, userId } = c.req.valid("param");
      const requesterId = c.get("userId") as string;

      const deletedWorkspaceUser = await deleteWorkspaceUser(
        workspaceId,
        requesterId,
        userId,
      );

      return c.json(deletedWorkspaceUser);
    },
  )
  .get(
    "/:workspaceId/users/:userId/permissions",
    zValidator(
      "param",
      z.object({ workspaceId: z.string(), userId: z.string() }),
    ),
    async (c) => {
      const { workspaceId, userId } = c.req.valid("param");

      const permissions = await getScheduledPermissions(workspaceId, userId);

      return c.json(permissions);
    },
  )
  .post(
    "/:workspaceId/users/:userId/permissions",
    zValidator(
      "param",
      z.object({ workspaceId: z.string(), userId: z.string() }),
    ),
    zValidator(
      "json",
      z.object({
        action: z.enum([
          "create_reservations",
          "edit_reservations",
          "delete_reservations",
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
        ]),
        startTime: z.string().datetime(),
        endTime: z.string().datetime(),
      }),
    ),
    async (c) => {
      const { workspaceId, userId } = c.req.valid("param");
      const { action, startTime, endTime } = c.req.valid("json");
      const requesterId = c.get("userId") as string;

      const permission = await createScheduledPermission(
        requesterId,
        workspaceId,
        userId,
        {
          workspaceId,
          userId,
          action,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
        },
      );

      return c.json(permission);
    },
  )
  .put(
    "/:workspaceId/users/:userId/permissions/:permissionId",
    zValidator(
      "param",
      z.object({
        workspaceId: z.string(),
        userId: z.string(),
        permissionId: z.string(),
      }),
    ),
    zValidator(
      "json",
      z.object({
        action: z
          .enum([
            "create_reservations",
            "edit_reservations",
            "delete_reservations",
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
          ])
          .optional(),
        startTime: z.string().datetime().optional(),
        endTime: z.string().datetime().optional(),
      }),
    ),
    async (c) => {
      const { workspaceId, userId, permissionId } = c.req.valid("param");
      const payload = c.req.valid("json");
      const requesterId = c.get("userId") as string;

      const permission = await updateScheduledPermission(
        requesterId,
        workspaceId,
        permissionId,
        {
          ...payload,
          startTime: payload.startTime
            ? new Date(payload.startTime)
            : undefined,
          endTime: payload.endTime ? new Date(payload.endTime) : undefined,
        },
      );

      return c.json(permission);
    },
  )
  .delete(
    "/:workspaceId/users/:userId/permissions/:permissionId",
    zValidator(
      "param",
      z.object({
        workspaceId: z.string(),
        userId: z.string(),
        permissionId: z.string(),
      }),
    ),
    async (c) => {
      const { workspaceId, userId, permissionId } = c.req.valid("param");
      const requesterId = c.get("userId") as string;

      const permission = await deleteScheduledPermission(
        requesterId,
        workspaceId,
        permissionId,
      );

      return c.json(permission);
    },
  );

subscribeToEvent("user.signed_up", async ({ email }: { email: string }) => {
  if (!email) {
    return;
  }

  // Buscar el userId por email y activar todos los workspace users pendientes
  const [user] = await db
    .select({ id: userTable.id })
    .from(userTable)
    .where(eq(userTable.email, email))
    .limit(1);

  if (user) {
    await activatePendingWorkspaceUsers(user.id);
  }
});

// También activar cuando el usuario inicia sesión (signin)
subscribeToEvent("user.signed_in", async ({ email }: { email: string }) => {
  if (!email) {
    return;
  }

  const [user] = await db
    .select({ id: userTable.id })
    .from(userTable)
    .where(eq(userTable.email, email))
    .limit(1);

  if (user) {
    await activatePendingWorkspaceUsers(user.id);
  }
});

subscribeToEvent(
  "workspace.created",
  async ({
    workspaceId,
    ownerId,
  }: { workspaceId: string; ownerId: string }) => {
    if (!workspaceId || !ownerId) {
      return;
    }

    await createRootWorkspaceUser(workspaceId, ownerId);
  },
);

export default workspaceUser;
