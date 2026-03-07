DROP TABLE "reservation_session" CASCADE;--> statement-breakpoint
ALTER TABLE "reservation" ADD COLUMN "date" date NOT NULL;--> statement-breakpoint
ALTER TABLE "reservation" ADD COLUMN "start_time" time NOT NULL;--> statement-breakpoint
ALTER TABLE "reservation" ADD COLUMN "end_time" time NOT NULL;--> statement-breakpoint
ALTER TABLE "reservation" DROP COLUMN "start_date";--> statement-breakpoint
ALTER TABLE "reservation" DROP COLUMN "end_date";