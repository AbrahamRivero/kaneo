import { DEFAULT_COLUMNS } from "@/constants/columns";

export const StatusIcon: React.FC<{ statusId: string }> = ({ statusId }) => {
  const currentStatus = DEFAULT_COLUMNS.find((s) => s.id === statusId);
  if (!currentStatus) return null;

  const IconComponent = currentStatus.icon;
  return <IconComponent />;
};
