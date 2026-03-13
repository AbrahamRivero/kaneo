import { and, eq, notLike } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import {
  githubIntegrationTable,
  projectTable,
  taskTable,
} from "../../database/schema";
import { requireAtLeastMember } from "../../utils/permissions";
import createGithubApp from "../utils/create-github-app";

const githubApp = createGithubApp();

export async function importIssues(userId: string, projectId: string) {
  const project = await db.query.projectTable.findFirst({
    where: eq(projectTable.id, projectId),
  });

  if (!project) {
    throw new HTTPException(404, { message: "Project not found" });
  }

  await requireAtLeastMember(userId, project.workspaceId);

  const githubIntegration = await db.query.githubIntegrationTable.findFirst({
    where: eq(githubIntegrationTable.projectId, projectId),
  });

  if (!githubIntegration) {
    return { error: "GitHub integration not found" };
  }

  const installationOctokit = await githubApp?.getInstallationOctokit(
    githubIntegration.installationId ?? 0,
  );

  if (!installationOctokit) {
    return { error: "GitHub app not found" };
  }

  const { data: issues } = await installationOctokit.rest.issues.listForRepo({
    owner: githubIntegration.repositoryOwner,
    repo: githubIntegration.repositoryName,
  });

  for (const issue of issues ?? []) {
    const task = await db.query.taskTable.findFirst({
      where: and(
        eq(taskTable.number, issue.number),
        eq(taskTable.projectId, projectId),
        notLike(taskTable.title, "[Kaneo]%"),
      ),
    });

    if (task) {
      continue;
    }

    const githubIssueUrl = `https://github.com/${githubIntegration.repositoryOwner}/${githubIntegration.repositoryName}/issues/${issue.number}`;
    let description = issue.body || "";
    if (description) {
      description += `\n\nLinked to GitHub issue: ${githubIssueUrl}`;
    } else {
      description = `Linked to GitHub issue: ${githubIssueUrl}`;
    }

    await db.insert(taskTable).values({
      title: issue.title,
      description,
      projectId,
      number: issue.number,
      status: "to-do",
      priority: "low",
      position: 0,
      createdAt: new Date(issue.created_at),
    });
  }

  return { success: true, message: "Issues imported" };
}
