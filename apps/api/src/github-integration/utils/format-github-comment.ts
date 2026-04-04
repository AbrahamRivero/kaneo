export function formatGitHubComment({
  id,
  priority,
  status,
  title,
}: {
  id: string;
  priority: string;
  status: string;
  title: string;
}) {
  return `🎯 **Task created** - ${title}
<details>
<summary>Task Details</summary>

- **Task ID:** ${id}
- **Priority:** ${priority}
- **Status:** ${status}


*This issue is automatically synchronized with your PalcoDesk project.*
</details>`;
}
