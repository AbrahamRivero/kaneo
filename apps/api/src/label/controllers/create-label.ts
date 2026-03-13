import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { labelTable, projectTable, taskTable } from "../../database/schema";
import { requireAtLeastMember } from "../../utils/permissions";

async function createLabel(
  userId: string,
  name: string,
  color: string,
  taskId: string,
) {
  const task = await db.query.taskTable.findFirst({
    where: eq(taskTable.id, taskId),
  });

  if (!task) {
    throw new HTTPException(404, { message: "Task not found" });
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

  const [label] = await db
    .insert(labelTable)
    .values({ name, color, taskId })
    .returning();

  return label;
}

export default createLabel;
