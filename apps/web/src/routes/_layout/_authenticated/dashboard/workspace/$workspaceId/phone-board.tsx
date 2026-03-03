import WorkspaceLayout from "@/components/common/workspace-layout";
import { PhoneBoardTable } from "@/components/phone-board";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import useUpdateWorkspace from "@/hooks/mutations/workspace/use-update-workspace";
import useGetWorkspace from "@/hooks/queries/workspace/use-get-workspace";
import queryClient from "@/query-client";
import useWorkspaceStore from "@/store/workspace";
import {
  type PhoneBoardCell,
  type PhoneBoardCellMap,
  cellKey,
} from "@/types/phone-board";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/workspace/$workspaceId/phone-board",
)({
  component: PhoneBoardRoute,
});

function PhoneBoardRoute() {
  const { workspaceId } = Route.useParams();
  const navigate = useNavigate();
  const { data: workspace, isLoading } = useGetWorkspace({ id: workspaceId });
  const { setWorkspace } = useWorkspaceStore();
  const { mutateAsync: updateWorkspace, isPending: isSaving } =
    useUpdateWorkspace();

  const phoneBoardEnabled = Boolean(
    (workspace as { phoneBoardEnabled?: boolean } | undefined)
      ?.phoneBoardEnabled,
  );
  const initialData =
    (workspace as { phoneBoardData?: PhoneBoardCellMap | null } | undefined)
      ?.phoneBoardData ?? null;

  const [cells, setCells] = useState<PhoneBoardCellMap>(
    () => initialData ?? {},
  );
  const [searchTarget, setSearchTarget] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const syncedWorkspaceId = useRef<string | null>(null);

  useEffect(() => {
    if (!workspace?.id) return;
    if (syncedWorkspaceId.current === workspace.id) return;
    syncedWorkspaceId.current = workspace.id;
    setCells(initialData ?? {});
  }, [workspace?.id, initialData]);

  const handleCellChange = useCallback(
    (row: number, col: number, value: PhoneBoardCell) => {
      const key = cellKey(row, col);
      setCells((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleSearch = useCallback(
    (extension: string) => {
      for (let r = 1; r <= 50; r++) {
        for (let c = 1; c <= 10; c++) {
          const k = cellKey(r, c);
          const cell = cells[k];
          if (cell?.extension === extension && !cell.blocked) {
            setSearchTarget({ row: r, col: c });
            return;
          }
        }
      }
      setSearchTarget(null);
      toast.info("Extension not found in the table");
    },
    [cells],
  );

  const handleSave = useCallback(async () => {
    if (!workspace?.id) return;
    const w = workspace as { name: string; description?: string | null };
    try {
      const updated = await updateWorkspace({
        id: workspace.id,
        name: w.name,
        description: w.description ?? "",
        phoneBoardData: cells,
      });
      setWorkspace(updated);
      const next =
        (updated as { phoneBoardData?: PhoneBoardCellMap }).phoneBoardData ??
        cells;
      setCells(next);
      toast.success("Phone board saved");
      await queryClient.invalidateQueries({
        queryKey: [`workspace-${workspaceId}`],
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save");
    }
  }, [workspace, cells, updateWorkspace, setWorkspace, workspaceId]);

  if (isLoading) {
    return (
      <WorkspaceLayout title="Phone Board">
        <div className="p-4 space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-[70vh] w-full" />
        </div>
      </WorkspaceLayout>
    );
  }

  if (!workspace) {
    return (
      <WorkspaceLayout title="Phone Board">
        <div className="p-4">Workspace not found.</div>
      </WorkspaceLayout>
    );
  }

  if (!phoneBoardEnabled) {
    return (
      <WorkspaceLayout title="Phone Board">
        <div className="p-4 text-center text-muted-foreground">
          <p>Phone board is not enabled for this workspace.</p>
          <Button
            variant="link"
            className="mt-2"
            onClick={() =>
              navigate({
                to: "/dashboard/workspace/$workspaceId/settings",
                params: { workspaceId },
              })
            }
          >
            Go to workspace settings
          </Button>
        </div>
      </WorkspaceLayout>
    );
  }

  return (
    <WorkspaceLayout
      title="Phone Board"
      headerActions={
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Save
        </Button>
      }
    >
      <div className="p-4">
        <p className="text-sm text-muted-foreground mb-4">
          Click on any cell to configure the phone extension.
        </p>
        <PhoneBoardTable
          cells={cells}
          searchTarget={searchTarget}
          onCellChange={handleCellChange}
          onSearch={handleSearch}
          isSaving={isSaving}
        />
      </div>
    </WorkspaceLayout>
  );
}
