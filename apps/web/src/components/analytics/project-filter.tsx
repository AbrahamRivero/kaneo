import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useGetProjects from "@/hooks/queries/project/use-get-projects";

interface ProjectFilterProps {
  workspaceId: string;
  value: string;
  onChange: (value: string) => void;
}

export function ProjectFilter({
  workspaceId,
  value,
  onChange,
}: ProjectFilterProps) {
  const { data: projects } = useGetProjects({ workspaceId });

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="All Projects" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Projects</SelectItem>
        {projects?.map((project) => (
          <SelectItem key={project.id} value={project.id}>
            {project.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
