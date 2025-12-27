import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { projectTable, taskTable, userTable } from "../../database/schema";

export const DEFAULT_COLUMNS = [
  {
    id: "backlog",
    name: "Reserva",
  },
  { id: "to-do", name: "Por hacer" },
  {
    id: "in-progress",
    name: "En curso",
  },
  {
    id: "technical-review",
    name: "Revisión",
  },
  {
    id: "paused",
    name: "Pausadas",
  },
  {
    id: "completed",
    name: "Completadas",
  },
] as const;

async function getTasks(projectId: string) {
  const project = await db.query.projectTable.findFirst({
    where: eq(projectTable.id, projectId),
  });

  if (!project) {
    throw new HTTPException(404, {
      message: "Project not found",
    });
  }

  const tasks = await db
    .select({
      id: taskTable.id,
      title: taskTable.title,
      number: taskTable.number,
      description: taskTable.description,
      status: taskTable.status,
      priority: taskTable.priority,
      dueDate: taskTable.dueDate,
      position: taskTable.position,
      createdAt: taskTable.createdAt,
      userId: taskTable.userId,
      assigneeName: userTable.name,
      assigneeId: userTable.id,
      projectId: taskTable.projectId,
    })
    .from(taskTable)
    .leftJoin(userTable, eq(taskTable.userId, userTable.id))
    .leftJoin(projectTable, eq(taskTable.projectId, projectTable.id))
    .where(eq(taskTable.projectId, projectId))
    .orderBy(taskTable.position);

  const columns = DEFAULT_COLUMNS.map((column) => ({
    id: column.id,
    name: column.name,
    tasks: tasks
      .filter((task) => task.status === column.id)
      .map((task) => ({
        ...task,
      })),
  }));

  const pausedTasks = tasks.filter((task) => task.status === "paused");
  const plannedTasks = tasks.filter((task) => task.status === "backlog");

  return {
    id: project.id,
    name: project.name,
    slug: project.slug,
    icon: project.icon,
    description: project.description,
    isPublic: project.isPublic,
    workspaceId: project.workspaceId,
    columns,
    pausedTasks,
    plannedTasks,
  };
}

export default getTasks;
