import { createId } from "@paralleldrive/cuid2";
import { and, eq, inArray } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database/index.js";
import { surveyCategoryConfigTable } from "../../database/schema.js";

export async function getCategories(workspaceId: string) {
  return db
    .select()
    .from(surveyCategoryConfigTable)
    .where(
      and(
        eq(surveyCategoryConfigTable.workspaceId, workspaceId),
        eq(surveyCategoryConfigTable.isActive, true),
      ),
    )
    .orderBy(surveyCategoryConfigTable.displayOrder);
}

export async function upsertCategories(
  workspaceId: string,
  categories: { id?: string; name: string; displayOrder: number }[],
) {
  const existing = await db
    .select({ id: surveyCategoryConfigTable.id })
    .from(surveyCategoryConfigTable)
    .where(eq(surveyCategoryConfigTable.workspaceId, workspaceId));

  const existingIds = existing.map((c) => c.id);
  const incomingIds = categories.filter((c) => c.id).map((c) => c.id as string);

  const toDelete = existingIds.filter((id) => !incomingIds.includes(id));

  if (toDelete.length > 0) {
    await db
      .delete(surveyCategoryConfigTable)
      .where(
        and(
          eq(surveyCategoryConfigTable.workspaceId, workspaceId),
          inArray(surveyCategoryConfigTable.id, toDelete),
        ),
      );
  }

  for (const cat of categories) {
    if (cat.id) {
      await db
        .update(surveyCategoryConfigTable)
        .set({ name: cat.name, displayOrder: cat.displayOrder })
        .where(
          and(
            eq(surveyCategoryConfigTable.id, cat.id),
            eq(surveyCategoryConfigTable.workspaceId, workspaceId),
          ),
        );
    } else {
      await db.insert(surveyCategoryConfigTable).values({
        id: createId(),
        workspaceId,
        name: cat.name,
        displayOrder: cat.displayOrder,
        isActive: true,
      });
    }
  }

  return getCategories(workspaceId);
}
