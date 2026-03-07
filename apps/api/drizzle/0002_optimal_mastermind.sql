CREATE TABLE "event_room" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"name" text NOT NULL,
	"capacity" integer NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reservation" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"event_room_id" text NOT NULL,
	"client_name" text NOT NULL,
	"company_name" text,
	"phone" text,
	"email" text,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"adult_pax" integer DEFAULT 0 NOT NULL,
	"children_pax" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"payment_confirmed" boolean DEFAULT false,
	"coffee_break" boolean DEFAULT false,
	"lunch" boolean DEFAULT false,
	"cocktail" boolean DEFAULT false,
	"canapes" boolean DEFAULT false,
	"open_bar" boolean DEFAULT false,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "event_room" ADD CONSTRAINT "event_room_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_event_room_id_event_room_id_fk" FOREIGN KEY ("event_room_id") REFERENCES "public"."event_room"("id") ON DELETE cascade ON UPDATE no action;