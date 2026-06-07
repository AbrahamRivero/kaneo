import { getSurveyDetail, getSurveyStats, getSurveys } from "@/fetchers/survey";
import { useQuery } from "@tanstack/react-query";

export function useGetSurveys(
  workspaceId: string,
  options?: { year?: number; month?: number },
) {
  return useQuery({
    queryFn: () => getSurveys(workspaceId, options),
    queryKey: ["surveys", workspaceId, options?.year, options?.month],
    enabled: !!workspaceId,
  });
}

export function useGetSurveyDetail(id: string | undefined) {
  return useQuery({
    queryFn: () => getSurveyDetail(id as string),
    queryKey: ["survey", id],
    enabled: !!id,
  });
}

export function useGetSurveyStats(workspaceId: string) {
  return useQuery({
    queryFn: () => getSurveyStats(workspaceId),
    queryKey: ["survey-stats", workspaceId],
    enabled: !!workspaceId,
  });
}
