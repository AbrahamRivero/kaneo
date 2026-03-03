import getAnalytics, {
  type DateRange,
  type QueryParams,
} from "@/fetchers/analytics/get-analytics";
import { useQuery } from "@tanstack/react-query";

function useGetAnalytics(workspaceId: string, query?: QueryParams) {
  return useQuery({
    queryKey: ["analytics", workspaceId, query],
    queryFn: () => getAnalytics(workspaceId, query),
    refetchInterval: 60000,
    enabled: !!workspaceId,
  });
}

export default useGetAnalytics;
export type { DateRange, QueryParams };
