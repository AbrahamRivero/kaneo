import type { Priority, Status } from "./update-task";
import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { projectTable, taskTable } from "../../database/schema";
import { publishEvent } from "../../events";
import getNextTaskNumber from "./get-next-task-number";

type ImportTask = {
  title: string;
  description?: string;
  status: string;
  priority?: string;
  dueDate?: string;
  userId?: string | null;
};

async function importTasks(projectId: string, tasksToImport: ImportTask[]) {
  const project = await db.query.projectTable.findFirst({
    where: eq(projectTable.id, projectId),
  });

  if (!project) {
    throw new HTTPException(404, {
      message: "Project not found",
    });
  }

  const nextTaskNumber = await getNextTaskNumber(projectId);

  return await db.transaction(async (tx) => {
    const tasksToInsert = tasksToImport.map((task, index) => ({
      projectId,
      title: task.title,
      description: task.description || "",
      status: task.status as Status,
      priority: (task.priority as Priority) || "low",
      dueDate: task.dueDate ? new Date(task.dueDate) : null,
      userId: task.userId || null,
      number: nextTaskNumber + index + 1,
    }));

    const createdTasks = await tx
      .insert(taskTable)
      .values(tasksToInsert)
      .returning();

    await Promise.all(
      createdTasks.map((task) =>
        publishEvent("task.created", {
          taskId: task.id,
          userId: task.userId ?? "",
          type: "create",
          content: "imported the task",
        })
      )
    );

    return {
      importedAt: new Date().toISOString(),
      project: {
        id: project.id,
        name: project.name,
        slug: project.slug,
      },
      results: {
        total: tasksToImport.length,
        successful: createdTasks.length,
        failed: 0,
        tasks: createdTasks.map((t) => ({ success: true, task: t })),
      },
    };
  });
}

export default importTasks;
