ALTER TABLE "survey" ADD COLUMN IF NOT EXISTS "date" text NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE "survey" ALTER COLUMN "date" DROP DEFAULT;
