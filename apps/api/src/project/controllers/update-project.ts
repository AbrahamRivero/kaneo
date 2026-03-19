import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { projectTable } from "../../database/schema";
import { requireAtLeastMember } from "../../utils/permissions";

async function updateProject(
  userId: string,
  id: string,
  name: string,
  icon: string,
  slug: string,
  description: string,
  isPublic: boolean,
) {
  const [existingProject] = await db
    .select()
    .from(projectTable)
    .where(eq(projectTable.id, id));

  if (!existingProject) {
    throw new HTTPException(404, {
      message: "Project doesn't exist",
    });
  }

  await requireAtLeastMember(userId, existingProject.workspaceId);

  const [updatedWorkspace] = await db
    .update(projectTable)
    .set({
      name,
      icon,
      slug,
      description,
      isPublic,
    })
    .where(eq(projectTable.id, id))
    .returning();

  return updatedWorkspace;
}

export default updateProject;
