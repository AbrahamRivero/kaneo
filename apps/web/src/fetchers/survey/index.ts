const base = import.meta.env.VITE_API_URL || "";

export type SurveyCategory = {
  id: string;
  workspaceId: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
};

export type SurveyRating = {
  id?: string;
  categoryConfigId: string;
  categoryName?: string;
  excellent: number;
  good: number;
  average: number;
  bad: number;
  empty: number;
  applied: number;
  answered: number;
  score: number;
};

export type SurveySuggestion = {
  id: string;
  content: string;
};

export type Survey = {
  id: string;
  workspaceId: string;
  date: string;
  month: number;
  year: number;
  totalApplied: number;
  totalAnswered: number;
  overallVeryGood: number;
  overallGood: number;
  overallNoAnswer: number;
  createdBy: string | null;
  createdAt: string;
  ratings: SurveyRating[];
  suggestions: string[];
};

export type SurveyListItem = {
  id: string;
  workspaceId: string;
  date: string;
  month: number;
  year: number;
  totalApplied: number;
  totalAnswered: number;
  overallVeryGood: number;
  overallGood: number;
  overallNoAnswer: number;
  createdAt: string;
  ratings: {
    categoryId: string;
    categoryName: string;
    score: number;
  }[];
};

export type CreateSurveyPayload = {
  workspaceId: string;
  date: string;
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
};

export type UpdateSurveyPayload = Partial<{
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
}>;

export async function getCategories(
  workspaceId: string,
): Promise<SurveyCategory[]> {
  const response = await fetch(`${base}/survey/categories/${workspaceId}`, {
    credentials: "include",
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

export async function upsertCategories(
  workspaceId: string,
  categories: { id?: string; name: string; displayOrder: number }[],
): Promise<SurveyCategory[]> {
  const response = await fetch(`${base}/survey/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workspaceId, categories }),
    credentials: "include",
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

export async function getSurveys(
  workspaceId: string,
  options?: { year?: number; month?: number },
): Promise<SurveyListItem[]> {
  const params = new URLSearchParams();
  if (options?.year) params.set("year", String(options.year));
  if (options?.month) params.set("month", String(options.month));
  const qs = params.toString();
  const response = await fetch(
    `${base}/survey/${workspaceId}${qs ? `?${qs}` : ""}`,
    { credentials: "include" },
  );
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

export async function getSurveyDetail(id: string): Promise<Survey> {
  const response = await fetch(`${base}/survey/detail/${id}`, {
    credentials: "include",
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

export async function createSurvey(
  payload: CreateSurveyPayload,
): Promise<Survey> {
  const response = await fetch(`${base}/survey`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "include",
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

export async function updateSurvey(
  id: string,
  payload: UpdateSurveyPayload,
): Promise<Survey> {
  const response = await fetch(`${base}/survey/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "include",
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

export async function deleteSurvey(id: string): Promise<{ success: boolean }> {
  const response = await fetch(`${base}/survey/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

export async function importSurveyCSV(
  workspaceId: string,
  csvContent: string,
): Promise<{ id: string; date: string; month: number; year: number }> {
  const response = await fetch(`${base}/survey/import-csv`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workspaceId, csvContent }),
    credentials: "include",
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

export type SurveyStats = {
  categoryStats: {
    id: string;
    name: string;
    trend: { date: string; month: number; year: number; score: number }[];
  }[];
  totalSurveys: number;
};

export async function getSurveyStats(
  workspaceId: string,
): Promise<SurveyStats> {
  const response = await fetch(`${base}/survey/${workspaceId}/stats`, {
    credentials: "include",
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}
