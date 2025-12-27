import { TaskBoard } from "@/components/task/board/task-board";

export default async function Board({
  params,
}: {
  params: Promise<{ workspaceId: string; projectId: string }>;
}) {
  const { workspaceId, projectId } = await params;
  return (
    <main className="w-full h-full overflow-x-auto">
      <TaskBoard projectId={projectId} workspaceId={workspaceId} />
    </main>
  );
}
