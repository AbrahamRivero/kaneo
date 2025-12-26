import importTasks, { type TaskToImport } from "@/lib/fetchers/task/import-tasks";
import { useMutation } from "@tanstack/react-query";

const useImportTasks = () => {
  return useMutation({
    mutationFn: ({
      projectId,
      tasks,
    }: {
      projectId: string;
      tasks: TaskToImport[];
    }) => importTasks(projectId, tasks),
  });
};

export default useImportTasks;
