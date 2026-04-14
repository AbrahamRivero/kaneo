ALTER TABLE "reservation" ADD COLUMN "room_charge_amount" integer;--> statement-breakpoint
ALTER TABLE "service" ADD COLUMN "service_charge_percent" integer DEFAULT 0 NOT NULL;