import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { importSurveyCSV } from "./controllers/import-csv.js";
import {
  getCategories,
  upsertCategories,
} from "./controllers/survey-category-config.js";
import {
  createSurvey,
  deleteSurvey,
  getSurveyDetail,
  getSurveyStats,
  listSurveys,
  updateSurvey,
} from "./controllers/survey.js";

const survey = new Hono<{
  Variables: {
    userId: string;
  };
}>()

  .get("/categories/:workspaceId", async (c) => {
    const workspaceId = c.req.param("workspaceId");
    const categories = await getCategories(workspaceId);
    return c.json(categories);
  })

  .post(
    "/categories",
    zValidator(
      "json",
      z.object({
        workspaceId: z.string(),
        categories: z.array(
          z.object({
            id: z.string().optional(),
            name: z.string(),
            displayOrder: z.number(),
          }),
        ),
      }),
    ),
    async (c) => {
      const { workspaceId, categories } = c.req.valid("json");
      const result = await upsertCategories(workspaceId, categories);
      return c.json(result);
    },
  )

  .get("/:workspaceId", async (c) => {
    const workspaceId = c.req.param("workspaceId");
    const yearParam = c.req.query("year");
    const monthParam = c.req.query("month");
    const year = yearParam ? Number.parseInt(yearParam) : undefined;
    const month = monthParam ? Number.parseInt(monthParam) : undefined;
    const surveys = await listSurveys(workspaceId, year, month);
    return c.json(surveys);
  })

    .post(
    "/",
    zValidator(
      "json",
      z.object({
        workspaceId: z.string(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        totalApplied: z.number().default(0),
        totalAnswered: z.number().default(0),
        overallVeryGood: z.number().default(0),
        overallGood: z.number().default(0),
        overallNoAnswer: z.number().default(0),
        ratings: z.array(
          z.object({
            categoryConfigId: z.string(),
            excellent: z.number().default(0),
            good: z.number().default(0),
            average: z.number().default(0),
            bad: z.number().default(0),
            empty: z.number().default(0),
            applied: z.number().default(0),
            answered: z.number().default(0),
          }),
        ),
        suggestions: z.array(z.string()).default([]),
      }),
    ),
    async (c) => {
      const userId = c.get("userId");
      const body = c.req.valid("json");
      const dt = new Date(body.date + "T12:00:00");
      const month = dt.getMonth() + 1;
      const year = dt.getFullYear();
      const survey = await createSurvey(userId, { ...body, month, year });
      return c.json(survey);
    },
  )

  .get("/detail/:id", async (c) => {
    const id = c.req.param("id");
    const survey = await getSurveyDetail(id);
    return c.json(survey);
  })

  .put(
    "/:id",
    zValidator(
      "json",
      z.object({
        totalApplied: z.number().optional(),
        totalAnswered: z.number().optional(),
        overallVeryGood: z.number().optional(),
        overallGood: z.number().optional(),
        overallNoAnswer: z.number().optional(),
        ratings: z
          .array(
            z.object({
              categoryConfigId: z.string(),
              excellent: z.number().default(0),
              good: z.number().default(0),
              average: z.number().default(0),
              bad: z.number().default(0),
              empty: z.number().default(0),
              applied: z.number().default(0),
              answered: z.number().default(0),
            }),
          )
          .optional(),
        suggestions: z.array(z.string()).optional(),
      }),
    ),
    async (c) => {
      const userId = c.get("userId");
      const id = c.req.param("id");
      const body = c.req.valid("json");
      const survey = await updateSurvey(userId, id, body);
      return c.json(survey);
    },
  )

  .delete("/:id", async (c) => {
    const userId = c.get("userId");
    const id = c.req.param("id");
    const result = await deleteSurvey(userId, id);
    return c.json(result);
  })

    .post(
    "/import-csv",
    zValidator(
      "json",
      z.object({
        workspaceId: z.string(),
        csvContent: z.string(),
      }),
    ),
    async (c) => {
      const userId = c.get("userId");
      const { workspaceId, csvContent } = c.req.valid("json");
      const result = await importSurveyCSV(userId, workspaceId, csvContent);
      return c.json(result);
    },
  )

  .get("/:workspaceId/stats", async (c) => {
    const workspaceId = c.req.param("workspaceId");
    const stats = await getSurveyStats(workspaceId);
    return c.json(stats);
  });

export default survey;
