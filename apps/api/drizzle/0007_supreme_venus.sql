ALTER TABLE "reservation" RENAME COLUMN "start_time" TO "start_date";--> statement-breakpoint
ALTER TABLE "reservation" RENAME COLUMN "end_time" TO "end_date";--> statement-breakpoint
ALTER TABLE "reservation" DROP COLUMN "date";