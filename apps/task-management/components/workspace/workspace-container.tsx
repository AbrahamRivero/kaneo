"use client";

import { ProjectsTable } from "./project-data-table";
import { ProjectsTableSkeleton } from "./project-data-table-skeleton";
import useGetProjects from "@/hooks/queries/project/use-get-projects";

interface Props {
  workspaceId: string;
}

const WorkspaceContainer = ({ workspaceId }: Props) => {
  const { data: projects, isLoading } = useGetProjects({
    workspaceId,
  });

  return (
    <main className="w-full h-full overflow-x-auto">
      <div className="gap-3 px-3 pt-4 pb-2 min-w-max overflow-hidden">
        {isLoading ? (
          <ProjectsTableSkeleton />
        ) : (
          <ProjectsTable showFilters projects={projects} />
        )}
      </div>
    </main>
  );
};

export default WorkspaceContainer;
