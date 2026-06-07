import { getCategories } from "@/fetchers/survey";
import { useQuery } from "@tanstack/react-query";

export function useGetCategories(workspaceId: string) {
  return useQuery({
    queryFn: () => getCategories(workspaceId),
    queryKey: ["survey-categories", workspaceId],
    enabled: !!workspaceId,
  });
}
