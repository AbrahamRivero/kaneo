import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { githubIntegrationTable, projectTable } from "../../database/schema";
import { requireOwner } from "../../utils/permissions";

async function deleteGithubIntegration(userId: string, projectId: string) {
  const existingIntegration = await db.query.githubIntegrationTable.findFirst({
    where: eq(githubIntegrationTable.projectId, projectId),
  });

  if (!existingIntegration) {
    throw new HTTPException(404, { message: "GitHub integration not found" });
  }

  const project = await db.query.projectTable.findFirst({
    where: eq(projectTable.id, projectId),
  });

  if (!project) {
    throw new HTTPException(404, { message: "Project not found" });
  }

  await requireOwner(userId, project.workspaceId);

  await db
    .delete(githubIntegrationTable)
    .where(eq(githubIntegrationTable.projectId, projectId));

  return { success: true, message: "GitHub integration deleted" };
}

export default deleteGithubIntegration;
