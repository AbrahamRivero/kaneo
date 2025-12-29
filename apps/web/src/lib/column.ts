import {
  Circle,
  CircleCheck,
  CircleDashed,
  CirclePause,
  Clock2,
  Radar,
} from "lucide-react";

export const getColumnIcon = (columnId: string) => {
  switch (columnId) {
    case "backlog":
      return CircleDashed;
    case "to-do":
      return Circle;
    case "in-progress":
      return Clock2;
    case "technical-review":
      return Radar;
    case "archived":
      return CirclePause;
    case "completed":
      return CircleCheck;
    default:
      return Circle;
  }
};

export const getColumnIconColor = (columnId: string) => {
  switch (columnId) {
    case "backlog":
      return "text-abbey-600 dark:text-abbey-400";
    case "to-do":
      return "text-zinc-400 dark:text-zinc-500";
    case "in-progress":
      return "text-yellow-500 dark:text-yellow-400";
    case "technical-review":
      return "text-emerald-500 dark:text-emerald-400";
    case "archived":
      return "text-picton-blue-500 dark:text-picton-blue-600";
    case "completed":
      return "text-medium-purple-500 dark:text-medium-purple-400";
    default:
      return "text-zinc-400 dark:text-zinc-500";
  }
};
