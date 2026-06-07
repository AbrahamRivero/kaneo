import {
  createSurvey,
  deleteSurvey,
  importSurveyCSV,
  updateSurvey,
  upsertCategories,
} from "@/fetchers/survey";
import { useQueryClient } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

export function useCreateSurvey() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: createSurvey,
    onSuccess: (data) => {
      toast.success("Survey created successfully");
      queryClient.invalidateQueries({ queryKey: ["surveys"] });
      navigate({
        to: "/dashboard/workspace/$workspaceId/surveys/$surveyId",
        params: { surveyId: data.id, workspaceId: data.workspaceId },
      });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateSurvey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: { id: string; payload: Parameters<typeof updateSurvey>[1] }) =>
      updateSurvey(id, payload),
    onSuccess: () => {
      toast.success("Survey updated successfully");
      queryClient.invalidateQueries({ queryKey: ["surveys"] });
      queryClient.invalidateQueries({ queryKey: ["survey"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteSurvey() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: ({ id }: { id: string; workspaceId: string }) =>
      deleteSurvey(id),
    onSuccess: (_data, variables) => {
      toast.success("Survey deleted");
      queryClient.invalidateQueries({ queryKey: ["surveys"] });
      navigate({
        to: "/dashboard/workspace/$workspaceId/surveys",
        params: { workspaceId: variables.workspaceId },
      });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpsertCategories() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      workspaceId,
      categories,
    }: {
      workspaceId: string;
      categories: { id?: string; name: string; displayOrder: number }[];
    }) => upsertCategories(workspaceId, categories),
    onSuccess: () => {
      toast.success("Categories updated");
      queryClient.invalidateQueries({ queryKey: ["survey-categories"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useImportCSV() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      workspaceId,
      csvContent,
    }: {
      workspaceId: string;
      csvContent: string;
    }) => importSurveyCSV(workspaceId, csvContent),
    onSuccess: () => {
      toast.success("Survey imported from CSV");
      queryClient.invalidateQueries({ queryKey: ["surveys"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
