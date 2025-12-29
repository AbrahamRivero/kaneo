import { z } from "zod";
import db from "../../database";
import { accountTable } from "../../database/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { hashPassword, verifyPassword } from "better-auth/crypto";

const payloadSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export default async function changePassword(userId: string, payload: unknown) {
  const { currentPassword, newPassword } = payloadSchema.parse(payload);

  const [account] = await db
    .select()
    .from(accountTable)
    .where(eq(accountTable.userId, userId))
    .limit(1);

  if (!account || !account.password) {
    throw new Error("No local password account found for this user");
  }

  let isValid = false;
  try {
    if (account.password.includes(":")) {
      isValid = await verifyPassword({
        hash: account.password,
        password: currentPassword,
      });
    } else {
      isValid = await bcrypt.compare(currentPassword, account.password);
    }
  } catch (err) {
    console.error("changePassword: verify error", err);
    throw new Error("Current password is incorrect");
  }

  if (!isValid) {
    throw new Error("Current password is incorrect");
  }

  const hashed = await hashPassword(newPassword);

  await db
    .update(accountTable)
    .set({ password: hashed })
    .where(eq(accountTable.id, account.id));

  return { success: true };
}
