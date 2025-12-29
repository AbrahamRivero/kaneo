import {
  CircleDashed,
  Circle,
  CirclePause,
  Radar,
  Clock2,
  CircleCheck,
} from "lucide-react";

export const DEFAULT_COLUMNS = [
  {
    id: "backlog",
    name: "Backlog",
    color: "text-abbey-600",
    icon: CircleDashed,
  },
  { id: "to-do", name: "To Do", color: "text-abbey-600", icon: Circle },
  {
    id: "in-progress",
    name: "In Progress",
    color: "text-supernova-400",
    icon: Clock2,
  },
  {
    id: "technical-review",
    name: "Technical Review",
    color: "text-emerald-500",
    icon: Radar,
  },
  {
    id: "archived",
    name: "Archived",
    color: "text-picton-blue-500",
    icon: CirclePause,
  },
  {
    id: "completed",
    name: "Completed",
    color: "text-medium-purple-500",
    icon: CircleCheck,
  },
] as const;
