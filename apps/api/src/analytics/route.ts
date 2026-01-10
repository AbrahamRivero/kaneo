import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import getAnalytics from ".";

const analytics = new Hono<{
  Variables: {
    userId: string;
  };
}>().get(
  "/:workspaceId",
  zValidator("param", z.object({ workspaceId: z.string() })),
  async (c) => {
    const { workspaceId } = c.req.valid("param");

    const data = await getAnalytics(workspaceId);

    return c.json(data);
  },
);

export default analytics;
