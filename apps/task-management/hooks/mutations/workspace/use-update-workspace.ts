import updateWorkspace from "@/lib/fetchers/workspace/update-workspace";
import { useMutation } from "@tanstack/react-query";

function useUpdateWorkspace() {
  return useMutation({
    mutationFn: updateWorkspace,
  });
}

export default useUpdateWorkspace;
