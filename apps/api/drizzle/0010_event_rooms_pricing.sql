-- Create enum for session types
DO $$ BEGIN
  CREATE TYPE "public"."session_type" AS ENUM('half_session', 'full_session', 'social_event', 'flat');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create gastronomic_service table
CREATE TABLE "gastronomic_service" (
  "id" text PRIMARY KEY NOT NULL,
  "workspace_id" text NOT NULL REFERENCES "public"."workspace"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "price_per_pax" integer NOT NULL,
  "description" text,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Create room_tariff table
CREATE TABLE "room_tariff" (
  "id" text PRIMARY KEY NOT NULL,
  "workspace_id" text NOT NULL REFERENCES "public"."workspace"("id") ON DELETE CASCADE,
  "event_room_id" text NOT NULL REFERENCES "public"."event_room"("id") ON DELETE CASCADE,
  "session_type" "public"."session_type" NOT NULL,
  "price" integer NOT NULL,
  "service_charge_percent" integer DEFAULT 10 NOT NULL,
  "modification_charge" integer DEFAULT 2000 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Add new columns to reservation table (nullable first, then we can update them)
ALTER TABLE "reservation" ADD COLUMN "room_tariff_id" text REFERENCES "public"."room_tariff"("id") ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE "reservation" ADD COLUMN "total_room_price" integer;
--> statement-breakpoint
ALTER TABLE "reservation" ADD COLUMN "total_service_price" integer;
--> statement-breakpoint
ALTER TABLE "reservation" ADD COLUMN "service_charge_amount" integer;
--> statement-breakpoint
ALTER TABLE "reservation" ADD COLUMN "grand_total" integer;
--> statement-breakpoint
ALTER TABLE "reservation" ADD COLUMN "total_pax" integer;
--> statement-breakpoint

-- Drop the old boolean columns from reservation
ALTER TABLE "reservation" DROP COLUMN "coffee_break";
--> statement-breakpoint
ALTER TABLE "reservation" DROP COLUMN "lunch";
--> statement-breakpoint
ALTER TABLE "reservation" DROP COLUMN "cocktail";
--> statement-breakpoint
ALTER TABLE "reservation" DROP COLUMN "canapes";
--> statement-breakpoint
ALTER TABLE "reservation" DROP COLUMN "open_bar";
--> statement-breakpoint

-- Create reservation_service table
CREATE TABLE "reservation_service" (
  "id" text PRIMARY KEY NOT NULL,
  "reservation_id" text NOT NULL REFERENCES "public"."reservation"("id") ON DELETE CASCADE,
  "gastronomic_service_id" text NOT NULL REFERENCES "public"."gastronomic_service"("id") ON DELETE CASCADE,
  "quantity" integer NOT NULL,
  "unit_price" integer NOT NULL,
  "total_price" integer NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);