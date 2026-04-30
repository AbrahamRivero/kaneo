ALTER TABLE "reservation" ADD COLUMN "cancellation_reason" text;--> statement-breakpoint
ALTER TABLE "reservation" ADD COLUMN "cancelled_by" text;--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_cancelled_by_user_id_fk" FOREIGN KEY ("cancelled_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;