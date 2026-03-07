import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import getAnalytics from ".";
import getOverdueTasks from "./overdue";
import getProjectAnalytics from "./project";

const analytics = new Hono<{
  Variables: {
    userId: string;
  };
}>()
  .get(
    "/:workspaceId",
    zValidator("param", z.object({ workspaceId: z.string() })),
    zValidator(
      "query",
      z
        .object({
          dateRange: z
            .enum(["this-month", "last-month", "this-quarter", "this-week"])
            .optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          projectId: z.string().optional(),
        })
        .optional(),
    ),
    async (c) => {
      const { workspaceId } = c.req.valid("param");
      const query = c.req.valid("query");

      const data = await getAnalytics(workspaceId, query);

      return c.json(data);
    },
  )
  .get(
    "/:workspaceId/project/:projectId",
    zValidator(
      "param",
      z.object({ workspaceId: z.string(), projectId: z.string() }),
    ),
    zValidator(
      "query",
      z
        .object({
          dateRange: z
            .enum(["this-month", "last-month", "this-quarter", "this-week"])
            .optional(),
        })
        .optional(),
    ),
    async (c) => {
      const { workspaceId, projectId } = c.req.valid("param");
      const query = c.req.valid("query");

      const data = await getProjectAnalytics(workspaceId, projectId, query);

      return c.json(data);
    },
  )
  .get(
    "/:workspaceId/overdue",
    zValidator("param", z.object({ workspaceId: z.string() })),
    async (c) => {
      const { workspaceId } = c.req.valid("param");

      const data = await getOverdueTasks(workspaceId);

      return c.json(data);
    },
  );

export default analytics;
