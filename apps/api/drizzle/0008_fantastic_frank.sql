ALTER TABLE "reservation" ADD COLUMN "date_range" text NOT NULL DEFAULT '{}'::text;--> statement-breakpoint
UPDATE "reservation" SET "date_range" = json_build_object('from', "start_date", 'to', "end_date")::text;--> statement-breakpoint
ALTER TABLE "reservation" ALTER COLUMN "date_range" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "reservation" DROP COLUMN "start_date";--> statement-breakpoint
ALTER TABLE "reservation" DROP COLUMN "end_date";
