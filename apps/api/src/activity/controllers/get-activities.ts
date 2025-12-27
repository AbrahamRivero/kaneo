import { desc, eq } from "drizzle-orm";
import db from "../../database";
import { activityTable, userTable } from "../../database/schema";

async function getActivitiesFromTaskId(taskId: string) {
  const activities = await db
    .select({
      id: activityTable.id,
      taskId: activityTable.taskId,
      type: activityTable.type,
      createdAt: activityTable.createdAt,
      userId: activityTable.userId,
      userName: userTable.name,
      content: activityTable.content,
    })
    .from(activityTable)
    .leftJoin(userTable, eq(activityTable.userId, userTable.id))
    .where(eq(activityTable.taskId, taskId))
    .orderBy(desc(activityTable.createdAt), desc(activityTable.id));

  return activities;
}

export default getActivitiesFromTaskId;
