import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { labelTable, projectTable, taskTable } from "../../database/schema";
import { requireAtLeastMember } from "../../utils/permissions";

async function updateLabel(
  userId: string,
  id: string,
  name: string,
  color: string,
) {
  const label = await db.query.labelTable.findFirst({
    where: (label, { eq }) => eq(label.id, id),
  });

  if (!label) {
    throw new HTTPException(404, {
      message: "Label not found",
    });
  }

  const task = await db.query.taskTable.findFirst({
    where: eq(taskTable.id, label.taskId),
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

  const [updatedLabel] = await db
    .update(labelTable)
    .set({ name, color })
    .where(eq(labelTable.id, id))
    .returning();

  return updatedLabel;
}

export default updateLabel;
