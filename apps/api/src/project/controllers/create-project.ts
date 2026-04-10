import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { projectTable } from "../../database/schema";
import { requireAtLeastMember } from "../../utils/permissions";

async function createProject(
  userId: string,
  workspaceId: string,
  name: string,
  icon: string,
  slug: string,
) {
  await requireAtLeastMember(userId, workspaceId, "create_projects");

  const [createdProject] = await db
    .insert(projectTable)
    .values({
      workspaceId,
      name,
      icon,
      slug,
    })
    .returning();

  if (!createdProject) {
    throw new HTTPException(500, { message: "Failed to create project" });
  }

  return createdProject;
}

export default createProject;
