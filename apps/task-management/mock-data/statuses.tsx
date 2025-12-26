import { DEFAULT_COLUMNS } from "@/lib/constants/columns";
import type { LucideIcon } from "lucide-react";

export interface Status {
  id: string;
  name: string;
  color: string;
  icon: LucideIcon;
}

export const StatusIcon: React.FC<{ statusId: string }> = ({ statusId }) => {
  const currentStatus = DEFAULT_COLUMNS.find((s) => s.id === statusId);
  if (!currentStatus) return null;

  const IconComponent = currentStatus.icon;
  return <IconComponent />;
};
