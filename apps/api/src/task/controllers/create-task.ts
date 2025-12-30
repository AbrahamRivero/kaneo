import type { Priority, Status } from "./update-task";
import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { taskTable, userTable } from "../../database/schema";
import { publishEvent } from "../../events";
import db from "../../database";
import getNextTaskNumber from "./get-next-task-number";

async function createTask({
  projectId,
  userId,
  title,
  status,
  dueDate,
  description,
  priority,
}: {
  projectId: string;
  userId?: string;
  title: string;
  status: string;
  dueDate?: Date;
  description?: string;
  priority?: string;
}) {
  const nextTaskNumber = await getNextTaskNumber(projectId);

  const [createdTask] = await db
    .insert(taskTable)
    .values({
      projectId,
      title,
      status: status as Status,
      number: nextTaskNumber + 1,
      description: description ?? "",
      priority: (priority as Priority) ?? "low", // Casting para evitar conflicto con Enums
      userId: userId ?? null,
      dueDate: dueDate ?? null, // No asumas "new Date()" si no existe
    })
    .returning();

  if (!createdTask) {
    throw new HTTPException(500, { message: "Failed to create task" });
  }

  // Solo buscamos el nombre si realmente hay un usuario asignado
  let assigneeName: string | null = null;
  if (createdTask.userId) {
    const user = await db.query.userTable.findFirst({
      where: eq(userTable.id, createdTask.userId),
      columns: { name: true },
    });
    assigneeName = user?.name ?? null;
  }

  await publishEvent("task.created", {
    taskId: createdTask.id,
    userId: createdTask.userId ?? "",
    type: "task",
    content: "created the task",
  });

  return {
    ...createdTask,
    assigneeName,
  };
}

export default createTask;
