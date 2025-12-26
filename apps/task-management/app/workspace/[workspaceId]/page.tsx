import WorkspaceContainer from "@/components/workspace/workspace-container";

export default async function Workspace({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const workspaceId = (await params).workspaceId;

  return <WorkspaceContainer workspaceId={workspaceId} />;
}
