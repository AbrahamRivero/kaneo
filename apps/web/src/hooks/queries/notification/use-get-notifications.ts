import getNotifications from "@/fetchers/notification/get-notifications";
import { useQuery } from "@tanstack/react-query";

function useGetNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    refetchInterval: 30000,
  });
}

export default useGetNotifications;
