import { createId } from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { projectTable, taskTable, timeEntryTable } from "../../database/schema";
import { publishEvent } from "../../events";
import { requireAtLeastMember } from "../../utils/permissions";

async function createTimeEntry({
  userId,
  taskId,
  description,
  startTime,
  endTime,
  duration,
}: {
  taskId: string;
  userId: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
}) {
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

  await requireAtLeastMember(
    userId,
    project.workspaceId,
    "create_time_entries",
  );

  const [createdTimeEntry] = await db
    .insert(timeEntryTable)
    .values({
      id: createId(),
      taskId,
      userId,
      description: description || "",
      startTime,
      endTime: endTime || null,
      duration: duration || 0,
    })
    .returning();

  if (!createdTimeEntry) {
    throw new HTTPException(500, {
      message: "Failed to create time entry",
    });
  }

  await publishEvent("time-entry.created", {
    timeEntryId: createdTimeEntry.id,
    taskId: createdTimeEntry.taskId,
    userId,
    type: "create",
    content: "started time tracking",
  });

  return createdTimeEntry;
}

export default createTimeEntry;
