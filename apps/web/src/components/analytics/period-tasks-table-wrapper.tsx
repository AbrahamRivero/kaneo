import { type PeriodTask, PeriodTasksTable } from "./period-tasks-table";

export function PeriodTasksTableWrapper({ tasks }: { tasks: PeriodTask[] }) {
  return <PeriodTasksTable tasks={tasks} />;
}
