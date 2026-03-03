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
  zValidator(
    "query",
    z
      .object({
        dateRange: z
          .enum([
            "this-month",
            "last-month",
            "last-30-days",
            "this-quarter",
            "this-week",
          ])
          .optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
      .optional(),
  ),
  async (c) => {
    const { workspaceId } = c.req.valid("param");
    const query = c.req.valid("query");

    const data = await getAnalytics(workspaceId, query);

    return c.json(data);
  },
);

export default analytics;
