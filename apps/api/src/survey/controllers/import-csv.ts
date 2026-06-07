import { createId } from "@paralleldrive/cuid2";
import { and, eq } from "drizzle-orm";
import db from "../../database/index.js";
import {
  surveyCategoryConfigTable,
  surveyRatingTable,
  surveySuggestionTable,
  surveyTable,
} from "../../database/schema.js";

interface ParsedCSVData {
  day: number;
  month: number;
  year: number;
  date: string;
  categories: {
    name: string;
    excellent: number;
    good: number;
    average: number;
    bad: number;
    empty: number;
    applied: number;
    answered: number;
    score: number;
  }[];
  overall: {
    veryGood: number;
    good: number;
    noAnswer: number;
  };
  suggestions: string[];
}

export async function parseSurveyCSV(content: string): Promise<ParsedCSVData> {
  const lines = content.split("\n").map((l) => l.trim());
  const rows = lines.map((l) => {
    const cells: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const ch of l) {
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        cells.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    cells.push(current.trim());
    return cells;
  });

  let day = new Date().getDate();
  let month = new Date().getMonth() + 1;
  let year = new Date().getFullYear();

  const categories: ParsedCSVData["categories"] = [];
  let overallVeryGood = 0;
  let overallGood = 0;
  let overallNoAnswer = 0;
  const suggestions: string[] = [];
  let inSuggestions = false;

  for (const row of rows) {
    if (row.length === 0 || (row.length === 1 && row[0] === "")) continue;

    const joined = row.join(" ").toLowerCase();

    if (inSuggestions) {
      const text = row[1]?.trim() || row[0]?.trim();
      if (text) suggestions.push(text);
      continue;
    }

    if (joined.includes("sugerencia")) {
      inSuggestions = true;
      continue;
    }

    for (let c = 0; c < row.length; c++) {
      const cell = (row[c] || "").toLowerCase();
      if (cell.includes("fecha")) {
        for (let d = c; d < Math.min(c + 3, row.length); d++) {
          const val = row[d];
          if (!val) continue;
          const dateMatch = val.match(
            /(\d+)\s+de\s+(\w+)\s+de\s+(\d+)/i,
          );
          if (dateMatch) {
            const monthNames: Record<string, number> = {
              enero: 1,
              febrero: 2,
              marzo: 3,
              abril: 4,
              mayo: 5,
              junio: 6,
              julio: 7,
              agosto: 8,
              septiembre: 9,
              octubre: 10,
              noviembre: 11,
              diciembre: 12,
            };
            const dayVal = dateMatch[1];
            const monthName = dateMatch[2]?.toLowerCase();
            const yearVal = dateMatch[3];
            if (dayVal) day = Number.parseInt(dayVal);
            if (monthName && monthNames[monthName]) {
              month = monthNames[monthName];
            }
            if (yearVal) year = Number.parseInt(yearVal);
          }
        }
        break;
      }
    }

    const name = (row[1] || "").trim();
    if (
      name &&
      row.length >= 10 &&
      row[2] !== undefined &&
      row[3] !== undefined &&
      row[4] !== undefined &&
      row[5] !== undefined
    ) {
      const e = Number.parseInt(row[2]) || 0;
      const b = Number.parseInt(row[3]) || 0;
      const r = Number.parseInt(row[4]) || 0;
      const m = Number.parseInt(row[5]) || 0;
      const v = Number.parseInt(row[6] || "0") || 0;
      const ap = Number.parseInt(row[7] || "0") || 0;
      const co = Number.parseInt(row[8] || "0") || 0;
      const tab = Number.parseFloat((row[9] || "").replace(",", ".")) || 0;

      categories.push({
        name,
        excellent: e,
        good: b,
        average: r,
        bad: m,
        empty: v,
        applied: ap,
        answered: co,
        score: Math.round(tab * 10),
      });
    }

    for (let c = 0; c < row.length; c++) {
      const cell = (row[c] || "").toLowerCase().trim();
      const nextVal = c + 1 < row.length ? row[c + 1] : undefined;
      if (cell === "muy bueno") {
        overallVeryGood = Number.parseInt(nextVal ?? "0") || 0;
      } else if (cell === "bueno") {
        const val = Number.parseInt(nextVal ?? "0") || 0;
        if (val > 0) overallGood = val;
      } else if (cell === "no respondió" || cell === "no respondio") {
        overallNoAnswer = Number.parseInt(nextVal ?? "0") || 0;
      }
    }
  }

  const date =
    `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  return {
    day,
    month,
    year,
    date,
    categories,
    overall: {
      veryGood: overallVeryGood,
      good: overallGood,
      noAnswer: overallNoAnswer,
    },
    suggestions,
  };
}

export async function importSurveyCSV(
  userId: string,
  workspaceId: string,
  csvContent: string,
) {
  const parsed = await parseSurveyCSV(csvContent);

  const existing = await db
    .select({ id: surveyTable.id })
    .from(surveyTable)
    .where(
      and(
        eq(surveyTable.workspaceId, workspaceId),
        eq(surveyTable.date, parsed.date),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    throw new Error(
      `A survey for ${parsed.date} already exists`,
    );
  }

  const totalApplied = parsed.categories.reduce(
    (sum, c) => Math.max(sum, c.applied),
    0,
  );
  const totalAnswered = parsed.categories.reduce(
    (sum, c) => Math.max(sum, c.answered),
    0,
  );

  const surveyId = createId();
  await db.insert(surveyTable).values({
    id: surveyId,
    workspaceId,
    date: parsed.date,
    month: parsed.month,
    year: parsed.year,
    totalApplied,
    totalAnswered,
    overallVeryGood: parsed.overall.veryGood,
    overallGood: parsed.overall.good,
    overallNoAnswer: parsed.overall.noAnswer,
    createdBy: userId,
  });

  for (const cat of parsed.categories) {
    const [config] = await db
      .select({ id: surveyCategoryConfigTable.id })
      .from(surveyCategoryConfigTable)
      .where(
        and(
          eq(surveyCategoryConfigTable.workspaceId, workspaceId),
          eq(surveyCategoryConfigTable.name, cat.name),
        ),
      )
      .limit(1);

    let configId: string;
    if (config) {
      configId = config.id;
    } else {
      const maxOrder = await db
        .select({ max: surveyCategoryConfigTable.displayOrder })
        .from(surveyCategoryConfigTable)
        .where(eq(surveyCategoryConfigTable.workspaceId, workspaceId))
        .then((r) => r[0]?.max ?? 0);

      configId = createId();
      await db.insert(surveyCategoryConfigTable).values({
        id: configId,
        workspaceId,
        name: cat.name,
        displayOrder: maxOrder + 1,
        isActive: true,
      });
    }

    await db.insert(surveyRatingTable).values({
      id: createId(),
      surveyId,
      categoryConfigId: configId,
      excellent: cat.excellent,
      good: cat.good,
      average: cat.average,
      bad: cat.bad,
      empty: cat.empty,
      applied: cat.applied,
      answered: cat.answered,
      score: cat.score,
    });
  }

  for (const content of parsed.suggestions) {
    if (content.trim()) {
      await db.insert(surveySuggestionTable).values({
        id: createId(),
        surveyId,
        content: content.trim(),
      });
    }
  }

  return { id: surveyId, date: parsed.date, month: parsed.month, year: parsed.year };
}
