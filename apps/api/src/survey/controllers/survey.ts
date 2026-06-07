import { createId } from "@paralleldrive/cuid2";
import { and, desc, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database/index.js";
import {
  surveyCategoryConfigTable,
  surveyRatingTable,
  surveySuggestionTable,
  surveyTable,
  workspaceTable,
  workspaceUserTable,
} from "../../database/schema.js";

async function requireAdminOrOwner(
  userId: string,
  workspaceId: string,
  action: string,
) {
  const [workspace] = await db
    .select({ ownerId: workspaceTable.ownerId })
    .from(workspaceTable)
    .where(eq(workspaceTable.id, workspaceId))
    .limit(1);

  if (!workspace) {
    throw new HTTPException(404, { message: "Workspace not found" });
  }

  if (workspace.ownerId === userId) return;

  const [member] = await db
    .select({ role: workspaceUserTable.role })
    .from(workspaceUserTable)
    .where(
      and(
        eq(workspaceUserTable.workspaceId, workspaceId),
        eq(workspaceUserTable.userId, userId),
      ),
    )
    .limit(1);

  if (!member || member.role === "viewer") {
    throw new HTTPException(403, {
      message: `Only workspace owners and admins can ${action}`,
    });
  }
}

export async function listSurveys(
  workspaceId: string,
  year?: number,
  month?: number,
) {
  const conditions = [eq(surveyTable.workspaceId, workspaceId)];

  if (year) {
    conditions.push(eq(surveyTable.year, year));
  }
  if (month) {
    conditions.push(eq(surveyTable.month, month));
  }

  const surveys = await db
    .select()
    .from(surveyTable)
    .where(and(...conditions))
    .orderBy(desc(surveyTable.year), desc(surveyTable.month));

  const result = [];
  for (const survey of surveys) {
    const ratings = await db
      .select({
        categoryId: surveyRatingTable.categoryConfigId,
        categoryName: surveyCategoryConfigTable.name,
        excellent: surveyRatingTable.excellent,
        good: surveyRatingTable.good,
        average: surveyRatingTable.average,
        bad: surveyRatingTable.bad,
        empty: surveyRatingTable.empty,
        applied: surveyRatingTable.applied,
        answered: surveyRatingTable.answered,
        score: surveyRatingTable.score,
      })
      .from(surveyRatingTable)
      .innerJoin(
        surveyCategoryConfigTable,
        eq(surveyRatingTable.categoryConfigId, surveyCategoryConfigTable.id),
      )
      .where(eq(surveyRatingTable.surveyId, survey.id));

    const suggestions = await db
      .select({ content: surveySuggestionTable.content })
      .from(surveySuggestionTable)
      .where(eq(surveySuggestionTable.surveyId, survey.id));

    result.push({
      ...survey,
      ratings,
      suggestions: suggestions.map((s) => s.content),
    });
  }

  return result;
}

export async function getSurveyDetail(id: string) {
  const [survey] = await db
    .select()
    .from(surveyTable)
    .where(eq(surveyTable.id, id))
    .limit(1);

  if (!survey) {
    throw new HTTPException(404, { message: "Survey not found" });
  }

  const ratings = await db
    .select({
      id: surveyRatingTable.id,
      categoryConfigId: surveyRatingTable.categoryConfigId,
      categoryName: surveyCategoryConfigTable.name,
      excellent: surveyRatingTable.excellent,
      good: surveyRatingTable.good,
      average: surveyRatingTable.average,
      bad: surveyRatingTable.bad,
      empty: surveyRatingTable.empty,
      applied: surveyRatingTable.applied,
      answered: surveyRatingTable.answered,
      score: surveyRatingTable.score,
    })
    .from(surveyRatingTable)
    .innerJoin(
      surveyCategoryConfigTable,
      eq(surveyRatingTable.categoryConfigId, surveyCategoryConfigTable.id),
    )
    .where(eq(surveyRatingTable.surveyId, id));

  const suggestions = await db
    .select({ content: surveySuggestionTable.content })
    .from(surveySuggestionTable)
    .where(eq(surveySuggestionTable.surveyId, id));

  return { ...survey, ratings, suggestions: suggestions.map((s) => s.content) };
}

export async function createSurvey(
  userId: string,
  data: {
    workspaceId: string;
    date: string;
    month: number;
    year: number;
    totalApplied: number;
    totalAnswered: number;
    overallVeryGood: number;
    overallGood: number;
    overallNoAnswer: number;
    ratings: {
      categoryConfigId: string;
      excellent: number;
      good: number;
      average: number;
      bad: number;
      empty: number;
      applied: number;
      answered: number;
    }[];
    suggestions: string[];
  },
) {
  await requireAdminOrOwner(userId, data.workspaceId, "create surveys");

  const existing = await db
    .select({ id: surveyTable.id })
    .from(surveyTable)
    .where(
      and(
        eq(surveyTable.workspaceId, data.workspaceId),
        eq(surveyTable.date, data.date),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    throw new HTTPException(409, {
      message: "A survey for this date already exists",
    });
  }

  const surveyId = createId();

  await db.insert(surveyTable).values({
    id: surveyId,
    workspaceId: data.workspaceId,
    date: data.date,
    month: data.month,
    year: data.year,
    totalApplied: data.totalApplied,
    totalAnswered: data.totalAnswered,
    overallVeryGood: data.overallVeryGood,
    overallGood: data.overallGood,
    overallNoAnswer: data.overallNoAnswer,
    createdBy: userId,
  });

  for (const rating of data.ratings) {
    const totalApplied =
      rating.applied ||
      rating.excellent +
        rating.good +
        rating.average +
        rating.bad +
        rating.empty;
    const totalAnswered =
      rating.answered ||
      rating.excellent + rating.good + rating.average + rating.bad;
    const totalPoints =
      rating.excellent * 5 +
      rating.good * 4 +
      rating.average * 3 +
      rating.bad * 2;
    const score =
      totalAnswered > 0 ? Math.round((totalPoints / totalAnswered) * 10) : 0;

    await db.insert(surveyRatingTable).values({
      id: createId(),
      surveyId,
      categoryConfigId: rating.categoryConfigId,
      excellent: rating.excellent,
      good: rating.good,
      average: rating.average,
      bad: rating.bad,
      empty: rating.empty,
      applied: totalApplied,
      answered: totalAnswered,
      score,
    });
  }

  for (const content of data.suggestions) {
    if (content.trim()) {
      await db.insert(surveySuggestionTable).values({
        id: createId(),
        surveyId,
        content: content.trim(),
      });
    }
  }

  return getSurveyDetail(surveyId);
}

export async function updateSurvey(
  userId: string,
  id: string,
  data: {
    totalApplied?: number;
    totalAnswered?: number;
    overallVeryGood?: number;
    overallGood?: number;
    overallNoAnswer?: number;
    ratings?: {
      categoryConfigId: string;
      excellent: number;
      good: number;
      average: number;
      bad: number;
      empty: number;
      applied: number;
      answered: number;
    }[];
    suggestions?: string[];
  },
) {
  const [existing] = await db
    .select()
    .from(surveyTable)
    .where(eq(surveyTable.id, id))
    .limit(1);

  if (!existing) {
    throw new HTTPException(404, { message: "Survey not found" });
  }

  await requireAdminOrOwner(userId, existing.workspaceId, "update surveys");

  const updateData: Record<string, unknown> = {};
  if (data.totalApplied !== undefined)
    updateData.totalApplied = data.totalApplied;
  if (data.totalAnswered !== undefined)
    updateData.totalAnswered = data.totalAnswered;
  if (data.overallVeryGood !== undefined)
    updateData.overallVeryGood = data.overallVeryGood;
  if (data.overallGood !== undefined)
    updateData.overallGood = data.overallGood;
  if (data.overallNoAnswer !== undefined)
    updateData.overallNoAnswer = data.overallNoAnswer;

  if (Object.keys(updateData).length > 0) {
    updateData.updatedAt = new Date();
    await db.update(surveyTable).set(updateData).where(eq(surveyTable.id, id));
  }

  if (data.ratings) {
    await db
      .delete(surveyRatingTable)
      .where(eq(surveyRatingTable.surveyId, id));

    for (const rating of data.ratings) {
      const totalApplied =
        rating.applied ||
        rating.excellent +
          rating.good +
          rating.average +
          rating.bad +
          rating.empty;
      const totalAnswered =
        rating.answered ||
        rating.excellent + rating.good + rating.average + rating.bad;
      const totalPoints =
        rating.excellent * 5 +
        rating.good * 4 +
        rating.average * 3 +
        rating.bad * 2;
      const score =
        totalAnswered > 0 ? Math.round((totalPoints / totalAnswered) * 10) : 0;

      await db.insert(surveyRatingTable).values({
        id: createId(),
        surveyId: id,
        categoryConfigId: rating.categoryConfigId,
        excellent: rating.excellent,
        good: rating.good,
        average: rating.average,
        bad: rating.bad,
        empty: rating.empty,
        applied: totalApplied,
        answered: totalAnswered,
        score,
      });
    }
  }

  if (data.suggestions) {
    await db
      .delete(surveySuggestionTable)
      .where(eq(surveySuggestionTable.surveyId, id));

    for (const content of data.suggestions) {
      if (content.trim()) {
        await db.insert(surveySuggestionTable).values({
          id: createId(),
          surveyId: id,
          content: content.trim(),
        });
      }
    }
  }

  return getSurveyDetail(id);
}

export async function deleteSurvey(userId: string, id: string) {
  const [existing] = await db
    .select()
    .from(surveyTable)
    .where(eq(surveyTable.id, id))
    .limit(1);

  if (!existing) {
    throw new HTTPException(404, { message: "Survey not found" });
  }

  await requireAdminOrOwner(userId, existing.workspaceId, "delete surveys");

  await db.delete(surveyTable).where(eq(surveyTable.id, id));
  return { success: true };
}

export async function getSurveyStats(workspaceId: string) {
  const categories = await db
    .select()
    .from(surveyCategoryConfigTable)
    .where(
      and(
        eq(surveyCategoryConfigTable.workspaceId, workspaceId),
        eq(surveyCategoryConfigTable.isActive, true),
      ),
    )
    .orderBy(surveyCategoryConfigTable.displayOrder);

  const surveys = await db
    .select()
    .from(surveyTable)
    .where(eq(surveyTable.workspaceId, workspaceId))
    .orderBy(surveyTable.year, surveyTable.month);

  const ratingsByCategory: Record<
    string,
    { date: string; month: number; year: number; score: number }[]
  > = {};

  for (const survey of surveys) {
    const ratings = await db
      .select({
        categoryConfigId: surveyRatingTable.categoryConfigId,
        score: surveyRatingTable.score,
      })
      .from(surveyRatingTable)
      .where(eq(surveyRatingTable.surveyId, survey.id));

    for (const rating of ratings) {
      const categoryId = rating.categoryConfigId;
      if (!categoryId) continue;
      if (!ratingsByCategory[categoryId]) {
        ratingsByCategory[categoryId] = [];
      }
      ratingsByCategory[categoryId].push({
        date: survey.date,
        month: survey.month,
        year: survey.year,
        score: rating.score,
      });
    }
  }

  const categoryStats = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    trend: ratingsByCategory[cat.id] || [],
  }));

  return { categoryStats, totalSurveys: surveys.length, surveys };
}
