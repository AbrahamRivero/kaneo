import deleteProject from "@/lib/fetchers/project/delete-project";
import { useMutation } from "@tanstack/react-query";

function useDeleteProject() {
  return useMutation({
    mutationFn: deleteProject,
  });
}

export default useDeleteProject;
