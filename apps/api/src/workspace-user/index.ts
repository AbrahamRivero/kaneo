import { eq } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
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
import updateWorkspaceUser from "./controllers/update-workspace-user";

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

      const deletedWorkspaceUser = await deleteWorkspaceUser(
        workspaceId,
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
    zValidator("json", z.object({ email: z.string().email() })),
    async (c) => {
      const { workspaceId } = c.req.valid("param");
      const { email } = c.req.valid("json");

      const workspaceUser = await inviteWorkspaceUser(workspaceId, email);

      return c.json(workspaceUser);
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

      const deletedWorkspaceUser = await deleteWorkspaceUser(
        workspaceId,
        userId,
      );

      return c.json(deletedWorkspaceUser);
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
