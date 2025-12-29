import { z } from "zod";
import { eq } from "drizzle-orm";
import db from "../../database";
import { workspaceTable, accountTable } from "../../database/schema";
import { hashPassword } from "better-auth/crypto";

const payloadSchema = z.object({
  userId: z.string(),
  password: z.string().min(8),
});

export default async function resetMemberPassword(
  workspaceId: string,
  requesterId: string,
  payload: unknown
) {
  const { userId, password } = payloadSchema.parse(payload);

  // Verificar que requester es owner del workspace
  const [workspace] = await db
    .select()
    .from(workspaceTable)
    .where(eq(workspaceTable.id, workspaceId))
    .limit(1);

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  if (workspace.ownerId !== requesterId) {
    throw new Error("Only the workspace owner can reset member passwords");
  }

  // Obtener cuenta del miembro con password
  const [account] = await db
    .select()
    .from(accountTable)
    .where(eq(accountTable.userId, userId))
    .limit(1);

  if (!account) {
    throw new Error("User account not found");
  }

  const hashed = await hashPassword(password);

  await db
    .update(accountTable)
    .set({ password: hashed })
    .where(eq(accountTable.id, account.id));

  const [updatedAccount] = await db
    .select()
    .from(accountTable)
    .where(eq(accountTable.id, account.id))
    .limit(1);

  if (!updatedAccount || !updatedAccount.password) {
    console.error("resetMemberPassword: account not found after update", {
      accountId: account.id,
    });
    throw new Error("Failed to update member password");
  }

  if (updatedAccount.password !== hashed) {
    console.error(
      "resetMemberPassword: stored password does not match hashed value",
      {
        accountId: account.id,
      }
    );
    throw new Error("Failed to verify updated password");
  }

  return { success: true };
}
