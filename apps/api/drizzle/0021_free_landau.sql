CREATE TABLE "reservation_age_group_tariff" (
	"id" text PRIMARY KEY NOT NULL,
	"reservation_id" text NOT NULL,
	"age_group_tariff_id" text,
	"group_name" text NOT NULL,
	"min_age" integer NOT NULL,
	"max_age" integer,
	"count" integer NOT NULL,
	"unit_price" integer NOT NULL,
	"total_price" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "age_group_tariff" ADD COLUMN "valid_from" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "age_group_tariff" ADD COLUMN "valid_to" timestamp;--> statement-breakpoint
ALTER TABLE "reservation_age_group_tariff" ADD CONSTRAINT "reservation_age_group_tariff_reservation_id_reservation_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_age_group_tariff" ADD CONSTRAINT "reservation_age_group_tariff_age_group_tariff_id_age_group_tariff_id_fk" FOREIGN KEY ("age_group_tariff_id") REFERENCES "public"."age_group_tariff"("id") ON DELETE set null ON UPDATE no action;