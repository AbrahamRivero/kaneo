ALTER TABLE "workspace_member" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "workspace_member" ALTER COLUMN "role" SET DEFAULT 'member'::text;--> statement-breakpoint
UPDATE "workspace_member" SET "role" = 'viewer' WHERE "role" = 'admin';--> statement-breakpoint
DROP TYPE "public"."workspace_member_role";--> statement-breakpoint
CREATE TYPE "public"."workspace_member_role" AS ENUM('viewer', 'owner', 'member');--> statement-breakpoint
ALTER TABLE "workspace_member" ALTER COLUMN "role" SET DEFAULT 'member'::"public"."workspace_member_role";--> statement-breakpoint
ALTER TABLE "workspace_member" ALTER COLUMN "role" SET DATA TYPE "public"."workspace_member_role" USING "role"::"public"."workspace_member_role";--> statement-breakpoint
ALTER TABLE "reservation" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;