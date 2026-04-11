import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { projectTable } from "../../database/schema";
import { requireAtLeastMember } from "../../utils/permissions";

async function deleteProject(userId: string, id: string) {
  const [existingProject] = await db
    .select()
    .from(projectTable)
    .where(eq(projectTable.id, id));

  if (!existingProject) {
    throw new HTTPException(404, {
      message: "Project doesn't exist",
    });
  }

  await requireAtLeastMember(
    userId,
    existingProject.workspaceId,
    "delete_projects",
  );

  const [deletedProject] = await db
    .delete(projectTable)
    .where(eq(projectTable.id, id))
    .returning();

  return deletedProject;
}

export default deleteProject;
