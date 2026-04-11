export type ScheduledAction =
  | "create_reservations"
  | "edit_reservations"
  | "delete_reservations"
  | "create_services"
  | "edit_services"
  | "delete_services"
  | "create_tariffs"
  | "edit_tariffs"
  | "delete_tariffs"
  | "create_rooms"
  | "edit_rooms"
  | "delete_rooms"
  | "create_tasks"
  | "edit_tasks"
  | "delete_tasks"
  | "create_projects"
  | "edit_projects"
  | "delete_projects"
  | "create_time_entries"
  | "edit_time_entries"
  | "delete_time_entries"
  | "create_labels"
  | "edit_labels"
  | "delete_labels"
  | "import_issues"
  | "edit_github_integration"
  | "manage_notifications"
  | "edit_comments";

export type ScheduledPermission = {
  id: string;
  workspaceId: string;
  userId: string;
  action: ScheduledAction;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateScheduledPermissionRequest = {
  workspaceId: string;
  userId: string;
  action: ScheduledAction;
  startTime: string;
  endTime: string;
};

export type UpdateScheduledPermissionRequest = {
  action?: ScheduledAction;
  startTime?: string;
  endTime?: string;
};

export const SCHEDULED_ACTIONS: { value: ScheduledAction; label: string }[] = [
  { value: "create_reservations", label: "Create reservations" },
  { value: "edit_reservations", label: "Edit reservations" },
  { value: "delete_reservations", label: "Delete reservations" },
  { value: "create_services", label: "Create services" },
  { value: "edit_services", label: "Edit services" },
  { value: "delete_services", label: "Delete services" },
  { value: "create_tariffs", label: "Create tariffs" },
  { value: "edit_tariffs", label: "Edit tariffs" },
  { value: "delete_tariffs", label: "Delete tariffs" },
  { value: "create_rooms", label: "Create rooms" },
  { value: "edit_rooms", label: "Edit rooms" },
  { value: "delete_rooms", label: "Delete rooms" },
  { value: "create_tasks", label: "Create tasks" },
  { value: "edit_tasks", label: "Edit tasks" },
  { value: "delete_tasks", label: "Delete tasks" },
  { value: "create_projects", label: "Create projects" },
  { value: "edit_projects", label: "Edit projects" },
  { value: "delete_projects", label: "Delete projects" },
  { value: "create_time_entries", label: "Create time entries" },
  { value: "edit_time_entries", label: "Edit time entries" },
  { value: "delete_time_entries", label: "Delete time entries" },
  { value: "create_labels", label: "Create labels" },
  { value: "edit_labels", label: "Edit labels" },
  { value: "delete_labels", label: "Delete labels" },
  { value: "import_issues", label: "Import GitHub issues" },
  { value: "edit_github_integration", label: "Edit GitHub integration" },
  { value: "manage_notifications", label: "Manage notifications" },
  { value: "edit_comments", label: "Edit comments" },
];

export function formatActionLabel(action: ScheduledAction): string {
  const found = SCHEDULED_ACTIONS.find((a) => a.value === action);
  return found?.label ?? action;
}

export default ScheduledPermission;
