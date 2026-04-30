import { eq } from "drizzle-orm";
import db from "../../database/index.js";
import { userTable } from "../../database/schema.js";

export async function getUserName(userId: string): Promise<string> {
  const [user] = await db
    .select({ name: userTable.name })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1);

  return user?.name || "Unknown User";
}
