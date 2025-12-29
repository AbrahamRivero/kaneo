import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import changePassword from "./controllers/change-password";

const user = new Hono();

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
      return c.json({ message: error instanceof Error ? error.message : "" }, 400);
    }
  },
);

export default user;
