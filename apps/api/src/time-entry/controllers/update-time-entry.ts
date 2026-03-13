import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { projectTable, taskTable, timeEntryTable } from "../../database/schema";
import { requireAtLeastMember } from "../../utils/permissions";

async function updateTimeEntry(
  userId: string,
  timeEntryId: string,
  endTime: Date,
  duration: number,
) {
  const [existingTimeEntry] = await db
    .select()
    .from(timeEntryTable)
    .where(eq(timeEntryTable.id, timeEntryId));

  if (!existingTimeEntry) {
    throw new HTTPException(404, {
      message: "Time entry not found",
    });
  }

  const task = await db.query.taskTable.findFirst({
    where: eq(taskTable.id, existingTimeEntry.taskId),
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

  const [updatedTimeEntry] = await db
    .update(timeEntryTable)
    .set({
      endTime,
      duration,
    })
    .where(eq(timeEntryTable.id, timeEntryId))
    .returning();

  return updatedTimeEntry;
}

export default updateTimeEntry;
