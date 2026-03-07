CREATE TABLE "reservation_session" (
	"id" text PRIMARY KEY NOT NULL,
	"reservation_id" text NOT NULL,
	"date" date NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reservation" ADD COLUMN "title" text;--> statement-breakpoint
ALTER TABLE "reservation_session" ADD CONSTRAINT "reservation_session_reservation_id_reservation_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservation"("id") ON DELETE cascade ON UPDATE no action;