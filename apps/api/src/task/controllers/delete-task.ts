import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { projectTable, taskTable } from "../../database/schema";
import { requireAtLeastMember } from "../../utils/permissions";

async function deleteTask(taskId: string, userId: string) {
  const task = await db.query.taskTable.findFirst({
    where: eq(taskTable.id, taskId),
  });

  if (!task) {
    throw new HTTPException(404, {
      message: "Task not found",
    });
  }

  const [project] = await db
    .select({ workspaceId: projectTable.workspaceId })
    .from(projectTable)
    .where(eq(projectTable.id, task.projectId))
    .limit(1);

  if (!project) {
    throw new HTTPException(404, { message: "Project not found" });
  }

  await requireAtLeastMember(userId, project.workspaceId);

  const result = await db
    .delete(taskTable)
    .where(eq(taskTable.id, taskId))
    .returning()
    .execute();

  if (!result.length) {
    throw new HTTPException(404, {
      message: "Task not found",
    });
  }

  return result;
}

export default deleteTask;
