import type { client } from "@kaneo/libs";
import type { InferResponseType } from "hono/client";

type Task = Extract<
  InferResponseType<
    (typeof client)["task"]["tasks"][":projectId"]["$get"]
  >["columns"][number]["tasks"][number],
  { id: string }
>;

export type Status =
  | "backlog"
  | "to-do"
  | "in-progress"
  | "technical-review"
  | "archived"
  | "completed";

export type Priority = "low" | "medium" | "high" | "urgent" | "no-priority";

export default Task;
