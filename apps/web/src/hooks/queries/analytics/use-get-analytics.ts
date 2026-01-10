import getAnalytics from "@/fetchers/analytics/get-analytics";
import { useQuery } from "@tanstack/react-query";

function useGetAnalytics(workspaceId: string) {
  return useQuery({
    queryKey: ["analytics", workspaceId],
    queryFn: () => getAnalytics(workspaceId),
    refetchInterval: 60000,
    enabled: !!workspaceId,
  });
}

export default useGetAnalytics;
