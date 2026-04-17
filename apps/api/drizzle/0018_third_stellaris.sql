CREATE TABLE "age_group_tariff" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"event_room_id" text NOT NULL,
	"name" text NOT NULL,
	"min_age" integer NOT NULL,
	"max_age" integer,
	"price" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "event_room" ADD COLUMN "has_age_based_pricing" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "reservation" ADD COLUMN "age_breakdown" jsonb;--> statement-breakpoint
ALTER TABLE "age_group_tariff" ADD CONSTRAINT "age_group_tariff_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "age_group_tariff" ADD CONSTRAINT "age_group_tariff_event_room_id_event_room_id_fk" FOREIGN KEY ("event_room_id") REFERENCES "public"."event_room"("id") ON DELETE cascade ON UPDATE no action;