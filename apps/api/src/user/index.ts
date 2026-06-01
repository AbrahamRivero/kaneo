import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { getUserName } from "../event-room/utils/get-user-name.js";
import changePassword from "./controllers/change-password.js";

const user = new Hono();

user.get("/:id/name", async (c) => {
  const userId = c.req.param("id");

  if (!userId) {
    return c.json({ message: "User ID required" }, 400);
  }

  try {
    const name = await getUserName(userId);
    return c.json({ name });
  } catch (error) {
    return c.json(
      {
        message: error instanceof Error ? error.message : "Error fetching user",
      },
      400,
    );
  }
});

user.put(
  "/password",
  zValidator(
    "json",
    z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(8),
    }),
  ),
  async (c) => {
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    const user = (c as any).get("user") as any;
    const userId = user?.id as string | undefined;

    if (!userId) {
      return c.json({ message: "Unauthorized" }, 401);
    }

    const payload = c.req.valid("json");

    try {
      const res = await changePassword(userId, payload);
      return c.json(res);
    } catch (error) {
      return c.json(
        { message: error instanceof Error ? error.message : "" },
        400,
      );
    }
  },
);

export default user;
